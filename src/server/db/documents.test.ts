import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeOrder, dedupeById, indexValue, indexedColumns, sanitizeItem } from './documents';
import { plaintextPasswords, stateToOps, summarizeOps } from './state-ops';
import { buildSeedState } from './seed';

test('computeOrder', () => {
  assert.deepEqual(computeOrder(['a', 'b', 'c', 'd'], ['c', 'x', 'a', 'c']), ['c', 'a', 'b', 'd']);
  assert.deepEqual(computeOrder([], ['a']), []);
});

test('dedupeById keeps first position and last data', () => {
  assert.deepEqual(dedupeById([{ id: 'a', v: 1 }, { id: 'b' }, { id: 'a', v: 2 }]), [{ id: 'a', v: 2 }, { id: 'b' }]);
});

test('sanitizeItem strips credentials only for auth collections', () => {
  assert.deepEqual(sanitizeItem('users', { id: 'u', password: 'x', passwordHash: 'y', fullName: 'F' }), { id: 'u', fullName: 'F' });
  assert.deepEqual(sanitizeItem('news', { id: 'n', password: 'kept' }), { id: 'n', password: 'kept' });
});

test('indexed columns are derived from the document', () => {
  assert.deepEqual(indexedColumns('users', { id: 'u1', username: ' admin ', role: 'Principal' }), {
    username: 'admin',
    role: 'Principal / Vice Principal',
    disabled: false,
  });
  assert.equal(indexedColumns('users', { id: 'u1' }).username, 'u1');
  assert.deepEqual(indexedColumns('careerCandidates', { id: 'c', email: ' A@B.C ' }), { email: 'a@b.c' });
  assert.deepEqual(indexedColumns('admissionTokens2027', { id: 't', tokenCode: 'T-1', guardianPhone: '' }), {
    tokenCode: 'T-1',
    guardianPhone: null,
  });
  assert.deepEqual(indexedColumns('news', { id: 'n' }), {});
  assert.equal(indexValue('x'.repeat(300))?.length, 191);
  assert.equal(indexValue({}), null);
});

test('stateToOps covers present keys in replace and upsert modes', () => {
  const state = { popupConfig: { enabled: true }, news: [{ id: 'a' }, { nope: 1 }, { id: 'b' }] } as never;
  assert.deepEqual(stateToOps(state, 'replace'), [
    { op: 'set', key: 'popupConfig', value: { enabled: true } },
    { op: 'replace', key: 'news', items: [{ id: 'a' }, { id: 'b' }] },
  ]);
  const upserts = stateToOps(state, 'upsert');
  assert.deepEqual(upserts.slice(1), [
    { op: 'upsert', key: 'news', item: { id: 'a' } },
    { op: 'upsert', key: 'news', item: { id: 'b' } },
    { op: 'order', key: 'news', ids: ['a', 'b'] },
  ]);
  assert.deepEqual(summarizeOps(upserts), [
    { key: 'popupConfig', kind: 'singleton', count: 1 },
    { key: 'news', kind: 'collection', count: 2 },
  ]);
});

test('seed state merges seed content over the defaults and carries no passwords', () => {
  const state = buildSeedState();
  assert.ok(state.users.length > 0);
  assert.equal(plaintextPasswords(state, 'users').size, 0);
  assert.equal(JSON.stringify(state).includes('admin123'), false);
  const ops = stateToOps(state, 'replace');
  assert.ok(ops.some((o) => o.op === 'set' && o.key === 'rbacMatrix'));
  assert.ok(ops.some((o) => o.op === 'replace' && o.key === 'departmentVideos'));
});
