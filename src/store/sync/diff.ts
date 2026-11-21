/**
 * Pure helpers that turn client-side CMS state changes into server sync operations.
 *
 * The store keeps the last server-confirmed state and, after each local change, sends only the
 * difference: one `set` per changed singleton document and `upsert` / `delete` / `order` per
 * collection item. Backup restores and resets send `replace` + `set` for every key instead.
 */
import type { CMSState } from '../../types/cms';
import {
  COLLECTION_KEYS,
  SINGLETON_KEYS,
  type CollectionKey,
  type SingletonKey,
  type StateKey,
  type SyncOp,
} from '../../server/contracts';

/** Any object carrying (some of) the CMS state keys; missing keys are treated as empty. */
export type StateLike = Partial<CMSState> | Partial<Record<StateKey, unknown>>;

type SyncItem = { id: string } & Record<string, unknown>;

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Structural equality for JSON-like values (objects, arrays, primitives). */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') {
    // NaN is the only primitive not equal to itself; treat it as equal for change detection.
    return typeof a === 'number' && typeof b === 'number' && Number.isNaN(a) && Number.isNaN(b);
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  // Keys holding `undefined` are dropped by JSON serialisation, so ignore them here as well.
  const aKeys = Object.keys(ao).filter((k) => ao[k] !== undefined);
  const bKeys = Object.keys(bo).filter((k) => bo[k] !== undefined);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(bo, k) || !deepEqual(ao[k], bo[k])) return false;
  }
  return true;
}

const readKey = (state: StateLike, key: StateKey): unknown => (state as Record<string, unknown>)[key];

/** Items of a collection that carry a usable string id (others cannot be stored per item). */
function collectionItems(state: StateLike, key: CollectionKey): SyncItem[] {
  const raw = readKey(state, key);
  if (!Array.isArray(raw)) return [];
  return raw.filter((it): it is SyncItem => isPlainObject(it) && typeof it.id === 'string' && it.id.length > 0);
}

function diffSingleton(prev: StateLike, next: StateLike, key: SingletonKey): SyncOp | null {
  const a = readKey(prev, key);
  const b = readKey(next, key);
  if (a === b || !isPlainObject(b) || deepEqual(a, b)) return null;
  return { op: 'set', key, value: b };
}

function diffCollection(prev: StateLike, next: StateLike, key: CollectionKey): SyncOp[] {
  if (readKey(prev, key) === readKey(next, key)) return [];
  const before = collectionItems(prev, key);
  const after = collectionItems(next, key);
  const beforeById = new Map(before.map((it) => [it.id, it]));
  const afterIds = new Set(after.map((it) => it.id));
  const ops: SyncOp[] = [];

  for (const item of after) {
    const old = beforeById.get(item.id);
    if (!old || !deepEqual(old, item)) ops.push({ op: 'upsert', key, item });
  }
  for (const item of before) {
    if (!afterIds.has(item.id)) ops.push({ op: 'delete', key, id: item.id });
  }

  // The server appends new items; any other resulting order needs an explicit `order` op.
  const surviving = before.filter((it) => afterIds.has(it.id)).map((it) => it.id);
  const added = after.filter((it) => !beforeById.has(it.id)).map((it) => it.id);
  const expected = [...surviving, ...added];
  const actual = after.map((it) => it.id);
  if (!deepEqual(expected, actual)) ops.push({ op: 'order', key, ids: actual });
  return ops;
}

/** Ops that turn `prev` into `next`, singletons first, then collections, in contract key order. */
export function computeOps(prev: StateLike, next: StateLike): SyncOp[] {
  const ops: SyncOp[] = [];
  for (const key of SINGLETON_KEYS) {
    const op = diffSingleton(prev, next, key);
    if (op) ops.push(op);
  }
  for (const key of COLLECTION_KEYS) ops.push(...diffCollection(prev, next, key));
  return ops;
}

/**
 * `set` for every singleton and `replace` for every collection (backup restore, factory reset,
 * release rollback). `exclude` lists keys the caller may not or must not overwrite; singletons
 * that are not objects and collections that are not arrays in `state` are skipped.
 */
export function fullReplaceOps(state: StateLike, exclude: readonly StateKey[] = []): SyncOp[] {
  const skip = new Set<StateKey>(exclude);
  const ops: SyncOp[] = [];
  for (const key of SINGLETON_KEYS) {
    const value = readKey(state, key);
    if (!skip.has(key) && isPlainObject(value)) ops.push({ op: 'set', key, value });
  }
  for (const key of COLLECTION_KEYS) {
    // A key absent from the source (e.g. an older backup) is left untouched, not wiped.
    if (!skip.has(key) && Array.isArray(readKey(state, key))) {
      ops.push({ op: 'replace', key, items: collectionItems(state, key) });
    }
  }
  return ops;
}

const encoder = new TextEncoder();
const jsonBytes = (value: unknown): number => encoder.encode(JSON.stringify(value)).byteLength;

/**
 * Split ops into request-sized batches (each batch's serialized ops stay within `maxBytes`, as far
 * as single items allow). An oversized `replace` is split into a smaller `replace`, follow-up
 * `upsert`s and a final `order`, which yields the same stored result across several requests.
 * An op that is too large on its own is sent alone (the server then decides).
 */
export function chunkOps(ops: readonly SyncOp[], maxBytes: number): SyncOp[][] {
  const expanded: SyncOp[] = [];
  for (const op of ops) {
    if (op.op === 'replace' && jsonBytes(op) > maxBytes) expanded.push(...splitReplace(op, maxBytes));
    else expanded.push(op);
  }

  const chunks: SyncOp[][] = [];
  let current: SyncOp[] = [];
  let currentBytes = 2; // the surrounding JSON array brackets
  for (const op of expanded) {
    const size = jsonBytes(op) + 1; // + separating comma
    if (current.length > 0 && currentBytes + size > maxBytes) {
      chunks.push(current);
      current = [];
      currentBytes = 2;
    }
    current.push(op);
    currentBytes += size;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

function splitReplace(op: Extract<SyncOp, { op: 'replace' }>, maxBytes: number): SyncOp[] {
  const head: SyncItem[] = [];
  let headBytes = jsonBytes({ ...op, items: [] });
  let i = 0;
  for (; i < op.items.length; i += 1) {
    const size = jsonBytes(op.items[i]) + 1;
    if (head.length > 0 && headBytes + size > maxBytes) break;
    head.push(op.items[i]);
    headBytes += size;
  }
  const rest: SyncOp[] = op.items.slice(i).map((item) => ({ op: 'upsert', key: op.key, item }));
  return [
    { op: 'replace', key: op.key, items: head },
    ...rest,
    { op: 'order', key: op.key, ids: op.items.map((it) => it.id) },
  ];
}
