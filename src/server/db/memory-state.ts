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
}

export interface MemoryData {
  version: number;
  updatedAt: string;
  singletons: Partial<Record<SingletonKey, JsonObject>>;
  /** Ordered, sanitised items (no password fields). */
  collections: Record<CollectionKey, StoredItem[]>;
  userAuth: Map<string, UserAuthState>;
  candidateAuth: Map<string, string | null>;
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
  });
}

function writeCandidateAuth(
  auth: Map<string, string | null>,
  id: string,
  opts: ApplyOpsOptions,
  previous: string | null | undefined
): void {
  auth.set(id, opts.candidatePasswordHashes?.[id] ?? previous ?? null);
}

/**
 * Apply ops to a copy of `data`. Returns the new data with the version bumped once
 * (unless `bumpVersion` is false or there are no ops). `data` is never mutated.
 */
export function applyOpsToMemory(
  data: MemoryData,
  ops: readonly SyncOp[],
  opts: ApplyOpsOptions = {},
  now: string = new Date().toISOString(),
  bumpVersion = true
): MemoryData {
  if (!ops.length) return data;
  const next: MemoryData = {
    ...data,
    singletons: { ...data.singletons },
    collections: { ...data.collections },
    userAuth: new Map(data.userAuth),
    candidateAuth: new Map(data.candidateAuth),
  };

  for (const op of ops) {
    if (op.op === 'set') {
      next.singletons[op.key] = cloneJson(op.value);
      continue;
    }
    const key = op.key;
    const current = next.collections[key];
    switch (op.op) {
      case 'upsert': {
        const item = sanitizeItem(key, op.item);
        const at = current.findIndex((i) => i.id === item.id);
        next.collections[key] = at === -1 ? [...current, item] : current.map((i, n) => (n === at ? item : i));
        if (key === 'users') writeUserAuth(next.userAuth, item.id, opts, next.userAuth.get(item.id));
        if (key === 'careerCandidates') writeCandidateAuth(next.candidateAuth, item.id, opts, next.candidateAuth.get(item.id));
        break;
      }
      case 'delete': {
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
    next.version = data.version + 1;
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
  return { id: item.id, email: wanted, passwordHash: data.candidateAuth.get(item.id) ?? null };
}
