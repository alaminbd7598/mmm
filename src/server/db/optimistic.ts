/**
 * Read-plan-apply for server-made writes: the plan is built from a snapshot and applied only if
 * none of the documents it overwrites changed meanwhile; otherwise it is planned again from the
 * new state. New items never conflict, so plain submissions always succeed on the first attempt.
 */
import type { ApplyOpsOptions, ApplyOpsResult, DataStore, StateSnapshot, SyncOp } from '../contracts';
import { StoreStaleError } from './errors';

/** Attempts before giving up with StoreStaleError (each needs another writer to win the same race). */
export const PLAN_ATTEMPTS = 3;

export interface PlannedWrite {
  ops: SyncOp[];
  /** Password hashes etc.; `baseVersion` and `atomic` are set here. */
  opts?: Omit<ApplyOpsOptions, 'baseVersion' | 'atomic'>;
}

/**
 * Runs `plan` on the current snapshot and applies its ops atomically against that snapshot's
 * version. `plan` runs again (on a fresh snapshot) when a concurrent write touched one of its
 * targets, so it must not have side effects such as consuming rate-limit budgets; whatever it
 * throws is passed on. Throws StoreStaleError when every attempt lost the race.
 */
export async function applyPlanned<P extends PlannedWrite>(
  store: Pick<DataStore, 'getSnapshot' | 'applyOps'>,
  plan: (snapshot: StateSnapshot) => P | Promise<P>,
  attempts: number = PLAN_ATTEMPTS
): Promise<{ plan: P; result: ApplyOpsResult }> {
  for (let attempt = 1; ; attempt += 1) {
    const snapshot = await store.getSnapshot();
    const planned = await plan(snapshot);
    try {
      const result = await store.applyOps(planned.ops, { ...planned.opts, baseVersion: snapshot.version, atomic: true });
      return { plan: planned, result };
    } catch (err) {
      if (!(err instanceof StoreStaleError) || attempt >= attempts) throw err;
    }
  }
}
