import bcrypt from 'bcryptjs';
import { MIN_PASSWORD_LENGTH } from '../contracts';

export const BCRYPT_COST = 12;

/** bcrypt only uses the first 72 bytes of its input; longer passwords would be silently truncated. */
export const MAX_PASSWORD_BYTES = 72;

/** Default passwords shipped by the legacy app (public in its source); never accepted as new passwords. */
export const LEGACY_DEFAULT_PASSWORDS: readonly string[] = [
  'admin123',
  'chairman123',
  'principal123',
  'teacher123',
  'manager123',
  '123456',
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
  if (username && lowered === username.trim().toLowerCase()) {
    return fail('SAME_AS_USERNAME', 'Password must not be the same as the username.');
  }
  if (LEGACY_DEFAULT_PASSWORDS.includes(lowered)) {
    return fail('TOO_COMMON', 'This password is a known default and cannot be used.');
  }
  return { ok: true };
}
