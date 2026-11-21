import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SyncOp } from '../contracts';
import { MemoryStore } from './memory-store';
import { applyOpsToMemory, emptyMemoryData, memorySnapshotState, type MemoryData } from './memory-state';
import type { SeedPlan } from './seed';
import { StoreNotFoundError } from './errors';

const NOW = '2026-01-01T00:00:00.000Z';

const user = (id: string, username: string, extra: Record<string, unknown> = {}) => ({
  id,
  username,
  fullName: username,
  email: `${username}@example.test`,
  role: 'Content Managers',
  createdAt: NOW,
  ...extra,
});

function seeded(): MemoryData {
  return applyOpsToMemory(
    emptyMemoryData(NOW),
    [
      { op: 'set', key: 'popupConfig', value: { enabled: true } },
      { op: 'replace', key: 'news', items: [{ id: 'n1', text: 'a' }, { id: 'n2', text: 'b' }, { id: 'n3', text: 'c' }] },
      { op: 'replace', key: 'users', items: [user('u1', 'admin', { password: 'plain' }), user('u2', 'editor')] },
    ],
    { passwordHashes: { u1: 'hash-u1', u2: 'hash-u2' }, mustChangePassword: { u1: true } },
    NOW
  );
}

const ids = (data: MemoryData, key: 'news' | 'users') => data.collections[key].map((i) => i.id);

test('applyOps bumps the version once per call and never mutates the input', () => {
  const before = seeded();
  assert.equal(before.version, 1);
  const after = applyOpsToMemory(before, [
    { op: 'upsert', key: 'news', item: { id: 'n4', text: 'd' } },
    { op: 'delete', key: 'news', id: 'n1' },
  ]);
  assert.equal(after.version, 2);
  assert.deepEqual(ids(before, 'news'), ['n1', 'n2', 'n3']);
  assert.deepEqual(ids(after, 'news'), ['n2', 'n3', 'n4']);
  assert.equal(applyOpsToMemory(after, []), after, 'no ops -> unchanged, no bump');
});

test('set replaces the singleton document', () => {
  const data = applyOpsToMemory(seeded(), [{ op: 'set', key: 'popupConfig', value: { enabled: false, headline: 'x' } }]);
  assert.deepEqual(data.singletons.popupConfig, { enabled: false, headline: 'x' });
});

test('upsert updates in place and appends new items', () => {
  const data = applyOpsToMemory(seeded(), [
    { op: 'upsert', key: 'news', item: { id: 'n2', text: 'B' } },
    { op: 'upsert', key: 'news', item: { id: 'n0', text: 'new' } },
  ]);
  assert.deepEqual(data.collections.news, [
    { id: 'n1', text: 'a' },
    { id: 'n2', text: 'B' },
    { id: 'n3', text: 'c' },
    { id: 'n0', text: 'new' },
  ]);
});

test('order puts requested ids first, ignores unknown ids and keeps the rest in order', () => {
  const data = applyOpsToMemory(seeded(), [{ op: 'order', key: 'news', ids: ['n3', 'ghost', 'n3', 'n1'] }]);
  assert.deepEqual(ids(data, 'news'), ['n3', 'n1', 'n2']);
});

test('replace swaps the whole collection and dedupes ids (last data wins, first position kept)', () => {
  const data = applyOpsToMemory(seeded(), [
    { op: 'replace', key: 'news', items: [{ id: 'x', text: '1' }, { id: 'y', text: '2' }, { id: 'x', text: '3' }] },
  ]);
  assert.deepEqual(data.collections.news, [{ id: 'x', text: '3' }, { id: 'y', text: '2' }]);
});

test('password fields are stripped from stored user and candidate documents', () => {
  const data = applyOpsToMemory(seeded(), [
    { op: 'upsert', key: 'users', item: user('u3', 'teacher', { password: 'p', passwordHash: 'leak' }) },
    {
      op: 'upsert',
      key: 'careerCandidates',
      item: { id: 'c1', fullName: 'C', email: 'C@Example.test', phone: '1', password: 'p', createdAt: NOW },
    },
  ], { passwordHashes: { u3: 'hash-u3' }, candidatePasswordHashes: { c1: 'hash-c1' } });
  const state = memorySnapshotState(data);
  for (const u of state.users) {
    assert.equal('password' in u, false);
    assert.equal('passwordHash' in u, false);
  }
  assert.equal('password' in (state.careerCandidates ?? [])[0], false);
  assert.equal(data.userAuth.get('u3')?.passwordHash, 'hash-u3');
  assert.deepEqual(data.candidateAuth.get('c1'), { passwordHash: 'hash-c1', sessionVersion: 0 });
});

test('upsert of an existing user without a new hash keeps its hash and flag', () => {
  const data = applyOpsToMemory(seeded(), [{ op: 'upsert', key: 'users', item: user('u1', 'admin', { fullName: 'Renamed' }) }]);
  assert.deepEqual(data.userAuth.get('u1'), { passwordHash: 'hash-u1', mustChangePassword: true, sessionVersion: 0 });
  assert.equal(data.collections.users[0].fullName, 'Renamed');
});

test('upsert with a new hash replaces it; mustChangePassword only changes when given', () => {
  const data = applyOpsToMemory(seeded(), [{ op: 'upsert', key: 'users', item: user('u1', 'admin') }], {
    passwordHashes: { u1: 'hash-new' },
  });
  assert.deepEqual(data.userAuth.get('u1'), { passwordHash: 'hash-new', mustChangePassword: true, sessionVersion: 1 });
  const cleared = applyOpsToMemory(data, [{ op: 'upsert', key: 'users', item: user('u1', 'admin') }], {
    mustChangePassword: { u1: false },
  });
  assert.deepEqual(cleared.userAuth.get('u1'), { passwordHash: 'hash-new', mustChangePassword: false, sessionVersion: 1 });
});

test('delete of a user removes its auth record', () => {
  const data = applyOpsToMemory(seeded(), [{ op: 'delete', key: 'users', id: 'u2' }]);
  assert.equal(data.userAuth.has('u2'), false);
  assert.deepEqual(ids(data, 'users'), ['u1']);
});

test('replace on users preserves hashes of users that still exist and drops removed ones', () => {
  const data = applyOpsToMemory(seeded(), [
    { op: 'replace', key: 'users', items: [user('u2', 'editor'), user('u9', 'newbie')] },
  ], { passwordHashes: { u9: 'hash-u9' } });
  assert.deepEqual(ids(data, 'users'), ['u2', 'u9']);
  assert.deepEqual(data.userAuth.get('u2'), { passwordHash: 'hash-u2', mustChangePassword: false, sessionVersion: 0 });
  assert.deepEqual(data.userAuth.get('u9'), { passwordHash: 'hash-u9', mustChangePassword: false, sessionVersion: 0 });
  assert.equal(data.userAuth.has('u1'), false);
});

test('stored documents are copies: mutating the op input or a snapshot does not change the store', () => {
  const item = { id: 'n9', text: 'orig' };
  const data = applyOpsToMemory(seeded(), [{ op: 'upsert', key: 'news', item }]);
  item.text = 'mutated';
  const snap = memorySnapshotState(data);
  snap.news[0].text = 'mutated too';
  assert.equal(data.collections.news.find((n) => n.id === 'n9')?.text, 'orig');
  assert.equal(data.collections.news[0].text, 'a');
});

const fixturePlan = async (): Promise<SeedPlan> => ({
  ops: [
    { op: 'set', key: 'popupConfig', value: { enabled: true } },
    { op: 'replace', key: 'users', items: [user('u1', 'Admin', { role: 'Super Admin' })] },
    { op: 'replace', key: 'careerCandidates', items: [] },
  ] satisfies SyncOp[],
  opts: { passwordHashes: { u1: 'hash-u1' }, candidatePasswordHashes: {}, mustChangePassword: { u1: false } },
});

test('MemoryStore seeds once at version 1, even with concurrent first calls', async () => {
  let seeds = 0;
  const store = new MemoryStore(async () => {
    seeds += 1;
    return fixturePlan();
  });
  const [a, b] = await Promise.all([store.getVersion(), store.getSnapshot(), store.init()]);
  assert.equal(seeds, 1);
  assert.equal(a.version, 1);
  assert.equal((b as { version: number }).version, 1);
  const next = await store.applyOps([{ op: 'delete', key: 'news', id: 'none' }]);
  assert.equal(next.version, 2);
});

test('MemoryStore auth lookups and password updates', async () => {
  const store = new MemoryStore(fixturePlan);
  const auth = await store.getUserAuthByUsername('  admin ');
  assert.deepEqual(auth, {
    id: 'u1',
    username: 'Admin',
    role: 'Super Admin',
    passwordHash: 'hash-u1',
    mustChangePassword: false,
    disabled: false,
    sessionVersion: 0,
  });
  assert.equal(await store.setUserPassword('u1', 'hash-2', true), 1, 'a password change bumps the session version');
  assert.equal((await store.getUserAuthById('u1'))?.passwordHash, 'hash-2');
  assert.equal(await store.bumpUserSessionVersion('u1'), 2, 'logout bumps it again');
  // An administrator resetting the password through sync also signs the user out everywhere.
  await store.applyOps([{ op: 'upsert', key: 'users', item: user('u1', 'Admin', { role: 'Super Admin' }) }], {
    passwordHashes: { u1: 'hash-3' },
  });
  assert.equal((await store.getUserAuthById('u1'))?.sessionVersion, 3);
  // A plain profile edit does not.
  await store.applyOps([{ op: 'upsert', key: 'users', item: user('u1', 'Admin', { role: 'Super Admin', bio: 'x' }) }]);
  assert.equal((await store.getUserAuthById('u1'))?.sessionVersion, 3);
  await assert.rejects(store.setUserPassword('missing', 'h', false), StoreNotFoundError);

  await store.applyOps(
    [{ op: 'upsert', key: 'careerCandidates', item: { id: 'c1', email: 'Cand@Example.test', fullName: 'C', phone: '', createdAt: NOW } }],
    { candidatePasswordHashes: { c1: 'hash-c1' } }
  );
  assert.deepEqual(await store.getCandidateAuthByEmail('cand@example.TEST'), {
    id: 'c1',
    email: 'cand@example.test',
    passwordHash: 'hash-c1',
    sessionVersion: 0,
  });
  assert.equal(await store.bumpCandidateSessionVersion('c1'), 1);
  assert.equal((await store.getCandidateAuthByEmail('cand@example.test'))?.sessionVersion, 1);
  assert.equal(await store.getUserAuthByUsername(''), null);
});

test('conflict detection: a document changed after the sender\'s base version is not overwritten', async () => {
  const store = new MemoryStore(fixturePlan);
  await store.init(); // version 1
  const item = (title: string) => ({ id: 'n1', title });
  const created = await store.applyOps([{ op: 'upsert', key: 'notices', item: item('first') }], { baseVersion: 1 });
  assert.equal(created.version, 2);
  assert.equal(created.conflicts, undefined, 'creating an item never conflicts');

  // Admin A (base 2) edits; admin B still on base 2 then tries to edit, set and delete the same things.
  const a = await store.applyOps(
    [
      { op: 'upsert', key: 'notices', item: item('edit by A') },
      { op: 'set', key: 'popupConfig', value: { enabled: false } },
    ],
    { baseVersion: 2 }
  );
  assert.equal(a.conflicts, undefined);
  const b = await store.applyOps(
    [
      { op: 'upsert', key: 'notices', item: item('edit by B') },
      { op: 'set', key: 'popupConfig', value: { enabled: true, by: 'B' } },
      { op: 'delete', key: 'notices', id: 'n1' },
      { op: 'upsert', key: 'notices', item: { id: 'n2', title: 'new from B' } },
    ],
    { baseVersion: 2 }
  );
  assert.deepEqual(b.conflicts, [0, 1, 2]);
  const { state } = await store.getSnapshot();
  assert.deepEqual((state.notices as unknown as Array<{ id: string; title: string }>).map((n) => n.title), ['edit by A', 'new from B']);
  assert.deepEqual(state.popupConfig, { enabled: false });

  // B's own later write to a document it wrote itself passes with a per-op base (see SyncOp.base).
  const own = await store.applyOps([{ op: 'upsert', key: 'notices', item: { id: 'n2', title: 'B again' }, base: b.version }], {
    baseVersion: 2,
  });
  assert.equal(own.conflicts, undefined);
  // Server-originated writes (no baseVersion) always apply.
  const server = await store.applyOps([{ op: 'upsert', key: 'notices', item: item('server') }]);
  assert.equal(server.conflicts, undefined);
});
