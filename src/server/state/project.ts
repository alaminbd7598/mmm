/**
 * Projections of the stored CMS state for the two audiences of GET /api/state.
 * Pure functions: input state is never mutated.
 */
import type {
  AdminRole,
  AdminUser,
  AppVersionManagerConfig,
  BlogAutomationConfig,
  CMSState,
  CareerCandidateAccount,
  RolePermissionMatrix,
  VirtualOfficeConfig,
} from '../../types/cms';
import { normalizeAdminRole } from '../../utils/cmsLogic';
import {
  COLLECTION_KEYS,
  PRIVATE_KEYS,
  SINGLETON_KEYS,
  type PublicSignatory,
  type StateKey,
} from '../contracts';
import { canViewKey, canWriteKey, isSuperAdmin } from './permissions';
import { isSignatorySlot } from './signatories';

const ALL_KEYS: readonly StateKey[] = [...SINGLETON_KEYS, ...COLLECTION_KEYS];
const CREDENTIAL_FIELDS = ['password', 'passwordHash', 'mustChangePassword'] as const;

type Mutable = Record<string, unknown>;

function withoutCredentials<T extends object>(item: T): Omit<T, 'password'> {
  const copy: Mutable = { ...(item as Mutable) };
  for (const field of CREDENTIAL_FIELDS) delete copy[field];
  return copy as Omit<T, 'password'>;
}

/** The certificate/token signatories: the only user data anonymous visitors receive. */
export function toPublicSignatories(users: readonly AdminUser[] | undefined): PublicSignatory[] {
  const out: PublicSignatory[] = [];
  for (const user of users || []) {
    if (!user || (user as unknown as Mutable).disabled === true) continue;
    if (!isSignatorySlot(user.signatorySlot)) continue;
    const signatory: PublicSignatory = {
      id: user.id,
      fullName: user.fullName,
      role: normalizeAdminRole(user.role),
      signatorySlot: user.signatorySlot,
    };
    if (user.designation) signatory.designation = user.designation;
    if (user.signatureDataUrl) signatory.signatureDataUrl = user.signatureDataUrl;
    out.push(signatory);
  }
  return out;
}

/** Virtual office config without meeting links, Zoom ids or passcodes (same rules as the legacy server). */
export function sanitizeVirtualOfficeConfig(config: VirtualOfficeConfig): VirtualOfficeConfig {
  return {
    ...config,
    roomUrl: '',
    zoomMeetingId: '',
    zoomPasscode: '',
    desks: Array.isArray(config.desks)
      ? config.desks.map((desk) => ({ ...desk, roomUrl: '', zoomMeetingId: '', zoomPasscode: '' }))
      : [],
  };
}

/** Release history without the embedded state snapshots (they contain whole CMS copies). */
export function stripReleaseSnapshots(config: AppVersionManagerConfig): AppVersionManagerConfig {
  return {
    ...config,
    releases: Array.isArray(config.releases)
      ? config.releases.map((release) => {
          const copy = { ...release };
          delete copy.snapshot;
          return copy;
        })
      : [],
  };
}

/**
 * State for anonymous visitors: no PRIVATE_KEYS, users reduced to signatories, only Published blog
 * posts, no blog automation config (the public site never reads it and it holds the webhook key),
 * virtual office without join details, release notes without snapshots.
 */
export function projectPublicState(state: CMSState): Partial<CMSState> {
  const source = state as unknown as Mutable;
  const out: Mutable = {};
  for (const key of ALL_KEYS) {
    if (PRIVATE_KEYS.includes(key) || source[key] === undefined) continue;
    switch (key) {
      case 'users':
        out.users = toPublicSignatories(state.users);
        break;
      case 'blogPosts':
        out.blogPosts = (state.blogPosts || []).filter((post) => post.status === 'Published');
        break;
      case 'blogAutomationConfig':
        break;
      case 'virtualOfficeConfig':
        if (state.virtualOfficeConfig) out.virtualOfficeConfig = sanitizeVirtualOfficeConfig(state.virtualOfficeConfig);
        break;
      case 'versionManager':
        if (state.versionManager) out.versionManager = stripReleaseSnapshots(state.versionManager);
        break;
      default:
        out[key] = source[key];
    }
  }
  return out as Partial<CMSState>;
}

/**
 * Users visible to a staff member: everyone (without credentials) for Super Admins; otherwise the
 * member's own record plus the public signatories (needed for certificate and token PDFs).
 */
function staffUsers(state: CMSState, role: AdminRole, selfUserId: string | undefined): Array<Partial<AdminUser>> {
  const users = state.users || [];
  if (isSuperAdmin(role)) return users.map((u) => withoutCredentials(u));
  const self = selfUserId ? users.find((u) => u.id === selfUserId) : undefined;
  const others: Array<Partial<AdminUser>> = toPublicSignatories(users).filter((s) => s.id !== selfUserId);
  return self ? [withoutCredentials(self), ...others] : others;
}

/**
 * State for a signed-in staff member. Keys the role may view are sent in full (credentials
 * removed); every other key falls back to its public projection, so the public website keeps
 * working while the member browses it, and private keys the role cannot view are omitted.
 * The blog webhook API key is only sent to roles that may edit the blog settings.
 */
export function projectStaffState(
  state: CMSState,
  role: AdminRole | string,
  matrix: RolePermissionMatrix | undefined,
  selfUserId?: string
): Partial<CMSState> {
  const normalizedRole = normalizeAdminRole(role);
  const source = state as unknown as Mutable;
  const out: Mutable = projectPublicState(state) as Mutable;
  for (const key of ALL_KEYS) {
    if (key === 'users') {
      out.users = staffUsers(state, normalizedRole, selfUserId);
      continue;
    }
    if (key === 'rbacMatrix' && !isSuperAdmin(normalizedRole)) {
      // The member's own permissions (and nobody else's), so the admin panel shows exactly the
      // tabs and actions the server will accept.
      const own = (matrix as Record<string, unknown> | undefined)?.[normalizedRole];
      if (own) out.rbacMatrix = { [normalizedRole]: own };
      continue;
    }
    if (source[key] === undefined || !canViewKey(normalizedRole, key, matrix)) continue;
    switch (key) {
      case 'careerCandidates':
        out.careerCandidates = (state.careerCandidates || []).map(
          (c) => withoutCredentials(c) as Omit<CareerCandidateAccount, 'password'>
        );
        break;
      case 'blogAutomationConfig': {
        const config = state.blogAutomationConfig as BlogAutomationConfig;
        out.blogAutomationConfig = canWriteKey(normalizedRole, key, 'update', matrix)
          ? config
          : { ...config, apiKey: '' };
        break;
      }
      default:
        out[key] = source[key];
    }
  }
  return out as Partial<CMSState>;
}
