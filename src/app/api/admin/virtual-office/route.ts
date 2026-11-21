import { getStore } from '@/src/server/db/store';
import { requireStaffPermission } from '@/src/server/auth/session';
import { handleError, json } from '@/src/server/http';
import { getEffectiveVirtualOfficeConfig, storedSessions } from '@/src/server/virtual-office/checkin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Full Virtual Office config (incl. room links) and the check-in queue, for authorised staff. */
export async function GET() {
  try {
    await requireStaffPermission('virtual-office', 'view');
    const { state } = await (await getStore()).getSnapshot();
    return json({
      ok: true,
      config: getEffectiveVirtualOfficeConfig(state.virtualOfficeConfig),
      sessions: storedSessions(state),
    });
  } catch (err) {
    return handleError(err);
  }
}
