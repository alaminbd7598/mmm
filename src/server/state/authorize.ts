/**
 * Per-op RBAC for POST /api/admin/sync (see RESOURCES_FOR_KEY in src/server/contracts.ts).
 *
 * Ops are evaluated in request order against a running view of the collections, so an upsert
 * after a delete of the same id counts as a create and Super Admin safeguards see the effect of
 * earlier ops in the same request. Pure: neither the ops nor the state are mutated.
 */
import type { CMSState, RolePermissionMatrix } from '../../types/cms';
import { hasRolePermission, normalizeAdminRole } from '../../utils/cmsLogic';
import {
  SELF_EDITABLE_USER_FIELDS,
  type CollectionKey,
  type StaffSession,
  type SyncOp,
} from '../contracts';
import { canReplaceKey, canWriteKey, isSuperAdmin, type WriteAction } from './permissions';

export interface AuthoriseResult {
  allowed: SyncOp[];
  /** Index of each allowed op in the input array (parallel to `allowed`). */
  allowedIndexes: number[];
  rejected: Array<{ index: number; reason: string }>;
}

/** Fields that are not part of the profile document (auth columns / transport-only). */
const NON_PROFILE_USER_FIELDS = new Set(['password', 'passwordHash', 'mustChangePassword']);
const SELF_EDITABLE = new Set<string>(SELF_EDITABLE_USER_FIELDS);

interface UserView {
  role: string;
  username: string;
  disabled: boolean;
}

const userView = (item: Record<string, unknown>): UserView => ({
  role: normalizeAdminRole(typeof item.role === 'string' ? item.role : undefined),
  username: typeof item.username === 'string' ? item.username.trim() : '',
  disabled: item.disabled === true,
});

/** Stable JSON comparison of two document field values (`undefined` equals missing). */
function sameValue(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b);
}

function stableStringify(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
}

/** Profile fields that differ between the stored record and the submitted item. */
export function changedUserFields(stored: Record<string, unknown>, next: Record<string, unknown>): string[] {
  const keys = new Set([...Object.keys(stored), ...Object.keys(next)]);
  const changed: string[] = [];
  for (const key of keys) {
    if (NON_PROFILE_USER_FIELDS.has(key)) continue;
    if (!sameValue(stored[key], next[key])) changed.push(key);
  }
  return changed.sort();
}

const hasPlaintextPassword = (item: Record<string, unknown>): boolean =>
  typeof item.password === 'string' && item.password.length > 0;

class RunningState {
  private readonly ids = new Map<CollectionKey, Set<string>>();
  readonly users = new Map<string, UserView>();
  readonly userRecords = new Map<string, Record<string, unknown>>();

  constructor(private readonly state: CMSState) {
    for (const user of state.users || []) {
      this.users.set(user.id, userView(user as unknown as Record<string, unknown>));
      this.userRecords.set(user.id, user as unknown as Record<string, unknown>);
    }
  }

  private idsOf(key: CollectionKey): Set<string> {
    let set = this.ids.get(key);
    if (!set) {
      const list = (this.state as unknown as Record<string, unknown>)[key];
      set = new Set(Array.isArray(list) ? list.map((i) => (i as { id?: unknown })?.id).filter((id): id is string => typeof id === 'string') : []);
      this.ids.set(key, set);
    }
    return set;
  }

  has(key: CollectionKey, id: string): boolean {
    return this.idsOf(key).has(id);
  }

  apply(op: SyncOp): void {
    if (op.op === 'set' || op.op === 'order') return;
    const ids = this.idsOf(op.key);
    if (op.op === 'upsert') {
      ids.add(op.item.id);
      if (op.key === 'users') {
        this.users.set(op.item.id, userView(op.item));
        this.userRecords.set(op.item.id, op.item);
      }
    } else if (op.op === 'delete') {
      ids.delete(op.id);
      if (op.key === 'users') {
        this.users.delete(op.id);
        this.userRecords.delete(op.id);
      }
    } else {
      ids.clear();
      for (const item of op.items) ids.add(item.id);
      if (op.key === 'users') {
        this.users.clear();
        this.userRecords.clear();
        for (const item of op.items) {
          this.users.set(item.id, userView(item));
          this.userRecords.set(item.id, item);
        }
      }
    }
  }
}

const countActiveSuperAdmins = (users: Iterable<UserView>): number => {
  let n = 0;
  for (const u of users) if (u.role === 'Super Admin' && !u.disabled) n += 1;
  return n;
};

/** Username clash (case-insensitive) with another user in `users`, excluding `selfId`. */
function usernameTaken(users: Map<string, UserView>, username: string, selfId: string): boolean {
  const wanted = username.toLowerCase();
  for (const [id, u] of users) if (id !== selfId && u.username.toLowerCase() === wanted) return true;
  return false;
}

function checkSelfProfileEdit(op: SyncOp, session: StaffSession, running: RunningState): string | null {
  if (op.op !== 'upsert') return 'Only Super Admins can manage user accounts.';
  if (op.item.id !== session.userId) return 'Only Super Admins can edit other users.';
  const stored = running.userRecords.get(session.userId);
  if (!stored) return 'Your user profile was not found.';
  if (hasPlaintextPassword(op.item)) return 'Use the change-password form to change your password.';
  const forbidden = changedUserFields(stored, op.item).filter((f) => !SELF_EDITABLE.has(f));
  if (forbidden.length) return `You cannot change these profile fields: ${forbidden.join(', ')}.`;
  return null;
}

function checkSuperAdminUserOp(op: SyncOp, session: StaffSession, running: RunningState): string | null {
  const selfId = session.userId;
  switch (op.op) {
    case 'order':
      return null;
    case 'delete': {
      if (op.id === selfId) return 'You cannot delete your own account.';
      const target = running.users.get(op.id);
      if (target && target.role === 'Super Admin' && !target.disabled && countActiveSuperAdmins(running.users.values()) <= 1) {
        return 'The last Super Admin account cannot be deleted.';
      }
      return null;
    }
    case 'upsert': {
      const next = userView(op.item);
      if (!next.username) return 'A username is required.';
      if (usernameTaken(running.users, next.username, op.item.id)) return 'This username is already in use.';
      if (op.item.id === selfId) {
        if (next.role !== 'Super Admin') return 'You cannot remove your own Super Admin role.';
        if (next.disabled) return 'You cannot disable your own account.';
      }
      const after = new Map(running.users);
      after.set(op.item.id, next);
      if (countActiveSuperAdmins(after.values()) < 1) return 'At least one active Super Admin account must remain.';
      return null;
    }
    case 'replace': {
      const after = new Map<string, UserView>();
      for (const item of op.items) {
        const view = userView(item);
        if (!view.username) return `User ${item.id} has no username.`;
        if (usernameTaken(after, view.username, item.id)) return `Duplicate username "${view.username}".`;
        after.set(item.id, view);
      }
      const self = after.get(selfId);
      if (!self || self.role !== 'Super Admin' || self.disabled) {
        return 'The restored user list must keep your own active Super Admin account.';
      }
      return null;
    }
    case 'set':
      return null;
  }
}

function requiredAction(op: Exclude<SyncOp, { op: 'replace' }>, running: RunningState): WriteAction {
  switch (op.op) {
    case 'upsert':
      return running.has(op.key, op.item.id) ? 'update' : 'create';
    case 'delete':
      return 'delete';
    default:
      return 'update';
  }
}

const viewsAny = (role: string, matrix: RolePermissionMatrix | undefined, resources: Parameters<typeof hasRolePermission>[1][]) =>
  resources.some((r) => hasRolePermission(role, r, 'view', matrix));

function checkOp(op: SyncOp, session: StaffSession, running: RunningState, matrix: RolePermissionMatrix | undefined): string | null {
  const role = normalizeAdminRole(session.role);
  if (op.key === 'users') {
    return isSuperAdmin(role) ? checkSuperAdminUserOp(op, session, running) : checkSelfProfileEdit(op, session, running);
  }
  if (op.op === 'replace') {
    return canReplaceKey(role, op.key, matrix) ? null : `Your role cannot replace "${op.key}".`;
  }
  const action = requiredAction(op, running);
  if (canWriteKey(role, op.key, action, matrix)) return null;
  // Notification logs written as a side effect of lead handling (e.g. status-update emails).
  if (op.key === 'emails' && action === 'create' && viewsAny(role, matrix, ['leads', 'emails'])) return null;
  return `Your role cannot ${action} "${op.key}".`;
}

/**
 * Split ops into allowed and rejected for this staff session. `currentState` is the stored state
 * (its rbacMatrix is the authoritative permission matrix).
 */
export function authoriseOps(ops: readonly SyncOp[], session: StaffSession, currentState: CMSState): AuthoriseResult {
  const running = new RunningState(currentState);
  const matrix = currentState.rbacMatrix;
  const result: AuthoriseResult = { allowed: [], allowedIndexes: [], rejected: [] };
  ops.forEach((op, index) => {
    const reason = checkOp(op, session, running, matrix);
    if (reason) {
      result.rejected.push({ index, reason });
      return;
    }
    running.apply(op);
    result.allowed.push(op);
    result.allowedIndexes.push(index);
  });
  return result;
}
