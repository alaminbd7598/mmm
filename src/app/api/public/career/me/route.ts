import { requireCandidate } from '@/src/server/auth/candidate-session';
import { handleError, json } from '@/src/server/http';
import { candidateResponse } from '@/src/server/state/career-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The signed-in candidate's profile and own applications (401 when signed out). */
export async function GET() {
  try {
    return json(await candidateResponse(await requireCandidate()));
  } catch (err) {
    return handleError(err);
  }
}
