// Tests for the browser store's sync diffing (src/store/sync). Kept under src/server so that
// `npm test` (which globs src/utils and src/server) picks them up.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SyncOp } from '../../server/contracts';
import { chunkOps, computeOps, deepEqual, fullReplaceOps, publicOpsOnly } from './diff';

const news = (id: string, text = id) => ({ id, text, active: true, createdAt: '2026-01-01' });

test('deepEqual compares structure and ignores undefined-valued keys', () => {
  assert.equal(deepEqual({ a: 1, b: [1, { c: 2 }] }, { b: [1, { c: 2 }], a: 1 }), true);
  assert.equal(deepEqual({ a: 1, x: undefined }, { a: 1 }), true);
  assert.equal(deepEqual([1, 2], [2, 1]), false);
  assert.equal(deepEqual({ a: null }, { a: {} }), false);
  assert.equal(deepEqual(NaN, NaN), true);
});

test('computeOps returns nothing for identical or structurally equal state', () => {
  const s = { settings: { a: 1 }, news: [news('n1')] };
  assert.deepEqual(computeOps(s, s), []);
  assert.deepEqual(computeOps(s, structuredClone(s)), []);
});

test('computeOps emits set for a changed singleton only', () => {
  const prev = { settings: { a: 1 }, popupConfig: { on: true } };
  const next = { settings: { a: 2 }, popupConfig: { on: true } };
  assert.deepEqual(computeOps(prev, next), [{ op: 'set', key: 'settings', value: { a: 2 } }]);
});

test('computeOps upserts changed and appended items without an order op', () => {
  const prev = { news: [news('n1'), news('n2')] };
  const next = { news: [news('n1', 'edited'), news('n2'), news('n3')] };
  assert.deepEqual(computeOps(prev, next), [
    { op: 'upsert', key: 'news', item: news('n1', 'edited') },
    { op: 'upsert', key: 'news', item: news('n3') },
  ]);
});

test('computeOps orders when a new item is prepended', () => {
  const prev = { news: [news('n1')] };
  const next = { news: [news('n0'), news('n1')] };
  assert.deepEqual(computeOps(prev, next), [
    { op: 'upsert', key: 'news', item: news('n0') },
    { op: 'order', key: 'news', ids: ['n0', 'n1'] },
  ]);
});

test('computeOps deletes removed ids and reorders moved items', () => {
  const prev = { news: [news('a'), news('b'), news('c')] };
  const next = { news: [news('c'), news('a')] };
  assert.deepEqual(computeOps(prev, next), [
    { op: 'delete', key: 'news', id: 'b' },
    { op: 'order', key: 'news', ids: ['c', 'a'] },
  ]);
});

test('computeOps ignores items without a string id and unknown keys', () => {
  const prev = { news: [] as unknown[] };
  const next = { news: [{ text: 'no id' }], somethingElse: [1] } as Record<string, unknown>;
  assert.deepEqual(computeOps(prev, next), []);
});

test('fullReplaceOps covers present keys and honours exclusions', () => {
  const state = { settings: { a: 1 }, users: [{ id: 'u1' }], news: [news('n1')], rbacMatrix: { x: {} } };
  const ops = fullReplaceOps(state, ['users', 'rbacMatrix']);
  assert.deepEqual(ops, [
    { op: 'set', key: 'settings', value: { a: 1 } },
    { op: 'replace', key: 'news', items: [news('n1')] },
  ]);
});

test('publicOpsOnly keeps only new items of public-create collections', () => {
  const prev = { leads: [{ id: 'l1', name: 'old' }], news: [] };
  const next = {
    leads: [{ id: 'l2', name: 'new' }, { id: 'l1', name: 'old edited' }],
    emails: [{ id: 'e1' }],
    news: [news('n1')],
    settings: { a: 1 },
  };
  const subs = publicOpsOnly(computeOps(prev, next), prev);
  assert.deepEqual(subs, [
    { key: 'leads', item: { id: 'l2', name: 'new' } },
    { key: 'emails', item: { id: 'e1' } },
  ]);
});

const size = (ops: SyncOp[]) => new TextEncoder().encode(JSON.stringify(ops)).byteLength;

test('chunkOps keeps every batch within the byte limit and preserves op order', () => {
  const ops: SyncOp[] = Array.from({ length: 20 }, (_, i) => ({
    op: 'upsert',
    key: 'news',
    item: news(`n${i}`, 'x'.repeat(200)),
  }));
  const limit = 1_000;
  const chunks = chunkOps(ops, limit);
  assert.ok(chunks.length > 1);
  for (const c of chunks) assert.ok(size(c) <= limit, `chunk of ${size(c)} bytes`);
  assert.deepEqual(chunks.flat(), ops);
});

test('chunkOps splits an oversized replace into replace + upserts + order', () => {
  const items = Array.from({ length: 10 }, (_, i) => news(`n${i}`, 'y'.repeat(300)));
  const chunks = chunkOps([{ op: 'replace', key: 'news', items }], 1_500);
  const flat = chunks.flat();
  assert.equal(flat[0].op, 'replace');
  const replaced = flat[0].op === 'replace' ? flat[0].items.map((it) => it.id) : [];
  const upserted = flat.filter((o) => o.op === 'upsert').map((o) => (o.op === 'upsert' ? o.item.id : ''));
  assert.deepEqual([...replaced, ...upserted], items.map((it) => it.id));
  assert.deepEqual(flat[flat.length - 1], { op: 'order', key: 'news', ids: items.map((it) => it.id) });
  for (const c of chunks) assert.ok(size(c) <= 1_500);
});

test('chunkOps sends an op larger than the limit on its own', () => {
  const big: SyncOp = { op: 'set', key: 'settings', value: { blob: 'z'.repeat(5_000) } };
  const small: SyncOp = { op: 'delete', key: 'news', id: 'n1' };
  assert.deepEqual(chunkOps([small, big, small], 1_000), [[small], [big], [small]]);
});
