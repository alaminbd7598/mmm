import test from 'node:test';
import assert from 'node:assert/strict';
import type { CMSState } from '../../types/cms';
import type { SyncOp } from '../contracts';
import { enforceSignatorySlots } from './signatories';

const user = (id: string, signatorySlot: string) => ({ id, username: id, fullName: id, role: 'Super Admin', signatorySlot, createdAt: '2026-01-01' });
const state = { users: [user('a', 'none'), user('b', 'chairman'), user('c', 'principal')] } as unknown as CMSState;

test('ops that do not write users are returned unchanged', () => {
  const ops: SyncOp[] = [{ op: 'delete', key: 'notices', id: 'n1' }];
  assert.deepEqual(enforceSignatorySlots(ops, state), ops);
});

test('assigning a slot clears it from the previous holder', () => {
  const ops: SyncOp[] = [{ op: 'upsert', key: 'users', item: user('a', 'chairman') }];
  const out = enforceSignatorySlots(ops, state);
  assert.equal(out.length, 2);
  assert.deepEqual(out[0], ops[0]);
  assert.equal(out[1].op, 'upsert');
  assert.deepEqual((out[1] as Extract<SyncOp, { op: 'upsert' }>).item, user('b', 'none'));
  // The follow-up write can never be refused as a conflict.
  assert.equal((out[1] as Extract<SyncOp, { op: 'upsert' }>).base, Number.MAX_SAFE_INTEGER);
});

test('no follow-up when the slot is free, unchanged or already cleared by the client', () => {
  assert.equal(enforceSignatorySlots([{ op: 'upsert', key: 'users', item: user('a', 'coordinator') }], state).length, 1);
  assert.equal(enforceSignatorySlots([{ op: 'upsert', key: 'users', item: user('b', 'chairman') }], state).length, 1);
  const both: SyncOp[] = [
    { op: 'upsert', key: 'users', item: user('a', 'chairman') },
    { op: 'upsert', key: 'users', item: user('b', 'none') },
  ];
  assert.equal(enforceSignatorySlots(both, state).length, 2);
});

test('the last assignment in one request wins', () => {
  const out = enforceSignatorySlots(
    [
      { op: 'upsert', key: 'users', item: user('a', 'chairman') },
      { op: 'upsert', key: 'users', item: user('c', 'chairman') },
    ],
    state
  );
  const followUps = out.slice(2).map((op) => (op as Extract<SyncOp, { op: 'upsert' }>).item);
  assert.deepEqual(followUps.map((i) => [i.id, i.signatorySlot]).sort(), [['a', 'none'], ['b', 'none']]);
});

test('a deleted holder gets no follow-up write', () => {
  const out = enforceSignatorySlots(
    [
      { op: 'upsert', key: 'users', item: user('a', 'chairman') },
      { op: 'delete', key: 'users', id: 'b' },
    ],
    state
  );
  assert.equal(out.length, 2);
});

test('a replaced user list keeps the first holder of each slot', () => {
  const out = enforceSignatorySlots(
    [{ op: 'replace', key: 'users', items: [user('x', 'principal'), user('y', 'principal'), user('z', 'chairman')] }],
    state
  );
  assert.equal(out.length, 1);
  const items = (out[0] as Extract<SyncOp, { op: 'replace' }>).items;
  assert.deepEqual(items.map((i) => i.signatorySlot), ['principal', 'none', 'chairman']);
});

test('follow-up writes carry the version of the state they were derived from', () => {
  const out = enforceSignatorySlots([{ op: 'upsert', key: 'users', item: user('a', 'chairman') }], state, 41);
  assert.equal((out[1] as Extract<SyncOp, { op: 'upsert' }>).base, 41);
});
