import 'server-only';
import { getCandidateSession } from '../auth/candidate-session';
import type { PublicSubmitResponse } from '../contracts';
import { getStore } from '../db/store';
import { HttpError } from '../http';
import { findPublicTokenMatch, planTokenApply, type ContactQuery, type PublicTokenMatch } from './admission-token';
import { formatDisplayTimestamp, newId } from './ids';
import { planPublicSubmit } from './public-submit';
import { parsePublicSubmit, type PublicItemInput } from './validate';
import { normalizePhoneNumber } from '../../utils/cmsLogic';
import { consume } from '../rate-limit';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
/** Records one phone number may create per hour (a family registering several children fits easily). */
const PER_PHONE_HOURLY_LIMIT = 8;
/** All anonymous submissions per day, and the inline files (photos, CVs) they may carry. */
const GLOBAL_DAILY_SUBMISSIONS = 2000;
const GLOBAL_DAILY_UPLOAD_BYTES = 150 * 1024 * 1024;

const tooMany = () => new HttpError(429, 'Too many submissions. Please try again later.', 'RATE_LIMITED');

/**
 * Caps that do not depend on the client address: per phone number, and site-wide per day for the
 * number of submissions and the bytes of uploaded files, so anonymous traffic cannot fill the
 * database however many addresses it comes from.
 */
function assertSubmissionBudget(items: readonly PublicItemInput[]): void {
  let uploadBytes = 0;
  const phones = new Set<string>();
  for (const entry of items) {
    if (entry.key === 'emails') continue;
    const phone = normalizePhoneNumber(entry.item.phone || '');
    if (phone) phones.add(phone);
    if (entry.key === 'leads') uploadBytes += entry.item.detailedData?.studentPhotoUrl?.length ?? 0;
    if (entry.key === 'careerApplications') uploadBytes += entry.item.cvFileDataUrl?.length ?? 0;
  }
  for (const phone of phones) {
    if (!consume(`public-submit-phone:${phone}`, PER_PHONE_HOURLY_LIMIT, HOUR_MS)) throw tooMany();
  }
  if (!consume('public-submit-global', GLOBAL_DAILY_SUBMISSIONS, DAY_MS, items.length)) throw tooMany();
  if (uploadBytes > 0 && !consume('public-submit-upload-bytes', GLOBAL_DAILY_UPLOAD_BYTES, DAY_MS, uploadBytes)) {
    throw tooMany();
  }
}

/** POST /api/public/submit after origin, size and rate checks. */
export async function runPublicSubmit(rawBody: unknown): Promise<PublicSubmitResponse> {
  const parsed = parsePublicSubmit(rawBody);
  if (!parsed.ok) throw new HttpError(400, `Invalid submission: ${parsed.error}`, 'BAD_REQUEST');
  assertSubmissionBudget(parsed.items);

  const store = await getStore();
  const [snapshot, candidate] = await Promise.all([
    store.getSnapshot(),
    parsed.items.some((i) => i.key === 'careerApplications') ? getCandidateSession().catch(() => null) : null,
  ]);
  const now = new Date();
  const plan = planPublicSubmit(parsed.items, snapshot.state, {
    now,
    timestamp: formatDisplayTimestamp(now),
    newId,
    candidate,
  });
  if (!plan.ok) throw new HttpError(400, plan.error, plan.code);
  const result = await store.applyOps(plan.ops);
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
  const snapshot = await store.getSnapshot();
  const plan = planTokenApply(snapshot.state, input, new Date().toISOString());
  if (!plan.ok) throw new HttpError(plan.status, plan.error, plan.code);
  const result = await store.applyOps([plan.op]);
  return { version: result.version, tokenCode: plan.tokenCode };
}
