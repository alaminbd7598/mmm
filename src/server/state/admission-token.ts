/**
 * Public 2027 admission-token lookup and use (pure). Guardians only ever receive the minimum the
 * registration form shows for their own token, and only after naming its phone number or email.
 */
import type { AdmissionToken2027, CMSState } from '../../types/cms';
import { matchAdmissionTokenByContact } from '../../utils/admissionToken2027Logic';
import { normalizePhoneNumber } from '../../utils/cmsLogic';
import type { SyncOp } from '../contracts';

export interface ContactQuery {
  phone?: string;
  email?: string;
}

/** What HomeRegistrationSplitSection displays for an auto-applied token. */
export interface PublicTokenMatch {
  id: string;
  tokenCode: string;
  /** First word of the student's name only. */
  studentName: string;
  classNameLabel: string;
  subtotalA: number;
  subtotalB: number;
  grandTotal: number;
  totalDiscount: number;
}

export const firstNameOf = (name: string | undefined): string => (name || '').trim().split(/\s+/)[0] || '';

export function toPublicTokenMatch(token: AdmissionToken2027): PublicTokenMatch {
  return {
    id: token.id,
    tokenCode: token.tokenCode,
    studentName: firstNameOf(token.studentName),
    classNameLabel: token.classNameLabel,
    subtotalA: token.subtotalA,
    subtotalB: token.subtotalB,
    grandTotal: token.grandTotal,
    totalDiscount: token.totalDiscount ?? 0,
  };
}

/** The guardian's Active token for this contact, reduced to its public fields. */
export function findPublicTokenMatch(state: CMSState, contact: ContactQuery): PublicTokenMatch | null {
  const token = matchAdmissionTokenByContact(state.admissionTokens2027, contact);
  return token ? toPublicTokenMatch(token) : null;
}

export type TokenApplyPlan =
  | { ok: true; op: SyncOp; tokenCode: string }
  | { ok: false; status: number; code: string; error: string };

/**
 * Mark a token Applied. The contact must
 * match the token exactly as the lookup does. A `leadId` is linked only when that lead carries
 * the same phone number, so visitors cannot attach tokens to other people's leads.
 */
export function planTokenApply(
  state: CMSState,
  input: ContactQuery & { tokenId: string; leadId?: string },
  nowIso: string
): TokenApplyPlan {
  const token = (state.admissionTokens2027 || []).find((t) => t.id === input.tokenId);
  const matched = token ? matchAdmissionTokenByContact([token], input) : null;
  if (!token || !matched) {
    return { ok: false, status: 404, code: 'TOKEN_NOT_FOUND', error: 'No active admission token matches these details.' };
  }
  const phone = normalizePhoneNumber(input.phone || '');
  const lead = input.leadId ? (state.leads || []).find((l) => l.id === input.leadId) : undefined;
  const linkLead = Boolean(lead && phone.length >= 10 && normalizePhoneNumber(lead.phone) === phone);
  const updated: AdmissionToken2027 = {
    ...token,
    status: 'Applied',
    appliedLeadId: linkLead && lead ? lead.id : token.appliedLeadId,
    appliedAt: nowIso,
  };
  return {
    ok: true,
    tokenCode: token.tokenCode,
    op: { op: 'upsert', key: 'admissionTokens2027', item: updated as unknown as { id: string } & Record<string, unknown> },
  };
}
