/**
 * Guardian-facing 2027 admission token endpoints. Client side of the contract:
 *
 *  POST /api/public/admission-token/match {phone?, email?}
 *       -> {ok, token: null | {id, tokenCode, studentName (first name only), classNameLabel,
 *                              subtotalA, subtotalB, totalDiscount, grandTotal}}
 *  POST /api/public/admission-token/apply {tokenId, phone} -> {ok, version, tokenCode}
 */
import { z } from 'zod';
import { apiPost, type ApiResult } from './client';

export interface AdmissionTokenMatch {
  id: string;
  tokenCode: string;
  studentName: string;
  classNameLabel: string;
  totals: {
    subtotalA: number;
    subtotalB: number;
    totalDiscount: number;
    grandTotal: number;
  };
}

const amount = z.number().catch(0);
const totalsSchema = z.object({ subtotalA: amount, subtotalB: amount, totalDiscount: amount, grandTotal: amount });
const identitySchema = z.object({
  id: z.string().min(1),
  tokenCode: z.string(),
  studentName: z.string().catch(''),
  classNameLabel: z.string().catch(''),
});

/** `{token: {...identity, subtotalA, subtotalB, totalDiscount, grandTotal} | null}` -> match. */
function parseMatch(data: unknown): AdmissionTokenMatch | null {
  const record = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  const raw = record.token;
  if (!raw || typeof raw !== 'object') return null;
  const identity = identitySchema.safeParse(raw);
  const totals = totalsSchema.safeParse(raw);
  if (!identity.success || !totals.success) return null;
  return { ...identity.data, totals: totals.data };
}

export async function matchAdmissionToken(
  contact: { phone?: string; email?: string },
  signal?: AbortSignal
): Promise<ApiResult<{ match: AdmissionTokenMatch | null }>> {
  const res = await apiPost<unknown>('/api/public/admission-token/match', contact, signal);
  if (!res.ok) return res;
  return { ok: true, status: res.status, data: { match: parseMatch(res.data) } };
}

export const applyAdmissionToken = (tokenId: string, phone: string): Promise<ApiResult<{ ok: true }>> =>
  apiPost<{ ok: true }>('/api/public/admission-token/apply', { tokenId, phone });

/** Digits only; the match endpoint is called once the guardian's mobile number is complete. */
export const MIN_TOKEN_MATCH_PHONE_DIGITS = 11;
export const countDigits = (value: string): number => value.replace(/\D/g, '').length;
