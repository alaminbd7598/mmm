import { getStore } from '@/src/server/db/store';
import { HttpError, assertRateLimit, assertSameOrigin, handleError, json, readJson } from '@/src/server/http';
import { virtualOfficeCheckinSchema } from '@/src/utils/virtualOfficeLogic';
import {
  checkinOps,
  checkinResponse,
  getEffectiveVirtualOfficeConfig,
  planVirtualOfficeCheckin,
  storedSessions,
} from '@/src/server/virtual-office/checkin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 8 * 1024;

/** Lead-capture gate: records the visit + a CRM lead, and reveals room links only while live. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    assertRateLimit(req, 'vo-checkin', 5, 10 * 60 * 1000);
    const parsed = virtualOfficeCheckinSchema.safeParse(await readJson(req, MAX_BODY_BYTES));
    if (!parsed.success) {
      throw new HttpError(
        400,
        parsed.error.issues[0]?.message || 'Please provide valid Full Name, Phone, and Email.',
        'BAD_REQUEST'
      );
    }

    const store = await getStore();
    const { state } = await store.getSnapshot();
    const config = getEffectiveVirtualOfficeConfig(state.virtualOfficeConfig);
    const plan = planVirtualOfficeCheckin(parsed.data, config, new Date(), state.leads || []);
    await store.applyOps(checkinOps(plan, storedSessions(state).map((s) => s.id)));
    return json(checkinResponse(plan));
  } catch (err) {
    return handleError(err);
  }
}
