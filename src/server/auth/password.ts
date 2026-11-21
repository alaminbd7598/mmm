import bcrypt from 'bcryptjs';
import { MIN_PASSWORD_LENGTH } from '../contracts';

export const BCRYPT_COST = 12;

/** bcrypt only uses the first 72 bytes of its input; longer passwords would be silently truncated. */
export const MAX_PASSWORD_BYTES = 72;

/**
 * Passwords that are never accepted: the defaults shipped by the legacy app (public in its
 * source) and the most common passwords that would otherwise satisfy the length and
 * letter + digit rules. Compared case-insensitively.
 */
export const BLOCKED_PASSWORDS: readonly string[] = [
  'admin123',
  'chairman123',
  'principal123',
  'teacher123',
  'manager123',
  '123456',
  'password123',
  'password1234',
  'password12345',
  'passw0rd123',
  'p@ssw0rd123',
  'qwerty12345',
  'qwerty123456',
  'abc1234567',
  'abcd123456',
  'abc123456789',
  '1234567890a',
  'a1234567890',
  '1q2w3e4r5t',
  '1q2w3e4r5t6y',
  'q1w2e3r4t5',
  'iloveyou123',
  'welcome12345',
  'admin12345',
  'admin123456',
  'administrator1',
  'letmein12345',
  'bangladesh123',
  'madrasah123',
  'maharat123',
  'maharat2026',
  'maharat2027',
];

/**
 * Valid cost-12 bcrypt hash of a random, discarded string. Compared against when a login names an
 * unknown user so that response time does not reveal whether the username exists.
 */
const TIMING_DUMMY_HASH = '$2b$12$fHCtY6AkzieSHDm6wgYTVOcDQYjvtNMXyIJzYKHg/Vonv19SHMdDG';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

/** Constant-time comparison via bcrypt. A missing hash always fails (after equivalent work). */
export async function verifyPassword(plain: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) {
    await bcrypt.compare(plain, TIMING_DUMMY_HASH);
    return false;
  }
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    // Malformed stored hash: treat as a failed login rather than a server error.
    return false;
  }
}

export type PasswordPolicyCode =
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'NEEDS_LETTER_AND_DIGIT'
  | 'SAME_AS_USERNAME'
  | 'CONTAINS_USERNAME'
  | 'TOO_COMMON';

export type PasswordValidation =
  | { ok: true; error?: undefined; code?: undefined }
  | { ok: false; error: string; code: PasswordPolicyCode };

const fail = (code: PasswordPolicyCode, error: string): PasswordValidation => ({ ok: false, code, error });

/** Password policy for every newly chosen staff or candidate password. */
export function validateNewPassword(pw: string, username?: string): PasswordValidation {
  if (pw.length < MIN_PASSWORD_LENGTH) {
    return fail('TOO_SHORT', `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
  }
  if (Buffer.byteLength(pw, 'utf8') > MAX_PASSWORD_BYTES) {
    return fail('TOO_LONG', `Password must be at most ${MAX_PASSWORD_BYTES} bytes long.`);
  }
  if (!/\p{L}/u.test(pw) || !/\p{N}/u.test(pw)) {
    return fail('NEEDS_LETTER_AND_DIGIT', 'Password must contain both letters and digits.');
  }
  const lowered = pw.trim().toLowerCase();
  const name = (username || '').trim().toLowerCase();
  if (name && lowered === name) {
    return fail('SAME_AS_USERNAME', 'Password must not be the same as the username.');
  }
  // For email usernames only the part before "@" is checked.
  const namePart = name.split('@')[0];
  if (namePart.length >= 4 && lowered.includes(namePart)) {
    return fail('CONTAINS_USERNAME', 'Password must not contain the username.');
  }
  if (BLOCKED_PASSWORDS.includes(lowered)) {
    return fail('TOO_COMMON', 'This password is too common or a known default and cannot be used.');
  }
  return { ok: true };
}
