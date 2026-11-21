/**
 * Content rules for documents written through staff sync (pure). They do not describe every
 * field: they stop the writes that would damage the site whatever the role's permissions are:
 * script / HTML URLs anywhere in a document, and singleton documents that arrive truncated.
 */
import { findUnsafeString, safeImageUrl } from '../../utils/safeUrl';
import type { CMSState } from '../../types/cms';
import type { SingletonKey, SyncOp } from '../contracts';

/** Reason an op's payload may not be stored, or null. */
export function unsafeContentReason(op: SyncOp): string | null {
  const payload = op.op === 'set' ? op.value : op.op === 'upsert' ? op.item : op.op === 'replace' ? op.items : null;
  if (payload === null) return null;
  const path = findUnsafeString(payload);
  return path ? `"${op.key}" contains a script or non-media data URL (${path}).` : null;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const nonEmptyString = (value: unknown): boolean => typeof value === 'string' && value.trim().length > 0;

/** Fields a singleton must carry for the site to keep working. */
const REQUIRED_FIELDS: Partial<Record<SingletonKey, (value: Record<string, unknown>) => string | null>> = {
  settings: (v) => (nonEmptyString(v.instituteName) ? null : 'settings.instituteName is required.'),
  hifzTreeConfig: (v) => (Array.isArray(v.graduates) ? null : 'hifzTreeConfig.graduates must be a list.'),
  versionManager: (v) => (Array.isArray(v.releases) ? null : 'versionManager.releases must be a list.'),
  rbacMatrix: (v) =>
    Object.keys(v).length > 0 && Object.values(v).every(isPlainObject) ? null : 'rbacMatrix must map roles to permissions.',
};

/** A stored document with at least this many fields may not lose most of them in one write. */
const MIN_FIELDS_FOR_TRUNCATION_CHECK = 4;

/**
 * Reason a `set` value is not acceptable for its key, or null. Clients always send whole
 * documents, so a value that is empty or keeps fewer than half of the stored document's fields is
 * a broken or hostile request, not an edit.
 */
export function singletonValueReason(key: SingletonKey, value: Record<string, unknown>, state: CMSState): string | null {
  if (Object.keys(value).length === 0) return `"${key}" cannot be set to an empty document.`;
  const required = REQUIRED_FIELDS[key]?.(value);
  if (required) return required;
  const stored = (state as unknown as Record<string, unknown>)[key];
  if (isPlainObject(stored)) {
    const storedKeys = Object.keys(stored);
    if (storedKeys.length >= MIN_FIELDS_FOR_TRUNCATION_CHECK) {
      const kept = storedKeys.filter((k) => k in value).length;
      if (kept * 2 < storedKeys.length) return `"${key}" is missing most of its fields; send the whole document.`;
    }
  }
  return null;
}

/** Largest inline profile photo / signature image accepted on a user record (base64 characters). */
export const MAX_USER_IMAGE_CHARS = 2 * 1024 * 1024;
const USER_IMAGE_FIELDS = ['photoUrl', 'signatureDataUrl'] as const;

/**
 * Profile photos and signature images are published to visitors (certificate signatories), so
 * they must be an http(s) link, a same-site path or an inline raster image of bounded size.
 */
export function userImageReason(item: Record<string, unknown>): string | null {
  for (const field of USER_IMAGE_FIELDS) {
    const value = item[field];
    if (value === undefined || value === null || value === '') continue;
    if (typeof value !== 'string' || /\s/.test(value) || !safeImageUrl(value)) {
      return `users.${field} must be an image link or an uploaded PNG/JPEG/WebP image.`;
    }
    if (value.length > MAX_USER_IMAGE_CHARS) return `users.${field} is too large.`;
  }
  return null;
}

/** Content check for one op against the stored state: reason to reject, or null. */
export function contentRejection(op: SyncOp, state: CMSState): string | null {
  const unsafe = unsafeContentReason(op);
  if (unsafe) return unsafe;
  if (op.key === 'users' && (op.op === 'upsert' || op.op === 'replace')) {
    for (const item of op.op === 'upsert' ? [op.item] : op.items) {
      const reason = userImageReason(item);
      if (reason) return reason;
    }
  }
  return op.op === 'set' ? singletonValueReason(op.key, op.value, state) : null;
}
