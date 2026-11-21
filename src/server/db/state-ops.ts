/** Conversion of whole CMS states into sync ops (seeding and backup import). Pure. */
import {
  COLLECTION_KEYS,
  SINGLETON_KEYS,
  type CollectionKey,
  type SingletonKey,
  type SyncOp,
} from '../contracts';
import type { CMSState } from '../../types/cms';
import { AUTH_COLLECTIONS, type StoredItem } from './documents';

export type CollectionWriteMode = 'replace' | 'upsert';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isStoredItem(value: unknown): value is StoredItem {
  return isPlainObject(value) && typeof value.id === 'string' && value.id.length > 0;
}

/**
 * Ops that write every key present in `state`:
 * singletons -> `set`; collections -> one `replace`, or per-item `upsert` followed by an `order`.
 * Keys absent from `state` produce no op. Collection entries without a string id are skipped.
 */
export function stateToOps(state: Partial<CMSState>, mode: CollectionWriteMode): SyncOp[] {
  const source = state as Record<string, unknown>;
  const ops: SyncOp[] = [];
  for (const key of SINGLETON_KEYS) {
    const value = source[key];
    if (isPlainObject(value)) ops.push({ op: 'set', key, value });
  }
  for (const key of COLLECTION_KEYS) {
    const value = source[key];
    if (!Array.isArray(value)) continue;
    const items = value.filter(isStoredItem);
    if (mode === 'replace') {
      ops.push({ op: 'replace', key, items });
    } else {
      for (const item of items) ops.push({ op: 'upsert', key, item });
      if (items.length) ops.push({ op: 'order', key, ids: items.map((i) => i.id) });
    }
  }
  return ops;
}

/** Plaintext `password` values carried by items of a collection, keyed by item id. */
export function plaintextPasswords(state: Partial<CMSState>, key: 'users' | 'careerCandidates'): Map<string, string> {
  const out = new Map<string, string>();
  const list = (state as Record<string, unknown>)[key];
  if (!Array.isArray(list)) return out;
  for (const item of list) {
    if (isStoredItem(item) && typeof item.password === 'string' && item.password.length > 0) {
      out.set(item.id, item.password);
    }
  }
  return out;
}

/**
 * Fields of user / candidate items that mirror auth columns. A backup file must not carry them
 * into the stored documents: hashes, session versions and the must-change flag are only ever
 * written by the store, from the hashes the importer computes (ApplyOpsOptions).
 */
export const IMPORTED_AUTH_FIELDS = ['password', 'passwordHash', 'sessionVersion', 'mustChangePassword'] as const;

/** Copy of `state` whose `users` and `careerCandidates` items have no auth fields. Other keys are shared, not copied. */
export function withoutAuthFields(state: Partial<CMSState>): Partial<CMSState> {
  const out: Record<string, unknown> = { ...state };
  for (const key of AUTH_COLLECTIONS) {
    const list = out[key];
    if (!Array.isArray(list)) continue;
    out[key] = list.map((item: unknown) => {
      if (!isPlainObject(item)) return item;
      const copy = { ...item };
      for (const field of IMPORTED_AUTH_FIELDS) delete copy[field];
      return copy;
    });
  }
  return out as Partial<CMSState>;
}

export interface KeySummary {
  key: SingletonKey | CollectionKey;
  kind: 'singleton' | 'collection';
  count: number;
}

/** Per-key counts of what the ops write (no item content). */
export function summarizeOps(ops: readonly SyncOp[]): KeySummary[] {
  const out: KeySummary[] = [];
  const upserts = new Map<CollectionKey, number>();
  for (const op of ops) {
    if (op.op === 'set') out.push({ key: op.key, kind: 'singleton', count: 1 });
    else if (op.op === 'replace') out.push({ key: op.key, kind: 'collection', count: op.items.length });
    else if (op.op === 'upsert') upserts.set(op.key, (upserts.get(op.key) ?? 0) + 1);
  }
  for (const [key, count] of upserts) out.push({ key, kind: 'collection', count });
  return out;
}
