/** Database-mode DataStore: Prisma 7 over MySQL/MariaDB. Semantics match memory-state.ts. */
import {
  COLLECTION_KEYS,
  SINGLETON_KEYS,
  type ApplyOpsResult,
  type CollectionKey,
  type DataStore,
  type StateSnapshot,
  type StoredCandidateAuth,
  type StoredUserAuth,
  type SyncOp,
} from '../contracts';
import type { CMSState } from '../../types/cms';
import { INITIAL_CMS_STATE } from '../../data/seedData';
import { normalizeAdminRole } from '../../utils/cmsLogic';
import { Prisma } from '../../generated/prisma/client';
import {
  cloneJson,
  computeOrder,
  dedupeById,
  deepFreeze,
  indexedColumns,
  normalizeEmail,
  normalizeUsername,
  sanitizeItem,
  type ApplyOpsOptions,
  type StoredItem,
} from './documents';
import { StoreConflictError, StoreNotFoundError, StoreStaleError, StoreUnavailableError } from './errors';
import type { DbClient } from './prisma-client';
import { COLLECTION_TABLES, POSITION_ORDER, type CollectionTable, type Tx } from './prisma-tables';
import type { SeedPlan } from './seed';

const META_ID = 1;
const TX_OPTIONS = { maxWait: 10_000, timeout: 60_000 } as const;
/** Reads give up quickly when no connection is available, so polling requests fail fast (503). */
const READ_TX_OPTIONS = { maxWait: 4_000, timeout: 30_000 } as const;

function knownCode(err: unknown): string | undefined {
  return err instanceof Prisma.PrismaClientKnownRequestError ? err.code : undefined;
}

/** Prisma codes for "cannot reach / talk to the database" (server down, pool exhausted, timeouts). */
const UNAVAILABLE_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024', 'P2028', 'P2037', 'P2039']);

function isConnectionFailure(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientInitializationError) return true;
  if (!(err instanceof Error)) return false;
  if (err.name === 'DriverAdapterError') return true;
  return /pool (timeout|failed)|failed to retrieve a connection|ECONNREFUSED|ECONNRESET|ETIMEDOUT|socket has been ended/i.test(
    err.message
  );
}

/** After a connection failure, requests are refused at once for this long instead of each waiting for the pool. */
const OUTAGE_COOLDOWN_MS = 5_000;
const UNREACHABLE_MESSAGE = 'Database is unreachable.';

/** Translate driver errors into store errors without exposing SQL or data. */
function translateError(err: unknown): unknown {
  const code = knownCode(err);
  if (code === 'P2002') {
    const target = (err as Prisma.PrismaClientKnownRequestError).meta?.target;
    return new StoreConflictError(`A record with the same unique value already exists${target ? ` (${String(target)})` : ''}.`);
  }
  if (code === 'P2021' || code === 'P2022') {
    return new StoreUnavailableError('Database schema is missing or outdated. Run `npm run db:push`.');
  }
  if ((code && UNAVAILABLE_CODES.has(code)) || isConnectionFailure(err)) {
    return new StoreUnavailableError(UNREACHABLE_MESSAGE);
  }
  return err;
}

/** Whether an op must be skipped because its target was written after the version the sender saw. */
function isStale(
  rowVersion: number | undefined,
  opBase: number | undefined,
  opts: ApplyOpsOptions,
  writeVersion: number
): boolean {
  // A row written earlier in this same transaction is not somebody else's change.
  if (opts.baseVersion === undefined || rowVersion === undefined || rowVersion === writeVersion) return false;
  return rowVersion > (opBase ?? opts.baseVersion);
}

function parseDocument(raw: string): Record<string, unknown> {
  const value: unknown = JSON.parse(raw);
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export class PrismaStore implements DataStore {
  readonly mode = 'database' as const;
  private initPromise: Promise<void> | null = null;
  /**
   * The last loaded snapshot. Every request needs the state, so it is read from the database
   * once per version (one cheap version query per request otherwise) instead of on every call.
   */
  private cached: StateSnapshot | null = null;

  /**
   * @param loadSeed produces the seed plan for an empty database.
   * @param bootstrap runs once per process after seeding and sets the first administrator password
   *   when it can; resolves to true when sign-in is still impossible afterwards.
   */
  constructor(
    private readonly db: DbClient,
    private readonly loadSeed: () => Promise<SeedPlan>,
    private readonly bootstrap?: (store: PrismaStore) => Promise<boolean>
  ) {}

  /** True after `bootstrap` reported that no Super Admin has a password; re-checked until one has. */
  private passwordPending = false;

  init(): Promise<void> {
    this.initPromise ??= this.guarded(() => this.ensureSeeded())
      .then(async () => {
        this.passwordPending = (await this.bootstrap?.(this)) ?? false;
      })
      .catch((err) => {
        this.initPromise = null;
        throw this.failure(err);
      });
    return this.initPromise;
  }

  /** While in the future, the database was just found unreachable and requests fail immediately. */
  private unreachableUntil = 0;

  private assertReachable(): void {
    if (Date.now() < this.unreachableUntil) throw new StoreUnavailableError(UNREACHABLE_MESSAGE);
  }

  /** Translates a driver failure; a connection failure also starts the fail-fast window. */
  private failure(err: unknown): unknown {
    const translated = translateError(err);
    if (translated instanceof StoreUnavailableError && translated.message === UNREACHABLE_MESSAGE) {
      this.unreachableUntil = Date.now() + OUTAGE_COOLDOWN_MS;
    }
    return translated;
  }

  /** Runs database work, translating driver failures into store errors. */
  private async guarded<T>(run: () => Promise<T>): Promise<T> {
    this.assertReachable();
    try {
      return await run();
    } catch (err) {
      throw this.failure(err);
    }
  }

  /**
   * Seeds an empty database once. The SiteMeta row is inserted first inside the seeding
   * transaction: a concurrent seeder blocks on that row and then fails with a duplicate key,
   * which means another process seeded the database, so it stops.
   */
  private async ensureSeeded(): Promise<void> {
    if (await this.db.siteMeta.findUnique({ where: { id: META_ID } })) return;
    const plan = await this.loadSeed();
    try {
      await this.db.$transaction(async (tx) => {
        await tx.siteMeta.create({ data: { id: META_ID, version: 1 } });
        await this.writeOps(tx, plan.ops, plan.opts, 1);
      }, TX_OPTIONS);
    } catch (err) {
      if (knownCode(err) === 'P2002' && (await this.db.siteMeta.findUnique({ where: { id: META_ID } }))) return;
      throw err;
    }
  }

  async getVersion(): Promise<{ version: number; updatedAt: string }> {
    await this.init();
    const meta = await this.guarded(() => this.db.siteMeta.findUnique({ where: { id: META_ID } }));
    if (!meta) throw new StoreUnavailableError('Database is not seeded.');
    return { version: meta.version, updatedAt: meta.updatedAt.toISOString() };
  }

  /** The returned snapshot is shared and frozen: callers must copy before changing anything. */
  async getSnapshot(): Promise<StateSnapshot> {
    const current = await this.getVersion();
    if (this.cached && this.cached.version === current.version) return this.cached;
    try {
      // One read transaction so the snapshot is consistent with its version.
      const snapshot = await this.db.$transaction(async (tx) => {
        const meta = await tx.siteMeta.findUnique({ where: { id: META_ID } });
        if (!meta) throw new StoreUnavailableError('Database is not seeded.');
        const state: Record<string, unknown> = {};
        for (const row of await tx.siteSetting.findMany()) state[row.key] = parseDocument(row.data);
        // Singletons added to the code after this database was seeded fall back to their defaults.
        for (const key of SINGLETON_KEYS) {
          if (!(key in state) && INITIAL_CMS_STATE[key] !== undefined) state[key] = cloneJson(INITIAL_CMS_STATE[key]);
        }
        for (const key of COLLECTION_KEYS) {
          const t = COLLECTION_TABLES[key];
          const rows = await t.delegate(tx).findMany({
            where: t.scope,
            orderBy: POSITION_ORDER,
            select: { id: true, data: true },
          });
          state[key] = rows.map((r) => sanitizeItem(key, { ...parseDocument(r.data), id: r.id }));
        }
        return {
          version: meta.version,
          updatedAt: meta.updatedAt.toISOString(),
          state: state as unknown as CMSState,
        };
      }, READ_TX_OPTIONS);
      this.cached = deepFreeze(snapshot);
      return snapshot;
    } catch (err) {
      throw this.failure(err);
    }
  }

  async applyOps(ops: SyncOp[], opts: ApplyOpsOptions = {}): Promise<ApplyOpsResult> {
    await this.init();
    if (!ops.length) return this.getVersion();
    this.assertReachable();
    try {
      return await this.db.$transaction(async (tx) => {
        // Bumping first takes the SiteMeta row lock, serialising writers (no deadlocks, stable positions).
        // It has to be the first statement of the transaction, and a plain UPDATE: `siteMeta.update`
        // sends a SELECT before its UPDATE, and under REPEATABLE READ that SELECT would fix what this
        // transaction sees to the moment before it waited for the lock. The version checks below
        // would then read rows as they were before the writers ahead of it committed, find no
        // conflict and overwrite their changes.
        await tx.$executeRaw`UPDATE \`SiteMeta\` SET \`version\` = \`version\` + 1, \`updatedAt\` = ${new Date()} WHERE \`id\` = ${META_ID}`;
        const meta = await tx.siteMeta.findUniqueOrThrow({ where: { id: META_ID } });
        const conflicts = await this.writeOps(tx, ops, opts, meta.version);
        // Throwing rolls the whole transaction back, including the version bump.
        if (opts.atomic && conflicts.length) throw new StoreStaleError(conflicts);
        return {
          version: meta.version,
          updatedAt: meta.updatedAt.toISOString(),
          ...(conflicts.length ? { conflicts } : {}),
        };
      }, TX_OPTIONS);
    } catch (err) {
      throw this.failure(err);
    }
  }

  /** Applies the ops in order, stamping written rows with `version`. Returns the indexes of conflicting ops. */
  private async writeOps(tx: Tx, ops: readonly SyncOp[], opts: ApplyOpsOptions, version: number): Promise<number[]> {
    const conflicts: number[] = [];
    for (const [index, op] of ops.entries()) {
      switch (op.op) {
        case 'set': {
          const data = JSON.stringify(op.value);
          const existing = await tx.siteSetting.findUnique({ where: { key: op.key }, select: { version: true } });
          if (isStale(existing?.version, op.base, opts, version)) {
            conflicts.push(index);
            break;
          }
          await tx.siteSetting.upsert({
            where: { key: op.key },
            create: { key: op.key, data, version },
            update: { data, version },
          });
          break;
        }
        case 'upsert':
          if (!(await this.upsertItem(tx, op.key, op.item, opts, version, op.base))) conflicts.push(index);
          break;
        case 'delete': {
          const t = COLLECTION_TABLES[op.key];
          const where = { ...t.scope, id: op.id };
          const existing = await t.delegate(tx).findFirst({ where, select: { id: true, position: true, version: true } });
          if (isStale(existing?.version, op.base, opts, version)) {
            conflicts.push(index);
            break;
          }
          await t.delegate(tx).deleteMany({ where });
          break;
        }
        case 'order':
          await this.reorder(tx, op.key, op.ids);
          break;
        case 'replace':
          await this.replaceCollection(tx, op.key, op.items, opts, version);
          break;
      }
    }
    return conflicts;
  }

  /** Columns derived from the item plus auth columns for users / candidates. */
  private rowFields(
    key: CollectionKey,
    item: StoredItem,
    opts: ApplyOpsOptions,
    previous: { passwordHash?: string | null; mustChangePassword?: boolean; sessionVersion?: number } | null,
    version: number
  ): Record<string, unknown> {
    const fields: Record<string, unknown> = { data: JSON.stringify(item), version, ...indexedColumns(key, item) };
    if (key === 'users') {
      const newHash = opts.passwordHashes?.[item.id];
      fields.passwordHash = newHash ?? previous?.passwordHash ?? null;
      fields.mustChangePassword = opts.mustChangePassword?.[item.id] ?? previous?.mustChangePassword ?? false;
      // A password set by an administrator signs the account out everywhere.
      fields.sessionVersion = (previous?.sessionVersion ?? 0) + (newHash && previous ? 1 : 0);
    } else if (key === 'careerCandidates') {
      const newHash = opts.candidatePasswordHashes?.[item.id];
      fields.passwordHash = newHash ?? previous?.passwordHash ?? null;
      // A replaced password (backup import) signs the candidate out everywhere, like a staff reset.
      fields.sessionVersion = (previous?.sessionVersion ?? 0) + (newHash && previous ? 1 : 0);
    }
    return fields;
  }

  private authSelect(key: CollectionKey): Record<string, true> {
    const base = { id: true, position: true, version: true } as const;
    if (key === 'users') return { ...base, passwordHash: true, mustChangePassword: true, sessionVersion: true };
    if (key === 'careerCandidates') return { ...base, passwordHash: true, sessionVersion: true };
    return base;
  }

  /** Returns false (nothing written) when the stored item is newer than the version the sender saw. */
  private async upsertItem(
    tx: Tx,
    key: CollectionKey,
    raw: StoredItem,
    opts: ApplyOpsOptions,
    version: number,
    opBase?: number
  ): Promise<boolean> {
    const t: CollectionTable = COLLECTION_TABLES[key];
    const d = t.delegate(tx);
    const item = sanitizeItem(key, raw);
    const where = { ...t.scope, id: item.id };
    const existing = await d.findFirst({ where, select: this.authSelect(key) });
    if (isStale(existing?.version, opBase, opts, version)) return false;
    const fields = this.rowFields(key, item, opts, existing, version);
    if (existing) {
      await d.updateMany({ where, data: fields });
      return true;
    }
    const max = await d.aggregate({ where: t.scope, _max: { position: true } });
    await d.create({ data: { ...t.scope, id: item.id, position: (max._max.position ?? -1) + 1, ...fields } });
    return true;
  }

  private async reorder(tx: Tx, key: CollectionKey, ids: readonly string[]): Promise<void> {
    const t = COLLECTION_TABLES[key];
    const d = t.delegate(tx);
    const rows = await d.findMany({ where: t.scope, orderBy: POSITION_ORDER, select: { id: true, position: true } });
    const current = new Map(rows.map((r) => [r.id, r.position]));
    const ordered = computeOrder(rows.map((r) => r.id), ids);
    for (const [position, id] of ordered.entries()) {
      if (current.get(id) !== position) await d.updateMany({ where: { ...t.scope, id }, data: { position } });
    }
  }

  private async replaceCollection(
    tx: Tx,
    key: CollectionKey,
    rawItems: readonly StoredItem[],
    opts: ApplyOpsOptions,
    version: number
  ): Promise<void> {
    const t = COLLECTION_TABLES[key];
    const d = t.delegate(tx);
    const previous = new Map(
      key === 'users' || key === 'careerCandidates'
        ? (await d.findMany({ where: t.scope, select: this.authSelect(key) })).map((r) => [r.id, r] as const)
        : []
    );
    await d.deleteMany({ where: t.scope });
    const items = dedupeById(rawItems).map((i) => sanitizeItem(key, i));
    if (!items.length) return;
    await d.createMany({
      data: items.map((item, position) => ({
        ...t.scope,
        id: item.id,
        position,
        ...this.rowFields(key, item, opts, previous.get(item.id) ?? null, version),
      })),
    });
  }

  async getUserAuthByUsername(username: string): Promise<StoredUserAuth | null> {
    const wanted = normalizeUsername(username);
    if (!wanted) return null;
    await this.init();
    return this.toUserAuth(await this.guarded(() => this.db.user.findUnique({ where: { username: wanted } })));
  }

  async getUserAuthById(id: string): Promise<StoredUserAuth | null> {
    await this.init();
    return this.toUserAuth(await this.guarded(() => this.db.user.findUnique({ where: { id } })));
  }

  private toUserAuth(
    row: {
      id: string;
      username: string;
      role: string;
      passwordHash: string | null;
      mustChangePassword: boolean;
      disabled: boolean;
      sessionVersion: number;
    } | null
  ): StoredUserAuth | null {
    if (!row) return null;
    return {
      id: row.id,
      username: row.username,
      role: normalizeAdminRole(row.role),
      passwordHash: row.passwordHash,
      mustChangePassword: row.mustChangePassword,
      disabled: row.disabled,
      sessionVersion: row.sessionVersion,
    };
  }

  async setUserPassword(id: string, passwordHash: string, mustChangePassword: boolean): Promise<number> {
    await this.init();
    return this.guarded(async () => {
      const { count } = await this.db.user.updateMany({
        where: { id },
        data: { passwordHash, mustChangePassword, sessionVersion: { increment: 1 } },
      });
      if (!count) throw new StoreNotFoundError('User not found.');
      return (await this.db.user.findUnique({ where: { id }, select: { sessionVersion: true } }))?.sessionVersion ?? 0;
    });
  }

  async bumpUserSessionVersion(id: string): Promise<number> {
    await this.init();
    return this.guarded(async () => {
      await this.db.user.updateMany({ where: { id }, data: { sessionVersion: { increment: 1 } } });
      return (await this.db.user.findUnique({ where: { id }, select: { sessionVersion: true } }))?.sessionVersion ?? 0;
    });
  }

  async adminPasswordPending(): Promise<boolean> {
    await this.init();
    if (!this.passwordPending) return false;
    // Another process or `npm run db:import` may have set a password since this one started.
    this.passwordPending = !(await this.listSuperAdmins()).some((admin) => admin.hasPassword);
    return this.passwordPending;
  }

  /** Active Super Admin accounts in display order, with whether each has a password (bootstrap check). */
  async listSuperAdmins(): Promise<Array<{ id: string; hasPassword: boolean }>> {
    const rows = await this.guarded(() =>
      this.db.user.findMany({
        where: { role: 'Super Admin', disabled: false },
        orderBy: POSITION_ORDER,
        select: { id: true, passwordHash: true },
      })
    );
    return rows.map((r) => ({ id: r.id, hasPassword: Boolean(r.passwordHash) }));
  }

  /** Sets a password without going through init() (used by the bootstrap step inside init). */
  async setInitialPassword(id: string, passwordHash: string): Promise<void> {
    await this.guarded(() =>
      this.db.user.updateMany({
        where: { id, passwordHash: null },
        data: { passwordHash, mustChangePassword: true, sessionVersion: { increment: 1 } },
      })
    );
  }

  async getCandidateAuthByEmail(email: string): Promise<StoredCandidateAuth | null> {
    const wanted = normalizeEmail(email);
    if (!wanted) return null;
    await this.init();
    const row = await this.guarded(() => this.db.careerCandidate.findUnique({ where: { email: wanted } }));
    return row
      ? { id: row.id, email: row.email ?? wanted, passwordHash: row.passwordHash, sessionVersion: row.sessionVersion }
      : null;
  }

  async bumpCandidateSessionVersion(id: string): Promise<number> {
    await this.init();
    return this.guarded(async () => {
      await this.db.careerCandidate.updateMany({ where: { id }, data: { sessionVersion: { increment: 1 } } });
      return (
        (await this.db.careerCandidate.findUnique({ where: { id }, select: { sessionVersion: true } }))?.sessionVersion ?? 0
      );
    });
  }
}
