import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AdminUser } from '../../types/cms';
import type { StoredUserAuth } from '../contracts';
import { findProfile, toSafeUser } from './safe-user';

const auth: StoredUserAuth = {
  id: 'u1',
  username: 'principal',
  role: 'Principal / Vice Principal',
  passwordHash: '$2b$12$hash',
  mustChangePassword: true,
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
