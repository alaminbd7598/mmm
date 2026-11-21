import { requireStaff } from '@/src/server/auth/session';
import { HttpError, assertSameOrigin, handleError, json, readJson } from '@/src/server/http';
import { runStaffSync } from '@/src/server/state/service';
import { allowStaffSync } from '@/src/server/state/sync-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 12 * 1024 * 1024;

/** Apply the signed-in staff member's authorised state changes (SyncRequest -> SyncResponse). */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await requireStaff();
    // Counted before the body is read. A request without Content-Length counts as a full body.
    const declared = Number(req.headers.get('content-length'));
    if (!allowStaffSync(session.userId, Number.isFinite(declared) && declared > 0 ? declared : MAX_BODY_BYTES)) {
      throw new HttpError(429, 'Too many save requests. Please try again in a few minutes.', 'RATE_LIMITED');
    }
    const outcome = await runStaffSync(session, await readJson(req, MAX_BODY_BYTES));
    return json(outcome.body, outcome.status);
  } catch (err) {
    return handleError(err);
  }
}
