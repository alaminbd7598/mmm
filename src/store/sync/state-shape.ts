/**
 * Pure helpers for the shape of client-held CMS state: the safe fallback used before (or
 * instead of) server data, and removal of secrets that must never stay in browser memory.
 */
import type { CMSState } from '../../types/cms';
import { INITIAL_CMS_STATE } from '../../data/seedData';
import { PRIVATE_KEYS, isCollectionKey, type StateKey } from '../../server/contracts';

/**
 * Seed content without personal data or accounts. Used as the merge base for server responses
 * (keys the server omits for this audience stay empty instead of showing seed records) and as the
 * initial state before the first fetch.
 */
export function buildClientFallbackState(seed: CMSState = INITIAL_CMS_STATE): CMSState {
  const out: Record<string, unknown> = { ...seed, users: [] };
  for (const key of PRIVATE_KEYS) {
    if (isCollectionKey(key)) out[key] = [];
  }
  return out as unknown as CMSState;
}

const SECRET_FIELDS = ['password', 'passwordHash'] as const;
const SECRET_COLLECTIONS = ['users', 'careerCandidates'] as const satisfies readonly StateKey[];

function stripItem<T extends object>(item: T): T {
  if (!SECRET_FIELDS.some((f) => f in item)) return item;
  const copy: Record<string, unknown> = { ...(item as Record<string, unknown>) };
  for (const f of SECRET_FIELDS) delete copy[f];
  return copy as T;
}

/** True when any account record still carries a plaintext password or hash. */
export function hasSecrets(state: Partial<CMSState>): boolean {
  return SECRET_COLLECTIONS.some((key) =>
    (state[key] || []).some((item) => SECRET_FIELDS.some((f) => f in (item as object)))
  );
}

/**
 * Copy of `state` with `password` / `passwordHash` removed from users and career candidates.
 * Returns the same object when there is nothing to strip, so React can skip re-rendering.
 */
export function stripSecrets<S extends Partial<CMSState>>(state: S): S {
  if (!hasSecrets(state)) return state;
  const out: Record<string, unknown> = { ...state };
  for (const key of SECRET_COLLECTIONS) {
    const list = state[key];
    if (Array.isArray(list)) out[key] = (list as object[]).map(stripItem);
  }
  return out as S;
}

/**
 * Remove plaintext passwords from `current` for records whose password was just accepted by the
 * server (same id and same secret in `sent`). Records changed again since then keep theirs until
 * their own sync succeeds. Returns `current` unchanged when nothing applies.
 */
export function stripConfirmedSecrets<S extends Partial<CMSState>>(current: S, sent: Partial<CMSState>): S {
  let changed = false;
  const out: Record<string, unknown> = { ...current };
  for (const key of SECRET_COLLECTIONS) {
    const list = current[key] as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(list)) continue;
    const sentById = new Map(
      ((sent[key] || []) as unknown as Array<Record<string, unknown>>).map((it) => [it.id, it])
    );
    let listChanged = false;
    const next = list.map((item) => {
      if (!SECRET_FIELDS.some((f) => f in item)) return item;
      const sentItem = sentById.get(item.id);
      if (!sentItem || !SECRET_FIELDS.every((f) => sentItem[f] === item[f])) return item;
      listChanged = true;
      return stripItem(item);
    });
    if (listChanged) {
      out[key] = next;
      changed = true;
    }
  }
  return changed ? (out as S) : current;
}
