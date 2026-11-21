import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import type { SyncOp } from '../contracts';
import { DEMO_STAFF_PASSWORDS } from './demo-credentials';
import { buildSeedPlan, demoAccounts, ensureBootstrapPassword, type BootstrapTarget } from './seed';

type Replace = Extract<SyncOp, { op: 'replace' }>;
const seededUsers = (ops: SyncOp[]) =>
  (ops.find((op): op is Replace => op.op === 'replace' && op.key === 'users')?.items ?? []) as Array<Record<string, unknown>>;

test('a database is seeded with the administrator and the signatories only, all without passwords', async () => {
  const plan = await buildSeedPlan('database');
  const users = seededUsers(plan.ops);
  assert.deepEqual(users.map((u) => u.username), ['admin', 'chairman', 'principal', 'teacher']);
  assert.deepEqual(users.slice(1).map((u) => u.signatorySlot), ['chairman', 'principal', 'coordinator']);
  assert.deepEqual(plan.opts.passwordHashes, {});
  assert.equal(JSON.stringify(plan.ops).includes('admin123'), false);
  assert.equal(users.some((u) => 'password' in u || 'passwordHash' in u), false);
});

test('the demo keeps its five sample accounts with the documented sample passwords', async () => {
  const plan = await buildSeedPlan('demo');
  assert.equal(seededUsers(plan.ops).length, 5);
  assert.deepEqual(Object.keys(plan.opts.passwordHashes ?? {}).sort(), Object.keys(DEMO_STAFF_PASSWORDS).sort());
  assert.equal(await bcrypt.compare('admin123', plan.opts.passwordHashes?.['usr-super'] ?? ''), true);
  assert.equal(demoAccounts().length, 5);
});

function target(admins: Array<{ id: string; hasPassword: boolean }>) {
  const written: Array<{ id: string; hash: string }> = [];
  const store: BootstrapTarget = {
    listSuperAdmins: async () => admins,
    setInitialPassword: async (id, hash) => {
      written.push({ id, hash });
    },
  };
  return { store, written };
}
const quiet = () => undefined;

test('bootstrap: nothing happens without ADMIN_BOOTSTRAP_PASSWORD or when an admin can already sign in', async () => {
  const fresh = target([{ id: 'usr-super', hasPassword: false }]);
  assert.equal(await ensureBootstrapPassword(fresh.store, undefined, quiet), 'missing');
  assert.equal(await ensureBootstrapPassword(fresh.store, '   ', quiet), 'missing');
  assert.equal(fresh.written.length, 0);

  const done = target([{ id: 'usr-super', hasPassword: true }]);
  assert.equal(await ensureBootstrapPassword(done.store, 'Another-Strong-Pass-2026', quiet), 'already-set');
  assert.equal(done.written.length, 0);

  assert.equal(await ensureBootstrapPassword(target([]).store, 'Another-Strong-Pass-2026', quiet), 'no-super-admin');
});

test('bootstrap: short, denylisted or username-based values are refused', async () => {
  for (const weak of ['admin123', 'Short-pw-11', 'password12345', 'myadminpass2026', 'onlylettersonly']) {
    const fresh = target([{ id: 'usr-super', hasPassword: false }]);
    assert.equal(await ensureBootstrapPassword(fresh.store, weak, quiet), 'weak', weak);
    assert.equal(fresh.written.length, 0);
  }
});

test('bootstrap: a strong value is hashed and given to the first Super Admin only', async () => {
  const fresh = target([
    { id: 'usr-super', hasPassword: false },
    { id: 'usr-second', hasPassword: false },
  ]);
  assert.equal(await ensureBootstrapPassword(fresh.store, 'Owner-Setup-2026x', quiet), 'applied');
  assert.deepEqual(fresh.written.map((w) => w.id), ['usr-super']);
  assert.equal(await bcrypt.compare('Owner-Setup-2026x', fresh.written[0].hash), true);
});
