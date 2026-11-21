import { getStore, storageMode } from '@/src/server/db/store';
import { json } from '@/src/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Health check for hosting monitors: 200 `{ok: true, mode, db: 'up'}` when the data store answers,
 * 503 `{ok: false, mode, db: 'down'}` otherwise. Never includes configuration or error details.
 */
export async function GET() {
  const mode = storageMode();
  try {
    await (await getStore()).getVersion();
    return json({ ok: true, mode, db: 'up' });
  } catch {
    return json({ ok: false, mode, db: 'down' }, 503);
  }
}
