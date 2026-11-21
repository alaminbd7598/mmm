import { handleError, json } from '@/src/server/http';
import { buildStateResponse } from '@/src/server/state/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public projection for visitors, role-filtered state for signed-in staff (StateResponse). */
export async function GET() {
  try {
    return json(await buildStateResponse());
  } catch (err) {
    return handleError(err);
  }
}
