/**
 * The write step of a staff sync: the authorised ops plus the server's own follow-up writes,
 * applied with conflict detection. No request or session access here, so it is unit-tested
 * against the in-memory store.
 */
import type { CMSState } from '../../types/cms';
import { CONFLICT_REASON_PREFIX, type ApplyOpsOptions, type ApplyOpsResult, type DataStore, type SyncOp } from '../contracts';
import { StoreStaleError } from '../db/errors';
import { enforceSignatorySlots } from './signatories';

export interface AppliedSync {
  version: number;
  updatedAt: string;
  /** Ops refused because someone else changed their target first, by their index in the request. */
  conflicts: Array<{ index: number; reason: string }>;
}

/**
 * Applies `ops` (each with its index in the client's request), authorised on `snapshot`.
 *
 * Assigning a signatory slot makes the server append a write that takes the slot away from its
 * previous holder. That write and the assignment only make sense together: if the assignment were
 * refused as a conflict while the follow-up applied, the slot would be left without a holder. Such
 * a batch is therefore applied all or nothing, and when it is refused every op of the request is
 * reported as a conflict (the client reloads and the user repeats the change). Other batches keep
 * per-op conflict handling: unaffected ops are stored.
 */
export async function applySyncOps(
  store: Pick<DataStore, 'applyOps' | 'getVersion'>,
  ops: ReadonlyArray<{ index: number; op: SyncOp }>,
  snapshot: { version: number; state: CMSState },
  opts: Pick<ApplyOpsOptions, 'passwordHashes' | 'mustChangePassword'> & { baseVersion: number }
): Promise<AppliedSync> {
  const clientOps = ops.map((o) => o.op);
  // Follow-ups come after the client's ops, so conflict indexes still point into `ops`.
  const withFollowUps = enforceSignatorySlots(clientOps, snapshot.state, snapshot.version);
  const linked = withFollowUps.length > clientOps.length;
  const conflictAt = (at: number) => ({
    index: ops[at].index,
    reason: `${CONFLICT_REASON_PREFIX} "${ops[at].op.key}" was changed by someone else after you loaded it.`,
  });

  let result: ApplyOpsResult;
  try {
    result = await store.applyOps(withFollowUps, { ...opts, ...(linked ? { atomic: true } : {}) });
  } catch (err) {
    if (!(err instanceof StoreStaleError)) throw err;
    const current = await store.getVersion();
    return { version: current.version, updatedAt: current.updatedAt, conflicts: ops.map((_, at) => conflictAt(at)) };
  }
  return {
    version: result.version,
    updatedAt: result.updatedAt,
    conflicts: (result.conflicts ?? []).filter((at) => ops[at]).map(conflictAt),
  };
}
