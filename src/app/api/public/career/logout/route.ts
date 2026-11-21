import { cookies } from 'next/headers';
import { clearCandidateSession, getCandidateSession } from '@/src/server/auth/candidate-session';
import { getStore } from '@/src/server/db/store';
import { assertSameOrigin, handleError, json } from '@/src/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    try {
      const session = await getCandidateSession();
      if (session) await (await getStore()).bumpCandidateSessionVersion(session.candidateId);
    } catch (err) {
      // As for staff: without the store the token cannot be revoked, but this browser is signed out.
      console.warn('[auth] candidate logout could not revoke the session:', err instanceof Error ? err.name : 'unknown');
    }
    await clearCandidateSession(await cookies());
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
