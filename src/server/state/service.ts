import 'server-only';
import { normalizeAdminRole } from '../../utils/cmsLogic';
import { hashPassword } from '../auth/password';
import { findProfile, toSafeUser } from '../auth/safe-user';
import { getStaffSession } from '../auth/session';
import type { StaffSession, StateResponse, SyncResponse } from '../contracts';
import { getStore } from '../db/store';
import { HttpError } from '../http';
import { authoriseOps } from './authorize';
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
  if (!session) return { ...base, audience: 'public', state: projectPublicState(snapshot.state) };

  const auth = await store.getUserAuthById(session.userId);
  if (!auth) return { ...base, audience: 'public', state: projectPublicState(snapshot.state) };
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
  const { ops: indexed, invalid } = parsed.value;

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
    { passwordHashes, mustChangePassword }
  );
  return {
    status: 200,
    body: { ok: true, version: result.version, updatedAt: result.updatedAt, ...(rejected.length ? { rejected } : {}) },
  };
}
