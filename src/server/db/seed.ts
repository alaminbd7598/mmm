/**
 * Seed state and credentials for a fresh store.
 *
 * Seed state = mergeLiveCMSState(seed-content.json, INITIAL_CMS_STATE): the non-personal content
 * extracted from the former live JSON file layered over the code defaults.
 *
 * Initial passwords: ADMIN_BOOTSTRAP_PASSWORD for every seed user when set, otherwise each seed
 * user's legacy default from seedData. Seed career candidates keep their legacy passwords.
 * mustChangePassword is true in `database` mode. In `demo` mode it is false: demo data lives only
 * in process memory and the demo credentials are documented publicly, so forcing a change would
 * only get in the way of trying the admin panel.
 */
import bcrypt from 'bcryptjs';
import type { StorageMode, SyncOp } from '../contracts';
import type { CMSState } from '../../types/cms';
import { INITIAL_CMS_STATE } from '../../data/seedData';
import { mergeLiveCMSState } from '../../utils/cmsLogic';
import seedContent from './seed-content.json';
import type { ApplyOpsOptions } from './documents';
import { plaintextPasswords, stateToOps } from './state-ops';

export const BCRYPT_COST = 12;

export function buildSeedState(): CMSState {
  return mergeLiveCMSState(seedContent as Record<string, unknown>, INITIAL_CMS_STATE);
}

export interface SeedPlan {
  ops: SyncOp[];
  opts: Required<ApplyOpsOptions>;
}

async function hashAll(passwords: Map<string, string>): Promise<Record<string, string>> {
  const entries = await Promise.all(
    [...passwords].map(async ([id, pw]) => [id, await bcrypt.hash(pw, BCRYPT_COST)] as const)
  );
  return Object.fromEntries(entries);
}

export async function buildSeedPlan(
  mode: StorageMode,
  bootstrapPassword: string | undefined = process.env.ADMIN_BOOTSTRAP_PASSWORD
): Promise<SeedPlan> {
  const state = buildSeedState();
  const userPasswords = plaintextPasswords(state, 'users');
  if (bootstrapPassword) {
    for (const user of state.users) userPasswords.set(user.id, bootstrapPassword);
  }
  const [passwordHashes, candidatePasswordHashes] = await Promise.all([
    hashAll(userPasswords),
    hashAll(plaintextPasswords(state, 'careerCandidates')),
  ]);
  const mustChangePassword = Object.fromEntries(state.users.map((u) => [u.id, mode === 'database']));
  return {
    ops: stateToOps(state, 'replace'),
    opts: { passwordHashes, candidatePasswordHashes, mustChangePassword },
  };
}
