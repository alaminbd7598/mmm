import { requireStaff } from '@/src/server/auth/session';
import { assertSameOrigin, handleError, json, readJson } from '@/src/server/http';
import { runStaffSync } from '@/src/server/state/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 12 * 1024 * 1024;

/** Apply the signed-in staff member's authorised state changes (SyncRequest -> SyncResponse). */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await requireStaff();
    const outcome = await runStaffSync(session, await readJson(req, MAX_BODY_BYTES));
    return json(outcome.body, outcome.status);
  } catch (err) {
    return handleError(err);
  }
}
