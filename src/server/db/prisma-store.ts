/** Database-mode DataStore: Prisma 7 over MySQL/MariaDB. Semantics match memory-state.ts. */
import {
  COLLECTION_KEYS,
  SINGLETON_KEYS,
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
  computeOrder,
  dedupeById,
  indexedColumns,
  normalizeEmail,
  normalizeUsername,
  sanitizeItem,
  type ApplyOpsOptions,
  type StoredItem,
} from './documents';
import { StoreConflictError, StoreNotFoundError, StoreUnavailableError } from './errors';
import type { DbClient } from './prisma-client';
import { COLLECTION_TABLES, POSITION_ORDER, type CollectionTable, type Tx } from './prisma-tables';
import type { SeedPlan } from './seed';

const META_ID = 1;
const TX_OPTIONS = { maxWait: 10_000, timeout: 60_000 } as const;

function knownCode(err: unknown): string | undefined {
  return err instanceof Prisma.PrismaClientKnownRequestError ? err.code : undefined;
}

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
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return new StoreUnavailableError('Database is unreachable.');
  }
  return err;
}

function parseDocument(raw: string): Record<string, unknown> {
  const value: unknown = JSON.parse(raw);
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export class PrismaStore implements DataStore {
  readonly mode = 'database' as const;
  private initPromise: Promise<void> | null = null;

  constructor(
    private readonly db: DbClient,
    private readonly loadSeed: () => Promise<SeedPlan>
  ) {}

  init(): Promise<void> {
    this.initPromise ??= this.ensureSeeded().catch((err) => {
      this.initPromise = null;
      throw translateError(err);
    });
    return this.initPromise;
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
        await this.writeOps(tx, plan.ops, plan.opts);
      }, TX_OPTIONS);
    } catch (err) {
      if (knownCode(err) === 'P2002' && (await this.db.siteMeta.findUnique({ where: { id: META_ID } }))) return;
      throw err;
    }
  }

  async getVersion(): Promise<{ version: number; updatedAt: string }> {
    await this.init();
    const meta = await this.db.siteMeta.findUnique({ where: { id: META_ID } });
    if (!meta) throw new StoreUnavailableError('Database is not seeded.');
    return { version: meta.version, updatedAt: meta.updatedAt.toISOString() };
  }

  async getSnapshot(): Promise<StateSnapshot> {
    await this.init();
    try {
      // One read transaction so the snapshot is consistent with its version.
      return await this.db.$transaction(async (tx) => {
        const meta = await tx.siteMeta.findUnique({ where: { id: META_ID } });
        if (!meta) throw new StoreUnavailableError('Database is not seeded.');
        const state: Record<string, unknown> = {};
        for (const row of await tx.siteSetting.findMany()) state[row.key] = parseDocument(row.data);
        // Singletons added to the code after this database was seeded fall back to their defaults.
        for (const key of SINGLETON_KEYS) {
          if (!(key in state) && INITIAL_CMS_STATE[key] !== undefined) state[key] = INITIAL_CMS_STATE[key];
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
      }, TX_OPTIONS);
    } catch (err) {
      throw translateError(err);
    }
  }

  async applyOps(ops: SyncOp[], opts: ApplyOpsOptions = {}): Promise<{ version: number; updatedAt: string }> {
    await this.init();
    if (!ops.length) return this.getVersion();
    try {
      return await this.db.$transaction(async (tx) => {
        // Bumping first takes the SiteMeta row lock, serialising writers (no deadlocks, stable positions).
        const meta = await tx.siteMeta.update({ where: { id: META_ID }, data: { version: { increment: 1 } } });
        await this.writeOps(tx, ops, opts);
        return { version: meta.version, updatedAt: meta.updatedAt.toISOString() };
      }, TX_OPTIONS);
    } catch (err) {
      throw translateError(err);
    }
  }

  private async writeOps(tx: Tx, ops: readonly SyncOp[], opts: ApplyOpsOptions): Promise<void> {
    for (const op of ops) {
      switch (op.op) {
        case 'set': {
          const data = JSON.stringify(op.value);
          await tx.siteSetting.upsert({ where: { key: op.key }, create: { key: op.key, data }, update: { data } });
          break;
        }
        case 'upsert':
          await this.upsertItem(tx, op.key, op.item, opts);
          break;
        case 'delete': {
          const t = COLLECTION_TABLES[op.key];
          await t.delegate(tx).deleteMany({ where: { ...t.scope, id: op.id } });
          break;
        }
        case 'order':
          await this.reorder(tx, op.key, op.ids);
          break;
        case 'replace':
          await this.replaceCollection(tx, op.key, op.items, opts);
          break;
      }
    }
  }

  /** Columns derived from the item plus auth columns for users / candidates. */
  private rowFields(
    key: CollectionKey,
    item: StoredItem,
    opts: ApplyOpsOptions,
    previous: { passwordHash?: string | null; mustChangePassword?: boolean } | null
  ): Record<string, unknown> {
    const fields: Record<string, unknown> = { data: JSON.stringify(item), ...indexedColumns(key, item) };
    if (key === 'users') {
      fields.passwordHash = opts.passwordHashes?.[item.id] ?? previous?.passwordHash ?? null;
      fields.mustChangePassword = opts.mustChangePassword?.[item.id] ?? previous?.mustChangePassword ?? false;
    } else if (key === 'careerCandidates') {
      fields.passwordHash = opts.candidatePasswordHashes?.[item.id] ?? previous?.passwordHash ?? null;
    }
    return fields;
  }

  private authSelect(key: CollectionKey): Record<string, true> {
    if (key === 'users') return { id: true, position: true, passwordHash: true, mustChangePassword: true };
    if (key === 'careerCandidates') return { id: true, position: true, passwordHash: true };
    return { id: true, position: true };
  }

  private async upsertItem(tx: Tx, key: CollectionKey, raw: StoredItem, opts: ApplyOpsOptions): Promise<void> {
    const t: CollectionTable = COLLECTION_TABLES[key];
    const d = t.delegate(tx);
    const item = sanitizeItem(key, raw);
    const where = { ...t.scope, id: item.id };
    const existing = await d.findFirst({ where, select: this.authSelect(key) });
    const fields = this.rowFields(key, item, opts, existing);
    if (existing) {
      await d.updateMany({ where, data: fields });
      return;
    }
    const max = await d.aggregate({ where: t.scope, _max: { position: true } });
    await d.create({ data: { ...t.scope, id: item.id, position: (max._max.position ?? -1) + 1, ...fields } });
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
    opts: ApplyOpsOptions
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
        ...this.rowFields(key, item, opts, previous.get(item.id) ?? null),
      })),
    });
  }

  async getUserAuthByUsername(username: string): Promise<StoredUserAuth | null> {
    const wanted = normalizeUsername(username);
    if (!wanted) return null;
    await this.init();
    return this.toUserAuth(await this.db.user.findUnique({ where: { username: wanted } }));
  }

  async getUserAuthById(id: string): Promise<StoredUserAuth | null> {
    await this.init();
    return this.toUserAuth(await this.db.user.findUnique({ where: { id } }));
  }

  private toUserAuth(
    row: { id: string; username: string; role: string; passwordHash: string | null; mustChangePassword: boolean; disabled: boolean } | null
  ): StoredUserAuth | null {
    if (!row) return null;
    return {
      id: row.id,
      username: row.username,
      role: normalizeAdminRole(row.role),
      passwordHash: row.passwordHash,
      mustChangePassword: row.mustChangePassword,
      disabled: row.disabled,
    };
  }

  async setUserPassword(id: string, passwordHash: string, mustChangePassword: boolean): Promise<void> {
    await this.init();
    const { count } = await this.db.user.updateMany({ where: { id }, data: { passwordHash, mustChangePassword } });
    if (!count) throw new StoreNotFoundError('User not found.');
  }

  async getCandidateAuthByEmail(email: string): Promise<StoredCandidateAuth | null> {
    const wanted = normalizeEmail(email);
    if (!wanted) return null;
    await this.init();
    const row = await this.db.careerCandidate.findUnique({ where: { email: wanted } });
    return row ? { id: row.id, email: row.email ?? wanted, passwordHash: row.passwordHash } : null;
  }

  async setCandidatePassword(id: string, passwordHash: string): Promise<void> {
    await this.init();
    const { count } = await this.db.careerCandidate.updateMany({ where: { id }, data: { passwordHash } });
    if (!count) throw new StoreNotFoundError('Candidate not found.');
  }
}
