/**
 * Seed state and credentials for a fresh store.
 *
 * Seed state = mergeLiveCMSState(seed-content.json, INITIAL_CMS_STATE): the non-personal content
 * extracted from the former live JSON file layered over the code defaults.
 *
 * Passwords:
 * - `demo` mode: the publicly documented sample passwords (demo-credentials.ts). Demo data lives
 *   only in process memory, so no password change is forced.
 * - `database` mode: NO account is seeded with a password. After seeding, the first Super Admin
 *   receives ADMIN_BOOTSTRAP_PASSWORD (see ensureBootstrapPassword) and must change it at first
 *   sign-in; every other account stays unusable until a Super Admin sets its password.
 */
import bcrypt from 'bcryptjs';
import type { ApplyOpsOptions, DemoAccount, StorageMode, SyncOp } from '../contracts';
import type { CMSState } from '../../types/cms';
import { INITIAL_CMS_STATE } from '../../data/seedData';
import { mergeLiveCMSState } from '../../utils/cmsLogic';
import { validateNewPassword } from '../auth/password';
import seedContent from './seed-content.json';
import { DEMO_STAFF_PASSWORDS } from './demo-credentials';
import { stateToOps } from './state-ops';

export const BCRYPT_COST = 12;

export function buildSeedState(): CMSState {
  return mergeLiveCMSState(seedContent as Record<string, unknown>, INITIAL_CMS_STATE);
}

export interface SeedPlan {
  ops: SyncOp[];
  opts: ApplyOpsOptions;
}

export async function buildSeedPlan(mode: StorageMode): Promise<SeedPlan> {
  const state = buildSeedState();
  const passwordHashes: Record<string, string> = {};
  if (mode === 'demo') {
    await Promise.all(
      state.users.map(async (user) => {
        const password = DEMO_STAFF_PASSWORDS[user.id];
        if (password) passwordHashes[user.id] = await bcrypt.hash(password, BCRYPT_COST);
      })
    );
  }
  return { ops: stateToOps(state, 'replace'), opts: { passwordHashes } };
}

/** Sample sign-ins for the demo login page, in seed-user order. */
export function demoAccounts(): DemoAccount[] {
  return INITIAL_CMS_STATE.users
    .filter((user) => DEMO_STAFF_PASSWORDS[user.id])
    .map((user) => ({ username: user.username, password: DEMO_STAFF_PASSWORDS[user.id] }));
}

/** The part of the database store the bootstrap step needs. */
export interface BootstrapTarget {
  listSuperAdmins(): Promise<Array<{ id: string; hasPassword: boolean }>>;
  setInitialPassword(id: string, passwordHash: string): Promise<void>;
}

export type BootstrapOutcome = 'already-set' | 'applied' | 'missing' | 'weak' | 'no-super-admin';

/**
 * Database mode, once per process start: when no active Super Admin can sign in yet, give the
 * first one ADMIN_BOOTSTRAP_PASSWORD (it must satisfy the normal password policy and has to be
 * changed at first sign-in). Without a valid value nobody can sign in, and the log says why.
 */
export async function ensureBootstrapPassword(
  target: BootstrapTarget,
  bootstrapPassword: string | undefined = process.env.ADMIN_BOOTSTRAP_PASSWORD,
  log: (message: string) => void = (message) => console.warn(message)
): Promise<BootstrapOutcome> {
  const admins = await target.listSuperAdmins();
  if (admins.some((a) => a.hasPassword)) return 'already-set';
  if (!admins.length) {
    log('[setup] The database has no active Super Admin account. Restore one with `npm run db:import`.');
    return 'no-super-admin';
  }
  const password = bootstrapPassword?.trim() || '';
  if (!password) {
    log('[setup] No administrator password exists yet. Set ADMIN_BOOTSTRAP_PASSWORD and restart to enable sign-in.');
    return 'missing';
  }
  const policy = validateNewPassword(password, 'admin');
  if (!policy.ok) {
    log(`[setup] ADMIN_BOOTSTRAP_PASSWORD was not applied: ${policy.error} Choose a stronger value and restart.`);
    return 'weak';
  }
  await target.setInitialPassword(admins[0].id, await bcrypt.hash(password, BCRYPT_COST));
  log('[setup] The Super Admin password was set from ADMIN_BOOTSTRAP_PASSWORD. It must be changed at first sign-in.');
  return 'applied';
}
