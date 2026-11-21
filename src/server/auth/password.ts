import bcrypt from 'bcryptjs';

export {
  BLOCKED_PASSWORDS,
  MAX_PASSWORD_BYTES,
  validateNewPassword,
  type PasswordPolicyCode,
  type PasswordValidation,
} from '../../utils/passwordPolicy';

export const BCRYPT_COST = 12;

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
