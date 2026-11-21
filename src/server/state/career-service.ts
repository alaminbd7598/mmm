import 'server-only';
import { cookies } from 'next/headers';
import { createCandidateSession } from '../auth/candidate-session';
import { hashPassword, validateNewPassword, verifyPassword } from '../auth/password';
import { getJwtSecret } from '../auth/session-cookie';
import type { CandidateSession } from '../contracts';
import { getStore } from '../db/store';
import { HttpError } from '../http';
import { beginAttempt, resetLimit } from '../rate-limit';
import {
  applicationsForCandidate,
  findCandidate,
  lookupApplicationStatus,
  newCandidateOps,
  type CandidateApplication,
  type CandidateProfile,
  type PublicApplicationStatus,
} from './career';
import { newId } from './ids';

export interface CandidateResponse {
  ok: true;
  candidate: CandidateProfile;
  applications: CandidateApplication[];
}

/** Profile and own applications of a signed-in candidate. */
export async function candidateResponse(session: CandidateSession): Promise<CandidateResponse> {
  const store = await getStore();
  const snapshot = await store.getSnapshot();
  const candidate =
    findCandidate(snapshot.state, session.candidateId) ??
    ({ id: session.candidateId, email: session.email, fullName: '', phone: '', createdAt: '' } satisfies CandidateProfile);
  return { ok: true, candidate, applications: applicationsForCandidate(snapshot.state, session.email) };
}

export async function registerCandidate(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<CandidateResponse> {
  const policy = validateNewPassword(input.password, input.email);
  if (!policy.ok) throw new HttpError(400, policy.error, policy.code);

  const store = await getStore();
  getJwtSecret(store.mode); // fail with NOT_CONFIGURED before creating an account nobody can sign in to
  if (await store.getCandidateAuthByEmail(input.email)) {
    throw new HttpError(409, 'An account with this email already exists. Please sign in.', 'EMAIL_TAKEN');
  }
  const id = newId('cand');
  const { profile, ops } = newCandidateOps(input, id, new Date());
  const passwordHash = await hashPassword(input.password);
  await store.applyOps(ops, { candidatePasswordHashes: { [id]: passwordHash } });

  const session: CandidateSession = { kind: 'candidate', candidateId: id, email: profile.email, sv: 0 };
  await createCandidateSession(await cookies(), session);
  return { ok: true, candidate: profile, applications: [] };
}

export async function loginCandidate(
  email: string,
  password: string,
  throttle?: { failureKey: string; limit: number; windowMs: number }
): Promise<CandidateResponse> {
  const store = await getStore();
  getJwtSecret(store.mode);
  const auth = await store.getCandidateAuthByEmail(email);
  // Counted before the password check and cleared only by a successful sign-in (see beginAttempt).
  if (throttle && !beginAttempt(throttle.failureKey, throttle.limit, throttle.windowMs)) {
    throw new HttpError(429, 'Too many sign-in attempts. Please try again later.', 'RATE_LIMITED');
  }
  const passwordOk = await verifyPassword(password, auth?.passwordHash);
  if (!auth || !passwordOk) throw new HttpError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
  if (throttle) resetLimit(throttle.failureKey);

  const session: CandidateSession = { kind: 'candidate', candidateId: auth.id, email: auth.email, sv: auth.sessionVersion };
  await createCandidateSession(await cookies(), session);
  return candidateResponse(session);
}

/** No-login status tracker: minimal status data of the applications matching the contact. */
export async function careerApplicationStatus(query: string): Promise<PublicApplicationStatus[]> {
  const snapshot = await (await getStore()).getSnapshot();
  return lookupApplicationStatus(snapshot.state, query);
}
