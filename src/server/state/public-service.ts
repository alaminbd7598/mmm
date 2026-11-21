import 'server-only';
import { getCandidateSession } from '../auth/candidate-session';
import type { PublicSubmitResponse } from '../contracts';
import { getStore } from '../db/store';
import { HttpError } from '../http';
import { findPublicTokenMatch, planTokenApply, type ContactQuery, type PublicTokenMatch } from './admission-token';
import { formatDisplayTimestamp, newId } from './ids';
import { planPublicSubmit } from './public-submit';
import { parsePublicSubmit } from './validate';

/** POST /api/public/submit after origin, size and rate checks. */
export async function runPublicSubmit(rawBody: unknown): Promise<PublicSubmitResponse> {
  const parsed = parsePublicSubmit(rawBody);
  if (!parsed.ok) throw new HttpError(400, `Invalid submission: ${parsed.error}`, 'BAD_REQUEST');

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
