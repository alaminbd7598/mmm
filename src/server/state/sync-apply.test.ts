import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFLICT_REASON_PREFIX, type SyncOp } from '../contracts';
import { MemoryStore } from '../db/memory-store';
import { applySyncOps } from './sync-apply';

const user = (id: string, signatorySlot: string, fullName = id) => ({
  id,
  username: id,
  fullName,
  role: 'Super Admin',
  signatorySlot,
  createdAt: '2026-01-01',
});

async function storeWithUsers(): Promise<MemoryStore> {
  const store = new MemoryStore(async () => ({
    ops: [
      { op: 'replace', key: 'users', items: [user('a', 'none'), user('b', 'chairman'), user('c', 'principal')] },
      { op: 'replace', key: 'notices', items: [{ id: 'n1', title: 'one' }] },
    ],
    opts: {},
  }));
  await store.init();
  return store;
}

const slots = async (store: MemoryStore) =>
  Object.fromEntries((await store.getSnapshot()).state.users.map((u) => [u.id, u.signatorySlot]));
const indexed = (ops: SyncOp[]) => ops.map((op, index) => ({ index: index + 10, op }));

test('assigning a slot moves it from the previous holder in one write', async () => {
  const store = await storeWithUsers();
  const snapshot = await store.getSnapshot();
  const out = await applySyncOps(store, indexed([{ op: 'upsert', key: 'users', item: user('a', 'chairman') }]), snapshot, {
    baseVersion: snapshot.version,
  });
  assert.deepEqual(out.conflicts, []);
  assert.equal(out.version, snapshot.version + 1);
  assert.deepEqual(await slots(store), { a: 'chairman', b: 'none', c: 'principal' });
});

test('a refused assignment does not take the slot away from its holder', async () => {
  const store = await storeWithUsers();
  const loaded = (await store.getSnapshot()).version;
  // Someone else edits user "a" after this client loaded the state.
  await store.applyOps([{ op: 'upsert', key: 'users', item: user('a', 'none', 'renamed') }]);
  const snapshot = await store.getSnapshot();
  const out = await applySyncOps(
    store,
    indexed([
      { op: 'upsert', key: 'notices', item: { id: 'n1', title: 'edited' } },
      { op: 'upsert', key: 'users', item: user('a', 'chairman') },
    ]),
    snapshot,
    { baseVersion: loaded }
  );
  // All or nothing: both ops are reported under their request indexes, with the conflict prefix.
  assert.deepEqual(out.conflicts.map((c) => c.index), [10, 11]);
  assert.ok(out.conflicts.every((c) => c.reason.startsWith(CONFLICT_REASON_PREFIX)));
  assert.equal(out.version, snapshot.version, 'nothing was written, so the version did not move');
  const after = await store.getSnapshot();
  assert.deepEqual(await slots(store), { a: 'none', b: 'chairman', c: 'principal' });
  assert.equal(after.state.users.find((u) => u.id === 'a')?.fullName, 'renamed');
  assert.equal((after.state.notices as unknown as Array<{ title: string }>)[0].title, 'one');
});

test('the previous holder is not overwritten with an older copy', async () => {
  const store = await storeWithUsers();
  const snapshot = await store.getSnapshot();
  // The holder "b" is edited between the server's snapshot and its write.
  await store.applyOps([{ op: 'upsert', key: 'users', item: user('b', 'chairman', 'b renamed') }]);
  const out = await applySyncOps(store, indexed([{ op: 'upsert', key: 'users', item: user('a', 'chairman') }]), snapshot, {
    baseVersion: snapshot.version,
  });
  assert.deepEqual(out.conflicts.map((c) => c.index), [10]);
  const after = await store.getSnapshot();
  assert.deepEqual(await slots(store), { a: 'none', b: 'chairman', c: 'principal' });
  assert.equal(after.state.users.find((u) => u.id === 'b')?.fullName, 'b renamed');
});

test('batches without a slot change keep per-op conflict handling', async () => {
  const store = await storeWithUsers();
  const loaded = (await store.getSnapshot()).version;
  await store.applyOps([{ op: 'upsert', key: 'notices', item: { id: 'n1', title: 'by someone else' } }]);
  const snapshot = await store.getSnapshot();
  const out = await applySyncOps(
    store,
    indexed([
      { op: 'upsert', key: 'notices', item: { id: 'n1', title: 'mine' } },
      { op: 'upsert', key: 'users', item: user('c', 'principal', 'c renamed') },
    ]),
    snapshot,
    { baseVersion: loaded }
  );
  assert.deepEqual(out.conflicts.map((c) => c.index), [10]);
  const after = await store.getSnapshot();
  assert.equal(after.version, snapshot.version + 1);
  assert.equal(after.state.users.find((u) => u.id === 'c')?.fullName, 'c renamed');
  assert.equal((after.state.notices as unknown as Array<{ title: string }>)[0].title, 'by someone else');
});
