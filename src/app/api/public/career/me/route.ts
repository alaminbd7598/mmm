import { getCandidateSession } from '@/src/server/auth/candidate-session';
import { handleError, json } from '@/src/server/http';
import { candidateResponse } from '@/src/server/state/career-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The signed-in candidate's profile and own applications; `{ok, candidate: null}` when signed out. */
export async function GET() {
  try {
    const session = await getCandidateSession();
    if (!session) return json({ ok: true, candidate: null, applications: [] });
    return json(await candidateResponse(session));
  } catch (err) {
    return handleError(err);
  }
}
