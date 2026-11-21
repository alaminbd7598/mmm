/**
 * In-memory data model of the demo store and its pure, copy-on-write op application.
 * Semantics mirror PrismaStore exactly (see prisma-store.ts); tests cover them here.
 */
import {
  COLLECTION_KEYS,
  type CollectionKey,
  type SingletonKey,
  type StoredUserAuth,
  type StoredCandidateAuth,
  type SyncOp,
} from '../contracts';
import type { CMSState } from '../../types/cms';
import {
  cloneJson,
  computeOrder,
  dedupeById,
  normalizeEmail,
  normalizeUsername,
  sanitizeItem,
  userColumns,
  type ApplyOpsOptions,
  type JsonObject,
  type StoredItem,
} from './documents';

export interface UserAuthState {
  passwordHash: string | null;
  mustChangePassword: boolean;
  sessionVersion: number;
}

export interface CandidateAuthState {
  passwordHash: string | null;
  sessionVersion: number;
}

export interface MemoryData {
  version: number;
  updatedAt: string;
  singletons: Partial<Record<SingletonKey, JsonObject>>;
  /** Ordered, sanitised items (no password fields). */
  collections: Record<CollectionKey, StoredItem[]>;
  userAuth: Map<string, UserAuthState>;
  candidateAuth: Map<string, CandidateAuthState>;
  /** State version of the last write per document: `<singleton key>` or `<collection key>:<id>`. */
  rowVersions: Map<string, number>;
}

export function emptyMemoryData(now: string): MemoryData {
  const collections = {} as Record<CollectionKey, StoredItem[]>;
  for (const key of COLLECTION_KEYS) collections[key] = [];
  return {
    version: 0,
    updatedAt: now,
    singletons: {},
    collections,
    userAuth: new Map(),
    candidateAuth: new Map(),
    rowVersions: new Map(),
  };
}

function writeUserAuth(
  auth: Map<string, UserAuthState>,
  id: string,
  opts: ApplyOpsOptions,
  previous: UserAuthState | undefined
): void {
  const hash = opts.passwordHashes?.[id];
  const flag = opts.mustChangePassword?.[id];
  auth.set(id, {
    passwordHash: hash ?? previous?.passwordHash ?? null,
    mustChangePassword: flag ?? previous?.mustChangePassword ?? false,
    // A password set by an administrator signs the account out everywhere.
    sessionVersion: (previous?.sessionVersion ?? 0) + (hash && previous ? 1 : 0),
  });
}

function writeCandidateAuth(
  auth: Map<string, CandidateAuthState>,
  id: string,
  opts: ApplyOpsOptions,
  previous: CandidateAuthState | undefined
): void {
  auth.set(id, {
    passwordHash: opts.candidatePasswordHashes?.[id] ?? previous?.passwordHash ?? null,
    sessionVersion: previous?.sessionVersion ?? 0,
  });
}

const rowKey = (key: string, id: string): string => `${key}:${id}`;

/**
 * Apply ops to a copy of `data`. Returns the new data with the version bumped once
 * (unless `bumpVersion` is false or there are no ops). `data` is never mutated.
 * With `opts.baseVersion`, a set / upsert-of-existing / delete whose target was written after the
 * version the sender saw is skipped and its index pushed to `conflicts` (see ApplyOpsOptions).
 */
export function applyOpsToMemory(
  data: MemoryData,
  ops: readonly SyncOp[],
  opts: ApplyOpsOptions = {},
  now: string = new Date().toISOString(),
  bumpVersion = true,
  conflicts: number[] = []
): MemoryData {
  if (!ops.length) return data;
  const next: MemoryData = {
    ...data,
    singletons: { ...data.singletons },
    collections: { ...data.collections },
    userAuth: new Map(data.userAuth),
    candidateAuth: new Map(data.candidateAuth),
    rowVersions: new Map(data.rowVersions),
  };
  const version = bumpVersion ? data.version + 1 : data.version;
  const stale = (row: string, opBase: number | undefined): boolean => {
    const written = next.rowVersions.get(row);
    return opts.baseVersion !== undefined && written !== undefined && written > (opBase ?? opts.baseVersion);
  };

  for (const [index, op] of ops.entries()) {
    if (op.op === 'set') {
      if (stale(op.key, op.base)) {
        conflicts.push(index);
        continue;
      }
      next.singletons[op.key] = cloneJson(op.value);
      next.rowVersions.set(op.key, version);
      continue;
    }
    const key = op.key;
    const current = next.collections[key];
    switch (op.op) {
      case 'upsert': {
        const item = sanitizeItem(key, op.item);
        const at = current.findIndex((i) => i.id === item.id);
        if (at !== -1 && stale(rowKey(key, item.id), op.base)) {
          conflicts.push(index);
          break;
        }
        next.rowVersions.set(rowKey(key, item.id), version);
        next.collections[key] = at === -1 ? [...current, item] : current.map((i, n) => (n === at ? item : i));
        if (key === 'users') writeUserAuth(next.userAuth, item.id, opts, next.userAuth.get(item.id));
        if (key === 'careerCandidates') writeCandidateAuth(next.candidateAuth, item.id, opts, next.candidateAuth.get(item.id));
        break;
      }
      case 'delete': {
        if (stale(rowKey(key, op.id), op.base)) {
          conflicts.push(index);
          break;
        }
        next.rowVersions.delete(rowKey(key, op.id));
        next.collections[key] = current.filter((i) => i.id !== op.id);
        if (key === 'users') next.userAuth.delete(op.id);
        if (key === 'careerCandidates') next.candidateAuth.delete(op.id);
        break;
      }
      case 'order': {
        const byId = new Map(current.map((i) => [i.id, i]));
        next.collections[key] = computeOrder(current.map((i) => i.id), op.ids).map((id) => byId.get(id)!);
        break;
      }
      case 'replace': {
        const items = dedupeById(op.items).map((i) => sanitizeItem(key, i));
        for (const old of current) next.rowVersions.delete(rowKey(key, old.id));
        for (const item of items) next.rowVersions.set(rowKey(key, item.id), version);
        next.collections[key] = items;
        if (key === 'users') {
          const previous = next.userAuth;
          next.userAuth = new Map();
          for (const item of items) writeUserAuth(next.userAuth, item.id, opts, previous.get(item.id));
        }
        if (key === 'careerCandidates') {
          const previous = next.candidateAuth;
          next.candidateAuth = new Map();
          for (const item of items) writeCandidateAuth(next.candidateAuth, item.id, opts, previous.get(item.id));
        }
        break;
      }
    }
  }

  if (bumpVersion) {
    next.version = version;
    next.updatedAt = now;
  }
  return next;
}

export function memorySnapshotState(data: MemoryData): CMSState {
  const state: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data.singletons)) state[key] = cloneJson(value);
  for (const key of COLLECTION_KEYS) state[key] = cloneJson(data.collections[key]);
  return state as unknown as CMSState;
}

function toUserAuth(data: MemoryData, item: StoredItem): StoredUserAuth {
  const cols = userColumns(item);
  const auth = data.userAuth.get(item.id);
  return {
    id: item.id,
    username: cols.username,
    role: cols.role as StoredUserAuth['role'],
    passwordHash: auth?.passwordHash ?? null,
    mustChangePassword: auth?.mustChangePassword ?? false,
    disabled: cols.disabled,
    sessionVersion: auth?.sessionVersion ?? 0,
  };
}

/** Case-insensitive, like the default MySQL collation used by PrismaStore. */
export function findUserAuthByUsername(data: MemoryData, username: string): StoredUserAuth | null {
  const wanted = normalizeUsername(username).toLowerCase();
  if (!wanted) return null;
  const item = data.collections.users.find((u) => userColumns(u).username.toLowerCase() === wanted);
  return item ? toUserAuth(data, item) : null;
}

export function findUserAuthById(data: MemoryData, id: string): StoredUserAuth | null {
  const item = data.collections.users.find((u) => u.id === id);
  return item ? toUserAuth(data, item) : null;
}

export function findCandidateAuthByEmail(data: MemoryData, email: string): StoredCandidateAuth | null {
  const wanted = normalizeEmail(email);
  if (!wanted) return null;
  const item = data.collections.careerCandidates.find((c) => normalizeEmail(c.email) === wanted);
  if (!item) return null;
  const auth = data.candidateAuth.get(item.id);
  return { id: item.id, email: wanted, passwordHash: auth?.passwordHash ?? null, sessionVersion: auth?.sessionVersion ?? 0 };
}
