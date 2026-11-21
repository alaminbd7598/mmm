import type { AdminUser } from '../../types/cms';
import { normalizeAdminRole } from '../../utils/cmsLogic';
import type { SafeUser, StoredUserAuth } from '../contracts';

/**
 * Browser-safe user profile: the snapshot's AdminUser entry without password data, with the
 * authoritative id/username/role/mustChangePassword from the auth record. When the profile entry
 * is missing, only the fields the auth record actually holds are returned.
 */
export function toSafeUser(profile: AdminUser | undefined, auth: StoredUserAuth): SafeUser {
  const base: Record<string, unknown> = profile ? { ...profile } : { fullName: auth.username, email: '', createdAt: '' };
  delete base.password;
  delete base.passwordHash;
  return {
    ...(base as Omit<AdminUser, 'password'>),
    id: auth.id,
    username: auth.username,
    role: normalizeAdminRole(auth.role),
    mustChangePassword: auth.mustChangePassword,
  };
}

export function findProfile(users: AdminUser[] | undefined, userId: string): AdminUser | undefined {
  return (users || []).find((u) => u.id === userId);
}
