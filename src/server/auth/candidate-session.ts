import 'server-only';
import { cookies } from 'next/headers';
import { CANDIDATE_SESSION_COOKIE, type CandidateSession } from '../contracts';
import { getStore } from '../db/store';
import { HttpError } from '../http';
import { CANDIDATE_SESSION_TTL_SECONDS, signCandidateToken, verifyCandidateToken } from './jwt';
import { expireSessionCookie, getJwtSecret, writeSessionCookie, type CookieTarget } from './session-cookie';

/** Sign a candidate JWT and set it as the HttpOnly candidate cookie (7 days). */
export async function createCandidateSession(target: CookieTarget, session: CandidateSession): Promise<void> {
  const store = await getStore();
  const token = await signCandidateToken(session, getJwtSecret(store.mode));
  await writeSessionCookie(target, CANDIDATE_SESSION_COOKIE, token, CANDIDATE_SESSION_TTL_SECONDS);
}

export async function clearCandidateSession(target: CookieTarget): Promise<void> {
  await expireSessionCookie(target, CANDIDATE_SESSION_COOKIE);
}

/** The signed-in career candidate, or null. Re-checks that the account still exists with the same id. */
export async function getCandidateSession(): Promise<CandidateSession | null> {
  const token = (await cookies()).get(CANDIDATE_SESSION_COOKIE)?.value;
  if (!token) return null;
  const store = await getStore();
  const claims = await verifyCandidateToken(token, getJwtSecret(store.mode));
  if (!claims) return null;
  const account = await store.getCandidateAuthByEmail(claims.email);
  if (!account || account.id !== claims.candidateId) return null;
  return { kind: 'candidate', candidateId: account.id, email: account.email };
}

export async function requireCandidate(): Promise<CandidateSession> {
  const session = await getCandidateSession();
  if (!session) throw new HttpError(401, 'Sign-in required.', 'UNAUTHENTICATED');
  return session;
}
