/**
 * Key-level RBAC derived from RESOURCES_FOR_KEY (src/server/contracts.ts) and the stored matrix.
 * Pure and free of server-only imports: shared by the state projection (reads), sync
 * authorisation (writes) and the client store (which keys a restore may touch).
 */
import type { AdminRole, PermissionAction, RolePermissionMatrix } from '../../types/cms';
import { hasRolePermission, normalizeAdminRole } from '../../utils/cmsLogic';
import { RESOURCES_FOR_KEY, SUPER_ADMIN_ONLY_KEYS, type StateKey } from '../contracts';

/** Write actions as evaluated against the matrix. `update` is used for edits of existing data. */
export type WriteAction = 'create' | 'update' | 'delete';

export const isSuperAdmin = (role: AdminRole | string): boolean => normalizeAdminRole(role) === 'Super Admin';

const isSuperAdminOnly = (key: StateKey): boolean => SUPER_ADMIN_ONLY_KEYS.includes(key);

function onAnyResource(
  role: AdminRole | string,
  key: StateKey,
  action: PermissionAction,
  matrix: RolePermissionMatrix | undefined
): boolean {
  return RESOURCES_FOR_KEY[key].some((resource) => hasRolePermission(role, resource, action, matrix));
}

/** Whether the role may read the full (staff) value of a key. */
export function canViewKey(role: AdminRole | string, key: StateKey, matrix: RolePermissionMatrix | undefined): boolean {
  if (isSuperAdminOnly(key)) return isSuperAdmin(role);
  return onAnyResource(role, key, 'view', matrix);
}

/**
 * Whether the role may perform `action` on a key. Changing or deleting existing data also needs
 * read access: a role must never overwrite documents it only receives in a reduced form.
 */
export function canWriteKey(
  role: AdminRole | string,
  key: StateKey,
  action: WriteAction,
  matrix: RolePermissionMatrix | undefined
): boolean {
  if (isSuperAdminOnly(key)) return isSuperAdmin(role);
  if (!onAnyResource(role, key, action, matrix)) return false;
  return action === 'create' || canViewKey(role, key, matrix);
}

/**
 * Whether the role may replace a whole collection or document (restore / reset / rollback):
 * it must be able to read, create, update and delete the key through the key's own resources.
 */
export function canReplaceKey(
  role: AdminRole | string,
  key: StateKey,
  matrix: RolePermissionMatrix | undefined
): boolean {
  if (isSuperAdminOnly(key)) return isSuperAdmin(role);
  return (
    canViewKey(role, key, matrix) &&
    onAnyResource(role, key, 'create', matrix) &&
    onAnyResource(role, key, 'update', matrix) &&
    onAnyResource(role, key, 'delete', matrix)
  );
}
