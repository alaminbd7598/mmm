import 'server-only';
import { normalizeAdminRole } from '../../utils/cmsLogic';
import { hashPassword } from '../auth/password';
import { findProfile, toSafeUser } from '../auth/safe-user';
import { getStaffSession } from '../auth/session';
import { CONFLICT_REASON_PREFIX, type StaffSession, type StateResponse, type SyncResponse } from '../contracts';
import { getStore } from '../db/store';
import { HttpError } from '../http';
import { demoAdminEnabled } from '../auth/jwt';
import { demoAccounts } from '../db/seed';
import { authoriseOps } from './authorize';
import { contentRejection } from './document-rules';
import { projectPublicState, projectStaffState } from './project';
import { extractSyncPasswords } from './sync-passwords';
import { parseSyncRequest } from './validate';

/**
 * Staff session for read endpoints. A broken auth configuration (e.g. missing JWT_SECRET while a
 * stale cookie is present) must not take the public site down, so it degrades to anonymous.
 */
async function optionalStaffSession(): Promise<StaffSession | null> {
  try {
    return await getStaffSession();
  } catch (err) {
    if (err instanceof HttpError && err.code === 'NOT_CONFIGURED') return null;
    throw err;
  }
}

/**
 * GET /api/state. Staff whose password must still be changed get the public projection (their
 * seeded password is public knowledge) together with `me`, so the client can force the change.
 */
export async function buildStateResponse(): Promise<StateResponse> {
  const store = await getStore();
  const [session, snapshot] = await Promise.all([optionalStaffSession(), store.getSnapshot()]);
  const base = { ok: true as const, mode: store.mode, version: snapshot.version, updatedAt: snapshot.updatedAt };
  const publicResponse = (): StateResponse => ({
    ...base,
    audience: 'public',
    state: projectPublicState(snapshot.state),
    // The demo's sample sign-ins are public on purpose; they are served only while the demo admin is on.
    ...(store.mode === 'demo' && demoAdminEnabled() ? { demoAccounts: demoAccounts() } : {}),
  });
  if (!session) return publicResponse();

  const auth = await store.getUserAuthById(session.userId);
  if (!auth) return publicResponse();
  const me = toSafeUser(findProfile(snapshot.state.users, auth.id), auth);
  const state = auth.mustChangePassword
    ? projectPublicState(snapshot.state)
    : projectStaffState(snapshot.state, normalizeAdminRole(auth.role), snapshot.state.rbacMatrix, auth.id);
  return { ...base, audience: 'staff', state, me };
}

export interface SyncOutcome {
  status: number;
  body: SyncResponse;
}

/** POST /api/admin/sync after authentication: validate, authorise, hash passwords, apply. */
export async function runStaffSync(session: StaffSession, rawBody: unknown): Promise<SyncOutcome> {
  const parsed = parseSyncRequest(rawBody);
  if (!parsed.ok) throw new HttpError(400, `Invalid sync request: ${parsed.error}`, 'BAD_REQUEST');

  const store = await getStore();
  const snapshot = await store.getSnapshot();
  const invalid = [...parsed.value.invalid];
  const indexed = parsed.value.ops.filter(({ index, op }) => {
    const reason = contentRejection(op, snapshot.state);
    if (reason) invalid.push({ index, reason });
    return !reason;
  });

  const auth = authoriseOps(
    indexed.map((o) => o.op),
    session,
    snapshot.state
  );
  const rejected = [
    ...invalid,
    ...auth.rejected.map((r) => ({ index: indexed[r.index].index, reason: r.reason })),
  ];
  const passwords = extractSyncPasswords(
    auth.allowed.map((op, i) => ({ index: indexed[auth.allowedIndexes[i]].index, op }))
  );
  rejected.push(...passwords.rejected);
  rejected.sort((a, b) => a.index - b.index);

  const total = indexed.length + invalid.length;
  if (passwords.ops.length === 0) {
    const body: SyncResponse = {
      ok: total === 0,
      version: snapshot.version,
      updatedAt: snapshot.updatedAt,
      ...(rejected.length ? { rejected } : {}),
      ...(total > 0 ? { error: 'No changes were applied.' } : {}),
    };
    return { status: total === 0 ? 200 : 400, body };
  }

  const passwordHashes: Record<string, string> = {};
  const mustChangePassword: Record<string, boolean> = {};
  for (const [userId, plain] of passwords.userPasswords) {
    passwordHashes[userId] = await hashPassword(plain);
    // Passwords chosen by an administrator (new accounts and resets) must be replaced at first sign-in.
    mustChangePassword[userId] = true;
  }

  const result = await store.applyOps(
    passwords.ops.map((o) => o.op),
    { passwordHashes, mustChangePassword, baseVersion: parsed.value.baseVersion }
  );
  for (const at of result.conflicts ?? []) {
    rejected.push({
      index: passwords.ops[at].index,
      reason: `${CONFLICT_REASON_PREFIX} "${passwords.ops[at].op.key}" was changed by someone else after you loaded it.`,
    });
  }
  rejected.sort((a, b) => a.index - b.index);
  return {
    status: 200,
    body: { ok: true, version: result.version, updatedAt: result.updatedAt, ...(rejected.length ? { rejected } : {}) },
  };
}
