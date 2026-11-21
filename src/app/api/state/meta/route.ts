import type { StateMetaResponse } from '@/src/server/contracts';
import { getStore } from '@/src/server/db/store';
import { handleError, json } from '@/src/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Cheap polling endpoint: current state version. */
export async function GET() {
  try {
    const store = await getStore();
    const { version, updatedAt } = await store.getVersion();
    const body: StateMetaResponse = { ok: true, mode: store.mode, version, updatedAt };
    return json(body);
  } catch (err) {
    return handleError(err);
  }
}
