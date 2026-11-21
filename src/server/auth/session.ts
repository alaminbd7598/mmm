import 'server-only';
import { cookies } from 'next/headers';
import type { PermissionAction, RolePermissionMatrix } from '../../types/cms';
import { hasRolePermission, normalizeAdminRole, type AdminTabId } from '../../utils/cmsLogic';
import { STAFF_SESSION_COOKIE, type StaffSession } from '../contracts';
import { getStore } from '../db/store';
import { HttpError } from '../http';
import { STAFF_SESSION_TTL_SECONDS, demoAdminEnabled, signStaffToken, verifyStaffToken } from './jwt';
import { expireSessionCookie, getJwtSecret, writeSessionCookie, type CookieTarget } from './session-cookie';

export { getJwtSecret } from './session-cookie';
export type { CookieTarget } from './session-cookie';

/** Sign a staff JWT and set it as the HttpOnly session cookie (8 h). */
export async function createStaffSession(target: CookieTarget, session: StaffSession): Promise<void> {
  const store = await getStore();
  const token = await signStaffToken(session, getJwtSecret(store.mode));
  await writeSessionCookie(target, STAFF_SESSION_COOKIE, token, STAFF_SESSION_TTL_SECONDS);
}

export async function clearStaffSession(target: CookieTarget): Promise<void> {
  await expireSessionCookie(target, STAFF_SESSION_COOKIE);
}

/**
 * The signed-in staff member, or null. Besides the JWT, re-checks the stored account: it must
 * still exist, not be disabled, and have the same username, role and session version as when the
 * token was issued.
 * `mustChangePassword` is taken from the store (it is cleared server-side on password change).
 */
export async function getStaffSession(): Promise<StaffSession | null> {
  const token = (await cookies()).get(STAFF_SESSION_COOKIE)?.value;
  if (!token) return null;
  const store = await getStore();
  if (store.mode === 'demo' && !demoAdminEnabled()) return null;
  const claims = await verifyStaffToken(token, getJwtSecret(store.mode));
  if (!claims) return null;
  const user = await store.getUserAuthById(claims.userId);
  if (!user || user.disabled) return null;
  if (user.username !== claims.username || normalizeAdminRole(user.role) !== claims.role) return null;
  // Password change, admin reset and logout raise the stored version and void older tokens.
  if (user.sessionVersion !== claims.sv) return null;
  return { ...claims, mustChangePassword: user.mustChangePassword };
}

export interface RequireStaffOptions {
  /**
   * Allow sessions whose password still has to be changed. Default false: such accounts may only
   * use the auth endpoints until they pick a new password (seeded defaults are publicly known).
   */
  allowPendingPasswordChange?: boolean;
}

/** Session or HttpError(401 UNAUTHENTICATED) / HttpError(403 PASSWORD_CHANGE_REQUIRED). */
export async function requireStaff(opts: RequireStaffOptions = {}): Promise<StaffSession> {
  const session = await getStaffSession();
  if (!session) throw new HttpError(401, 'Sign-in required.', 'UNAUTHENTICATED');
  if (session.mustChangePassword && !opts.allowPendingPasswordChange) {
    throw new HttpError(403, 'Password change required before continuing.', 'PASSWORD_CHANGE_REQUIRED');
  }
  return session;
}

/** The stored RBAC matrix (falls back to the built-in default inside hasRolePermission). */
export async function getRbacMatrix(): Promise<RolePermissionMatrix | undefined> {
  const snapshot = await (await getStore()).getSnapshot();
  return snapshot.state.rbacMatrix;
}

export function staffHasPermission(
  session: StaffSession,
  resource: AdminTabId,
  action: PermissionAction,
  matrix: RolePermissionMatrix | undefined
): boolean {
  return hasRolePermission(session.role, resource, action, matrix);
}

/** Session with `action` on `resource`, else HttpError(401) / HttpError(403 FORBIDDEN). */
export async function requireStaffPermission(
  resource: AdminTabId,
  action: PermissionAction = 'view',
  opts: RequireStaffOptions = {}
): Promise<StaffSession> {
  const session = await requireStaff(opts);
  if (!staffHasPermission(session, resource, action, await getRbacMatrix())) {
    throw new HttpError(403, 'You do not have permission for this action.', 'FORBIDDEN');
  }
  return session;
}
