import { getStore } from '@/src/server/db/store';
import { handleError, json } from '@/src/server/http';
import { sanitizeVirtualOfficeForPublic } from '@/src/utils/virtualOfficeLogic';
import { getEffectiveVirtualOfficeConfig } from '@/src/server/virtual-office/checkin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public desk status: never includes Meet/Zoom links, meeting ids or passcodes. */
export async function GET() {
  try {
    const { state } = await (await getStore()).getSnapshot();
    const config = getEffectiveVirtualOfficeConfig(state.virtualOfficeConfig);
    return json({ ok: true, virtualOffice: sanitizeVirtualOfficeForPublic(config, new Date()) });
  } catch (err) {
    return handleError(err);
  }
}
