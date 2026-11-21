import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AdminUser } from '../../types/cms';
import type { StoredUserAuth } from '../contracts';
import { awaitsBootstrapPassword, findProfile, toSafeUser } from './safe-user';

const auth: StoredUserAuth = {
  id: 'u1',
  username: 'principal',
  role: 'Principal / Vice Principal',
  passwordHash: '$2b$12$hash',
  mustChangePassword: true,
  sessionVersion: 0,
};

test('toSafeUser strips password fields and uses the auth record', () => {
  const profile = {
    id: 'u1',
    username: 'old-name',
    password: 'plaintext',
    passwordHash: 'h',
    fullName: 'Principal',
    email: 'p@example.com',
    role: 'Super Admin',
    createdAt: '2026-01-01',
  } as AdminUser & { passwordHash: string };
  const safe = toSafeUser(profile, auth) as Record<string, unknown>;
  assert.equal('password' in safe, false);
  assert.equal('passwordHash' in safe, false);
  assert.equal(safe.username, 'principal');
  assert.equal(safe.role, 'Principal / Vice Principal');
  assert.equal(safe.mustChangePassword, true);
  assert.equal(safe.fullName, 'Principal');
});

test('toSafeUser without a profile and findProfile', () => {
  const safe = toSafeUser(undefined, auth);
  assert.equal(safe.id, 'u1');
  assert.equal(safe.fullName, 'principal');
  assert.equal(findProfile(undefined, 'u1'), undefined);
});

test('the setup notice is given only for a passwordless Super Admin while the site is in its public setup state', async () => {
  const admin = { role: 'Super Admin', passwordHash: null, disabled: false } as const;
  let asked = 0;
  const pending = (value: boolean) => async () => {
    asked += 1;
    return value;
  };
  assert.equal(await awaitsBootstrapPassword(admin, pending(true)), true);
  // Another Super Admin already has a password: answered like a wrong password (no account oracle).
  assert.equal(await awaitsBootstrapPassword(admin, pending(false)), false);
  asked = 0;
  assert.equal(await awaitsBootstrapPassword(null, pending(true)), false);
  assert.equal(await awaitsBootstrapPassword({ ...admin, passwordHash: '$2b$12$hash' }, pending(true)), false);
  assert.equal(await awaitsBootstrapPassword({ ...admin, disabled: true }, pending(true)), false);
  assert.equal(await awaitsBootstrapPassword({ ...admin, role: 'Coordinators / Teachers' }, pending(true)), false);
  assert.equal(asked, 0, 'the store is not asked for other accounts');
});
