import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MIN_PASSWORD_LENGTH } from '../contracts';
import { LEGACY_DEFAULT_PASSWORDS, hashPassword, validateNewPassword, verifyPassword } from './password';

test('validateNewPassword accepts a strong password', () => {
  assert.deepEqual(validateNewPassword('Madrasah2027', 'admin'), { ok: true });
});

test('validateNewPassword enforces the minimum length', () => {
  const r = validateNewPassword('ab1'.padEnd(MIN_PASSWORD_LENGTH - 1, 'c'));
  assert.equal(r.ok, false);
  assert.equal(r.code, 'TOO_SHORT');
});

test('validateNewPassword rejects passwords longer than bcrypt can hash', () => {
  assert.equal(validateNewPassword('a1'.repeat(37)).code, 'TOO_LONG');
  // Multi-byte characters count by bytes, not characters.
  assert.equal(validateNewPassword('১'.repeat(23) + 'abc1').code, 'TOO_LONG');
});

test('validateNewPassword requires letters and digits', () => {
  assert.equal(validateNewPassword('onlyletters').code, 'NEEDS_LETTER_AND_DIGIT');
  assert.equal(validateNewPassword('1234567890').code, 'NEEDS_LETTER_AND_DIGIT');
  // Bangla letters and digits count.
  assert.equal(validateNewPassword('মাহারাত২০২৭').ok, true);
});

test('validateNewPassword rejects the username (case-insensitive)', () => {
  assert.equal(validateNewPassword('Teacher01', 'teacher01').code, 'SAME_AS_USERNAME');
});

test('validateNewPassword rejects every legacy default', () => {
  for (const pw of LEGACY_DEFAULT_PASSWORDS) {
    assert.equal(validateNewPassword(pw).ok, false, pw);
  }
  assert.equal(validateNewPassword('ADMIN123').code, 'TOO_COMMON');
  assert.equal(validateNewPassword('principal123').code, 'TOO_COMMON');
});

test('hashPassword / verifyPassword round trip', async () => {
  const hash = await hashPassword('Correct1horse');
  assert.match(hash, /^\$2[aby]\$12\$/);
  assert.equal(await verifyPassword('Correct1horse', hash), true);
  assert.equal(await verifyPassword('wrong1horse', hash), false);
});

test('verifyPassword fails for missing or malformed hashes', async () => {
  assert.equal(await verifyPassword('anything1', null), false);
  assert.equal(await verifyPassword('anything1', undefined), false);
  assert.equal(await verifyPassword('anything1', 'not-a-bcrypt-hash'), false);
});
