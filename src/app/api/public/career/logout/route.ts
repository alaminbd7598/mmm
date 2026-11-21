import { cookies } from 'next/headers';
import { clearCandidateSession, getCandidateSession } from '@/src/server/auth/candidate-session';
import { getStore } from '@/src/server/db/store';
import { assertSameOrigin, handleError, json } from '@/src/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await getCandidateSession().catch(() => null);
    if (session) await (await getStore()).bumpCandidateSessionVersion(session.candidateId);
    await clearCandidateSession(await cookies());
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
