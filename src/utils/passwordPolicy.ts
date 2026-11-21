/**
 * Password policy for every newly chosen staff or candidate password. Pure and shared: the server
 * enforces it, and admin forms check it first so a refused password is reported before saving.
 */
import { MIN_PASSWORD_LENGTH } from '../server/contracts';

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

export function validateNewPassword(pw: string, username?: string): PasswordValidation {
  if (pw.length < MIN_PASSWORD_LENGTH) {
    return fail('TOO_SHORT', `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
  }
  if (new TextEncoder().encode(pw).byteLength > MAX_PASSWORD_BYTES) {
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
