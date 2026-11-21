import 'server-only';
import { getCandidateSession } from '../auth/candidate-session';
import type { PublicSubmitResponse } from '../contracts';
import { applyPlanned } from '../db/optimistic';
import { getStore } from '../db/store';
import { HttpError } from '../http';
import { findPublicTokenMatch, planTokenApply, type ContactQuery, type PublicTokenMatch } from './admission-token';
import { formatDisplayTimestamp, newId } from './ids';
import { countUploads, planPublicSubmit, storedUploadChars } from './public-submit';
import { parsePublicSubmit, type PublicItemInput } from './validate';
import { normalizePhoneNumber } from '../../utils/cmsLogic';
import { GLOBAL_PREFIX, UNKNOWN_CLIENT, consume } from '../rate-limit';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
/** Records one phone number may create per hour (a family registering several children fits easily). */
const PER_PHONE_HOURLY_LIMIT = 8;
/** Inline files (student photos, CVs) one client address may upload per day, and their total size. */
const PER_CLIENT_DAILY_UPLOADS = 12;
const PER_CLIENT_DAILY_UPLOAD_BYTES = 24 * 1024 * 1024;
/** All anonymous submissions per day, and the inline files they may carry. */
const GLOBAL_DAILY_SUBMISSIONS = 2000;
const GLOBAL_DAILY_UPLOAD_BYTES = 60 * 1024 * 1024;
const DEFAULT_MAX_STORED_UPLOAD_MB = 160;

/**
 * Ceiling for inline files kept in visitor-created records (base64 size). They live in the
 * database and in the cached snapshot, so beyond it new files are refused until staff delete old
 * leads or applications; submissions without a file are still accepted.
 * MAX_STORED_UPLOAD_MB (default 160) raises or lowers it for the hosting plan's memory.
 */
function maxStoredUploadChars(): number {
  const raw = Number.parseInt(process.env.MAX_STORED_UPLOAD_MB ?? '', 10);
  return (Number.isInteger(raw) && raw >= 0 ? raw : DEFAULT_MAX_STORED_UPLOAD_MB) * 1024 * 1024;
}

let warnedUploadsFull = false;

const tooMany = () => new HttpError(429, 'Too many submissions. Please try again later.', 'RATE_LIMITED');

/**
 * Caps on anonymous submissions: per phone number, per client address for uploaded files, and
 * site-wide per day for the number of submissions and the size of uploaded files, so anonymous
 * traffic cannot fill the database however many addresses it comes from.
 */
function assertSubmissionBudget(items: readonly PublicItemInput[], clientAddress: string): void {
  const phones = new Set<string>();
  for (const entry of items) {
    if (entry.key === 'emails') continue;
    const phone = normalizePhoneNumber(entry.item.phone || '');
    if (phone) phones.add(phone);
  }
  for (const phone of phones) {
    if (!consume(`public-submit-phone:${phone}`, PER_PHONE_HOURLY_LIMIT, HOUR_MS)) throw tooMany();
  }
  if (!consume(`${GLOBAL_PREFIX}public-submit`, GLOBAL_DAILY_SUBMISSIONS, DAY_MS, items.length)) throw tooMany();

  const uploads = countUploads(items);
  if (uploads.files === 0) return;
  // Without a trustworthy address every visitor would share these two counters; the site-wide caps below still apply.
  if (clientAddress !== UNKNOWN_CLIENT) {
    const withinCount = consume(`public-upload-count:${clientAddress}`, PER_CLIENT_DAILY_UPLOADS, DAY_MS, uploads.files);
    const withinBytes = consume(`public-upload-bytes:${clientAddress}`, PER_CLIENT_DAILY_UPLOAD_BYTES, DAY_MS, uploads.chars);
    if (!withinCount || !withinBytes) throw tooMany();
  }
  if (!consume(`${GLOBAL_PREFIX}public-upload-bytes`, GLOBAL_DAILY_UPLOAD_BYTES, DAY_MS, uploads.chars)) throw tooMany();
}

/** POST /api/public/submit after origin, size and rate checks. `clientAddress` comes from clientIp(). */
export async function runPublicSubmit(rawBody: unknown, clientAddress: string): Promise<PublicSubmitResponse> {
  const parsed = parsePublicSubmit(rawBody);
  if (!parsed.ok) throw new HttpError(400, `Invalid submission: ${parsed.error}`, 'BAD_REQUEST');
  assertSubmissionBudget(parsed.items, clientAddress);

  const store = await getStore();
  const candidate = parsed.items.some((i) => i.key === 'careerApplications')
    ? await getCandidateSession().catch(() => null)
    : null;
  const uploads = countUploads(parsed.items);
  // Planned from a snapshot and applied only if the records it updates (a repeat submission is
  // merged into its lead) are unchanged since; otherwise planned again. The budgets above were
  // consumed once and are not touched by a retry.
  const { plan, result } = await applyPlanned(store, (snapshot) => {
    if (uploads.files > 0 && storedUploadChars(snapshot.state) + uploads.chars > maxStoredUploadChars()) {
      if (!warnedUploadsFull) {
        warnedUploadsFull = true;
        console.warn(
          '[uploads] Stored photos and CVs reached MAX_STORED_UPLOAD_MB; new files are refused. Delete old leads or applications, or raise the limit.'
        );
      }
      throw new HttpError(
        507,
        'File uploads are not available at the moment. Please submit without the file.',
        'UPLOADS_UNAVAILABLE'
      );
    }
    const now = new Date();
    const planned = planPublicSubmit(parsed.items, snapshot.state, {
      now,
      timestamp: formatDisplayTimestamp(now),
      newId,
      candidate,
    });
    if (!planned.ok) throw new HttpError(400, planned.error, planned.code);
    return planned;
  });
  return { ok: true, version: result.version, ids: plan.ids };
}

export async function matchAdmissionToken(contact: ContactQuery): Promise<PublicTokenMatch | null> {
  const store = await getStore();
  const snapshot = await store.getSnapshot();
  return findPublicTokenMatch(snapshot.state, contact);
}

export async function applyAdmissionToken(
  input: ContactQuery & { tokenId: string; leadId?: string }
): Promise<{ version: number; tokenCode: string }> {
  const store = await getStore();
  // Re-planned when staff changed the token between the read and the write (it may no longer be Active).
  const { plan, result } = await applyPlanned(store, (snapshot) => {
    const planned = planTokenApply(snapshot.state, input, new Date().toISOString());
    if (!planned.ok) throw new HttpError(planned.status, planned.error, planned.code);
    return { ops: [planned.op], tokenCode: planned.tokenCode };
  });
  return { version: result.version, tokenCode: plan.tokenCode };
}
