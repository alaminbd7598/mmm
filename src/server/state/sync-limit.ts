/**
 * Per-account ceiling for POST /api/admin/sync. Staff are trusted and signed in, so the limit is
 * far above anything the admin panel sends; it only stops a runaway script or a stolen session
 * from streaming 12 MB bodies at the server without end.
 *
 * What the panel can send at most: one request per edit burst (300 ms debounce, then one round
 * trip, so under 3 per second while someone types without pause) and, for a backup restore, the
 * state in chunks of up to 8 MB sent one after another.
 */
import { consume } from '../rate-limit';

export const SYNC_WINDOW_MS = 10 * 60 * 1000;
/** 5 requests per second, sustained for the whole window. */
export const SYNC_MAX_REQUESTS = 3_000;
/** 2 GB of request bodies per window: several complete restores of the largest state the site can hold. */
export const SYNC_MAX_BYTES = 2 * 1024 * 1024 * 1024;

/**
 * Counts one sync request of `bodyBytes` (the declared Content-Length; pass the body limit when
 * the client declared none) for the account. False when the account is over either ceiling.
 */
export function allowStaffSync(userId: string, bodyBytes: number, now: number = Date.now()): boolean {
  const requests = consume(`staff-sync-count:${userId}`, SYNC_MAX_REQUESTS, SYNC_WINDOW_MS, 1, now);
  const bytes = consume(`staff-sync-bytes:${userId}`, SYNC_MAX_BYTES, SYNC_WINDOW_MS, Math.max(0, bodyBytes), now);
  return requests && bytes;
}
