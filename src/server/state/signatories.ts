/**
 * One holder per certificate signatory slot (chairman / principal / coordinator), enforced on the
 * server for every staff sync. Pure: neither the ops nor the state are mutated.
 */
import type { CMSState } from '../../types/cms';
import type { SyncOp } from '../contracts';

type Item = { id: string } & Record<string, unknown>;

export const SIGNATORY_SLOTS = ['chairman', 'principal', 'coordinator'] as const;
export type SignatorySlot = (typeof SIGNATORY_SLOTS)[number];

export const isSignatorySlot = (slot: unknown): slot is SignatorySlot =>
  (SIGNATORY_SLOTS as readonly unknown[]).includes(slot);

/** `base` that never conflicts, for callers that apply the follow-up writes unconditionally. */
const ALWAYS_CURRENT = Number.MAX_SAFE_INTEGER;

/**
 * The ops with slot uniqueness applied:
 * - when a user is written with a slot, every other user holding it is written back with
 *   `signatorySlot: 'none'` (appended upserts), so the newest assignment wins;
 * - in a replaced user list the first holder of each slot keeps it.
 *
 * `followUpBase` is the version of `state`: the appended writes carry it as their `base`, so a
 * holder changed after that snapshot is detected as a conflict instead of being overwritten with
 * its older copy. The staff sync applies such a batch all or nothing (see sync-apply.ts).
 */
export function enforceSignatorySlots(
  ops: readonly SyncOp[],
  state: CMSState,
  followUpBase: number = ALWAYS_CURRENT
): SyncOp[] {
  if (!ops.some((op) => op.key === 'users' && (op.op === 'upsert' || op.op === 'replace'))) return [...ops];
  const users = new Map<string, Item>((state.users || []).map((u) => [u.id, u as unknown as Item]));
  const cleared = new Set<string>();
  const out: SyncOp[] = [];

  for (const op of ops) {
    if (op.key !== 'users' || op.op === 'order') {
      out.push(op);
      continue;
    }
    if (op.op === 'delete') {
      users.delete(op.id);
      cleared.delete(op.id);
      out.push(op);
      continue;
    }
    if (op.op === 'upsert') {
      users.set(op.item.id, op.item);
      cleared.delete(op.item.id);
      if (isSignatorySlot(op.item.signatorySlot)) {
        for (const [id, user] of users) {
          if (id === op.item.id || user.signatorySlot !== op.item.signatorySlot) continue;
          users.set(id, { ...user, signatorySlot: 'none' });
          cleared.add(id);
        }
      }
      out.push(op);
      continue;
    }
    const taken = new Set<unknown>();
    const items = op.items.map((item) => {
      if (!isSignatorySlot(item.signatorySlot)) return item;
      if (taken.has(item.signatorySlot)) return { ...item, signatorySlot: 'none' };
      taken.add(item.signatorySlot);
      return item;
    });
    users.clear();
    cleared.clear();
    for (const item of items) users.set(item.id, item);
    out.push({ ...op, items });
  }

  for (const id of cleared) {
    const user = users.get(id);
    if (user) out.push({ op: 'upsert', key: 'users', item: user, base: followUpBase });
  }
  return out;
}
