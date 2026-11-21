import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SyncOp } from '../contracts';
import { extractSyncPasswords } from './sync-passwords';

test('valid user passwords are collected and stripped; weak ones reject the op', () => {
  const ops: SyncOp[] = [
    { op: 'upsert', key: 'users', item: { id: 'u1', username: 'ali', password: 'Strong123', passwordHash: 'x' } },
    { op: 'upsert', key: 'users', item: { id: 'u2', username: 'bob', password: 'short' } },
    { op: 'upsert', key: 'careerCandidates', item: { id: 'c1', password: 'whatever' } },
    { op: 'upsert', key: 'notices', item: { id: 'n1', password: 'kept-as-is' } },
  ];
  const r = extractSyncPasswords(ops.map((op, index) => ({ index, op })));
  assert.deepEqual([...r.userPasswords], [['u1', 'Strong123']]);
  assert.deepEqual(r.rejected.map((x) => x.index), [1]);
  assert.deepEqual(r.ops.map((o) => o.index), [0, 2, 3]);
  const [user, candidate, notice] = r.ops.map((o) => (o.op.op === 'upsert' ? o.op.item : null));
  assert.deepEqual(user, { id: 'u1', username: 'ali' });
  assert.deepEqual(candidate, { id: 'c1' });
  assert.equal(notice?.password, 'kept-as-is');
});

test('users without a password pass through unchanged apart from credential fields', () => {
  const r = extractSyncPasswords([
    { index: 0, op: { op: 'replace', key: 'users', items: [{ id: 'u1', username: 'a', mustChangePassword: true }] } },
  ]);
  assert.equal(r.userPasswords.size, 0);
  const op = r.ops[0].op;
  assert.ok(op.op === 'replace');
  if (op.op === 'replace') assert.deepEqual(op.items, [{ id: 'u1', username: 'a' }]);
});
