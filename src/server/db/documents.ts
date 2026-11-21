/**
 * Pure helpers shared by the Prisma and in-memory stores: document sanitising, indexed-column
 * extraction and ordering rules. No I/O here so everything is unit-testable.
 */
import type { CollectionKey } from '../contracts';
import { normalizeAdminRole } from '../../utils/cmsLogic';

export type StoredItem = { id: string } & Record<string, unknown>;
export type JsonObject = Record<string, unknown>;

/** Collections whose items carry credentials that live on auth columns, never in the JSON document. */
export const AUTH_COLLECTIONS = ['users', 'careerCandidates'] as const satisfies readonly CollectionKey[];
export type AuthCollection = (typeof AUTH_COLLECTIONS)[number];

const SECRET_FIELDS = ['password', 'passwordHash'] as const;

/**
 * Options accepted by both stores' applyOps. A superset of the DataStore contract:
 * `mustChangePassword` lets the importer/seeder flag users in the same transaction.
 */
export type { ApplyOpsOptions } from '../contracts';

/** Deep copy of a JSON-compatible value (documents are always JSON). */
export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Copy of the item without credential fields. Other collections are copied unchanged. */
export function sanitizeItem(key: CollectionKey, item: StoredItem): StoredItem {
  const copy = cloneJson(item);
  if ((AUTH_COLLECTIONS as readonly string[]).includes(key)) {
    for (const field of SECRET_FIELDS) delete copy[field];
  }
  return copy;
}

/** VARCHAR(191) is Prisma's default String length on MySQL. */
const MAX_INDEX_LENGTH = 191;

/** Normalise a value for an indexed string column: trimmed, length-capped, empty -> null. */
export function indexValue(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.length > MAX_INDEX_LENGTH ? text.slice(0, MAX_INDEX_LENGTH) : text;
}

export function normalizeEmail(value: unknown): string | null {
  const v = indexValue(value);
  return v ? v.toLowerCase() : null;
}

export function normalizeUsername(value: unknown): string {
  return (typeof value === 'string' ? value : '').trim();
}

export interface UserColumns {
  username: string;
  role: string;
  disabled: boolean;
}

/** Indexed columns of a `users` item. A missing username falls back to the id so the unique index holds. */
export function userColumns(item: StoredItem): UserColumns {
  return {
    username: indexValue(normalizeUsername(item.username)) ?? indexValue(item.id) ?? item.id,
    role: normalizeAdminRole(typeof item.role === 'string' ? item.role : undefined),
    disabled: item.disabled === true,
  };
}

/**
 * Indexed lookup columns for an item of a dedicated table, derived from its JSON document.
 * Auth columns (passwordHash, mustChangePassword) are handled separately by the stores.
 */
export function indexedColumns(key: CollectionKey, item: StoredItem): Record<string, string | boolean | null> {
  switch (key) {
    case 'users': {
      const c = userColumns(item);
      return { username: c.username, role: c.role, disabled: c.disabled };
    }
    case 'blogPosts':
      return { slug: indexValue(item.slug), status: indexValue(item.status) };
    case 'leads':
      return { status: indexValue(item.status), phone: indexValue(item.phone) };
    case 'admissionTokens2027':
      return { tokenCode: indexValue(item.tokenCode), guardianPhone: indexValue(item.guardianPhone) };
    case 'leaveRequests':
      return { status: indexValue(item.status) };
    case 'careerApplications':
      return { email: normalizeEmail(item.email) };
    case 'careerCandidates':
      return { email: normalizeEmail(item.email) };
    default:
      return {};
  }
}

/**
 * New display order for a collection: requested ids first (unknown and repeated ids ignored),
 * then the remaining items in their current relative order.
 */
export function computeOrder(currentIds: readonly string[], requestedIds: readonly string[]): string[] {
  const known = new Set(currentIds);
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const id of requestedIds) {
    if (known.has(id) && !seen.has(id)) {
      seen.add(id);
      ordered.push(id);
    }
  }
  for (const id of currentIds) if (!seen.has(id)) ordered.push(id);
  return ordered;
}

/** Items with unique ids: the first occurrence keeps its position, the last occurrence's data wins. */
export function dedupeById(items: readonly StoredItem[]): StoredItem[] {
  const index = new Map<string, number>();
  const out: StoredItem[] = [];
  for (const item of items) {
    const at = index.get(item.id);
    if (at === undefined) {
      index.set(item.id, out.length);
      out.push(item);
    } else {
      out[at] = item;
    }
  }
  return out;
}

/** Recursively freeze a cached snapshot so no request can alter what later requests read. */
export function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
