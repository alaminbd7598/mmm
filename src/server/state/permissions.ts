/**
 * Key-level RBAC derived from RESOURCES_FOR_KEY (src/server/contracts.ts) and the stored matrix.
 * Pure: shared by the state projection (reads) and sync authorisation (writes).
 */
import type { AdminRole, PermissionAction, RolePermissionMatrix } from '../../types/cms';
import { hasRolePermission, normalizeAdminRole } from '../../utils/cmsLogic';
import { RESOURCES_FOR_KEY, SUPER_ADMIN_ONLY_KEYS, WILDCARD_RESOURCES, type StateKey } from '../contracts';

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

function onAnyWildcard(
  role: AdminRole | string,
  action: PermissionAction,
  matrix: RolePermissionMatrix | undefined
): boolean {
  return WILDCARD_RESOURCES.some((resource) => hasRolePermission(role, resource, action, matrix));
}

/** Whether the role may read the full (staff) value of a key. */
export function canViewKey(role: AdminRole | string, key: StateKey, matrix: RolePermissionMatrix | undefined): boolean {
  if (isSuperAdminOnly(key)) return isSuperAdmin(role);
  return onAnyResource(role, key, 'view', matrix);
}

/**
 * Whether the role may perform `action` on a key.
 * `edit` on a wildcard resource (backup restore / release rollback) grants create and update on
 * every key except the Super Admin only ones; deleting single items through a wildcard also
 * needs `delete` on that wildcard resource.
 */
export function canWriteKey(
  role: AdminRole | string,
  key: StateKey,
  action: WriteAction,
  matrix: RolePermissionMatrix | undefined
): boolean {
  if (isSuperAdminOnly(key)) return isSuperAdmin(role);
  if (onAnyResource(role, key, action, matrix)) return true;
  if (!onAnyWildcard(role, 'edit', matrix)) return false;
  return action === 'delete' ? onAnyWildcard(role, 'delete', matrix) : true;
}

/** Whether the role may replace a whole collection (restore / reset / rollback). */
export function canReplaceKey(
  role: AdminRole | string,
  key: StateKey,
  matrix: RolePermissionMatrix | undefined
): boolean {
  if (isSuperAdminOnly(key)) return isSuperAdmin(role);
  const direct =
    onAnyResource(role, key, 'update', matrix) && onAnyResource(role, key, 'delete', matrix);
  return direct || onAnyWildcard(role, 'edit', matrix);
}
