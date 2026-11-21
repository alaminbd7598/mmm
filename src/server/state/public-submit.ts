/**
 * Turns validated anonymous submissions into sync ops (pure; see POST /api/public/submit).
 *
 * - Every record gets a server-generated id, timestamp and status; client ids are ignored.
 * - A lead for the SAME student (same guardian phone and same student name) as a stored or
 *   earlier submitted lead is not duplicated: the submission is appended to that lead's notes.
 *   A different child on the same phone (siblings) always gets a lead of its own, and a second
 *   full admission form never replaces or drops an earlier one.
 * - New records are moved to the front of their collection, as the client store always did.
 */
import type {
  AdmissionLead,
  CMSState,
  CareerApplicationItem,
  EmailNotificationLog,
  GuardianComplaintItem,
  LeadNoteItem,
} from '../../types/cms';
import { normalizePhoneNumber, resolveCourseTitle } from '../../utils/cmsLogic';
import type { CandidateSession, CollectionKey, PublicCreateKey, SyncOp } from '../contracts';
import type { IdFactory } from './ids';
import type {
  PublicCareerApplicationInput,
  PublicComplaintInput,
  PublicEmailInput,
  PublicItemInput,
  PublicLeadInput,
} from './validate';

export interface PublicSubmitContext {
  now: Date;
  /** Display timestamp for `now` (see formatDisplayTimestamp). */
  timestamp: string;
  newId: IdFactory;
  /** Signed-in career candidate, used to bind applications to their account. */
  candidate: CandidateSession | null;
}

export type PublicSubmitPlan =
  | { ok: true; ops: SyncOp[]; ids: string[] }
  | { ok: false; error: string; code: string };

const NOTE_AUTHOR_SYSTEM = 'System';
const NOTE_AUTHOR_APPLICANT = 'Online Applicant (অভিভাবক)';

const isFullAdmission = (lead: PublicLeadInput): boolean =>
  lead.source === 'Full Admission Form' || Boolean(lead.detailedData);

function note(ctx: PublicSubmitContext, authorName: string, text: string): LeadNoteItem {
  return { id: ctx.newId('note'), authorName, timestamp: ctx.timestamp, text };
}

function submissionSummary(lead: PublicLeadInput): string {
  const contact = [lead.name, lead.phone, lead.email].filter(Boolean).join(' · ');
  return lead.message ? `[${lead.source}] ${contact} — ${lead.message}` : `[${lead.source}] ${contact}`;
}

const nameKey = (name: string | undefined): string =>
  (name || '')
    .split('(')[0]
    .toLowerCase()
    .replace(/[\s.,\-_'"’‘]+/g, '');

/** Normalised names a lead is known by: its display name (before any bracket) and the form's student names. */
export function studentNameKeys(lead: { name?: string; detailedData?: { studentNameBn?: string; studentNameEn?: string } }): Set<string> {
  const keys = [lead.name, lead.detailedData?.studentNameBn, lead.detailedData?.studentNameEn].map(nameKey);
  return new Set(keys.filter((k) => k.length > 0));
}

const leadPhones = (lead: AdmissionLead): string[] =>
  [lead.phone, lead.detailedData?.fatherMobile, lead.detailedData?.guardianMobile]
    .map((p) => normalizePhoneNumber(p || ''))
    .filter((p) => p.length >= 10);

export interface LeadMatches {
  /** A lead with this phone AND this student name: the same applicant submitting again. */
  sameStudent?: AdmissionLead;
  /** Another lead on this phone (e.g. a sibling), when there is no same-student match. */
  samePhone?: AdmissionLead;
}

/** Stored leads related to a submission by guardian phone, split by whether the student matches. */
export function findLeadMatches(
  leads: readonly AdmissionLead[],
  phone: string,
  incoming: { name?: string; detailedData?: { studentNameBn?: string; studentNameEn?: string } }
): LeadMatches {
  const wanted = normalizePhoneNumber(phone);
  if (wanted.length < 10) return {};
  const onPhone = leads.filter((l) => leadPhones(l).includes(wanted));
  const names = studentNameKeys(incoming);
  const sameStudent = onPhone.find((l) => [...studentNameKeys(l)].some((k) => names.has(k)));
  return sameStudent ? { sameStudent } : { samePhone: onPhone[0] };
}

const sameJson = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

function newLead(
  input: PublicLeadInput,
  state: CMSState,
  ctx: PublicSubmitContext,
  related?: AdmissionLead
): AdmissionLead {
  const full = isFullAdmission(input);
  const lead = newLeadRecord(input, state, ctx, full);
  if (related) {
    lead.notes = [
      ...(lead.notes || []),
      note(ctx, NOTE_AUTHOR_SYSTEM, `একই অভিভাবকের মোবাইল নম্বরে আরেকটি আবেদন আছে: ${related.name} (${related.id})`),
    ];
  }
  return lead;
}

function newLeadRecord(input: PublicLeadInput, state: CMSState, ctx: PublicSubmitContext, full: boolean): AdmissionLead {
  return {
    ...input,
    id: ctx.newId('lead'),
    courseTitle: resolveCourseTitle(state.courses || [], input.courseId),
    status: 'New',
    submittedAt: ctx.timestamp,
    priority: full ? 'Hot' : 'Warm',
    admissionChancePercent: full ? 90 : 40,
    callLogs: [],
    notes: [
      note(
        ctx,
        NOTE_AUTHOR_SYSTEM,
        full
          ? 'ওয়েবসাইট থেকে সরাসরি ৬-ধাপের পূর্ণাঙ্গ ভর্তি ফর্ম পূরণ করা হয়েছে।'
          : 'ওয়েবসাইট অনলাইন রেজিস্ট্রেশন ফর্ম থেকে নতুন লিড গৃহীত হয়েছে।'
      ),
    ],
  };
}

/** The existing lead with the resubmission recorded. Staff-managed fields are left untouched. */
function mergeIntoLead(existing: AdmissionLead, input: PublicLeadInput, ctx: PublicSubmitContext): AdmissionLead {
  const intro = isFullAdmission(input)
    ? 'অভিভাবক নিজেই অনলাইনে ৬-ধাপের পূর্ণাঙ্গ ভর্তি ফর্ম সাবমিট করেছেন।'
    : 'অভিভাবক পুনরায় অনলাইনে তথ্য হালনাগাদ/রেজিস্ট্রেশন সাবমিট করেছেন।';
  const merged: AdmissionLead = {
    ...existing,
    notes: [...(existing.notes || []), note(ctx, NOTE_AUTHOR_APPLICANT, `${intro}\n${submissionSummary(input)}`)],
  };
  if (!existing.detailedData && input.detailedData) merged.detailedData = input.detailedData;
  return merged;
}

function complaint(input: PublicComplaintInput, ctx: PublicSubmitContext): GuardianComplaintItem {
  return { ...input, id: ctx.newId('comp'), submittedAt: ctx.timestamp, status: 'New' };
}

function adminEmail(input: PublicEmailInput, state: CMSState, ctx: PublicSubmitContext): EmailNotificationLog {
  const settings = state.settings;
  return {
    id: ctx.newId('email-adm'),
    recipientEmail: settings?.email || '',
    recipientName: `${settings?.instituteName || 'Madrasah'} Admissions Desk`,
    recipientType: 'Admin',
    subject: input.subject,
    body: input.body,
    sentAt: ctx.timestamp,
    triggerEvent: input.triggerEvent || 'Public Website Submission',
    status: 'Dispatched (Simulated)',
  };
}

function careerApplication(
  input: PublicCareerApplicationInput,
  state: CMSState,
  ctx: PublicSubmitContext
): CareerApplicationItem | null {
  const job = (state.careerJobs || []).find((j) => j.id === input.jobId);
  if (!job || !job.active) return null;
  const app: CareerApplicationItem = {
    ...input,
    id: ctx.newId('capp'),
    jobTitleBn: job.titleBn,
    isGuestApplication: !ctx.candidate,
    status: 'Received',
    submittedAt: ctx.timestamp,
  };
  if (ctx.candidate) app.applicantAccountEmail = ctx.candidate.email;
  return app;
}

/** Collection writes in first-touch order, plus the ids created per key (newest first). */
class PlanBuilder {
  private readonly writes = new Map<string, { key: PublicCreateKey; item: { id: string } & Record<string, unknown> }>();
  private readonly created = new Map<CollectionKey, string[]>();

  write(key: PublicCreateKey, item: { id: string }, isNew: boolean): void {
    this.writes.set(`${key}:${item.id}`, { key, item: item as { id: string } & Record<string, unknown> });
    if (isNew) this.created.set(key, [item.id, ...(this.created.get(key) || [])]);
  }

  ops(): SyncOp[] {
    const ops: SyncOp[] = [...this.writes.values()].map(({ key, item }) => ({ op: 'upsert', key, item }));
    for (const [key, ids] of this.created) ops.push({ op: 'order', key, ids });
    return ops;
  }
}

export function planPublicSubmit(items: readonly PublicItemInput[], state: CMSState, ctx: PublicSubmitContext): PublicSubmitPlan {
  const builder = new PlanBuilder();
  const ids: string[] = [];
  const leads: AdmissionLead[] = [...(state.leads || [])];

  for (const entry of items) {
    switch (entry.key) {
      case 'leads': {
        const phone = entry.item.phone || entry.item.detailedData?.fatherMobile || '';
        const { sameStudent, samePhone } = findLeadMatches(leads, phone, entry.item);
        // A second, different full form for the same student is kept as its own record.
        const secondForm =
          sameStudent?.detailedData && entry.item.detailedData && !sameJson(sameStudent.detailedData, entry.item.detailedData);
        const match = secondForm ? undefined : sameStudent;
        const lead = match
          ? mergeIntoLead(match, entry.item, ctx)
          : newLead(entry.item, state, ctx, sameStudent ?? samePhone);
        if (match) leads[leads.indexOf(match)] = lead;
        else leads.unshift(lead);
        builder.write('leads', lead, !match);
        ids.push(lead.id);
        break;
      }
      case 'complaints': {
        const item = complaint(entry.item, ctx);
        builder.write('complaints', item, true);
        ids.push(item.id);
        break;
      }
      case 'emails': {
        const item = adminEmail(entry.item, state, ctx);
        builder.write('emails', item, true);
        ids.push(item.id);
        break;
      }
      case 'careerApplications': {
        const item = careerApplication(entry.item, state, ctx);
        if (!item) {
          return { ok: false, code: 'JOB_CLOSED', error: 'This job circular is not accepting applications.' };
        }
        builder.write('careerApplications', item, true);
        ids.push(item.id);
        break;
      }
    }
  }
  return { ok: true, ops: builder.ops(), ids };
}

// ---------------------------------------------------------------------------------------------
// Upload accounting (limits are enforced in public-service.ts)
// ---------------------------------------------------------------------------------------------

const inlineLength = (value: string | undefined): number => (value && value.startsWith('data:') ? value.length : 0);

/** Inline files (student photos, CVs) carried by a submission: how many and their base64 length. */
export function countUploads(items: readonly PublicItemInput[]): { files: number; chars: number } {
  let files = 0;
  let chars = 0;
  for (const entry of items) {
    const length =
      entry.key === 'leads'
        ? inlineLength(entry.item.detailedData?.studentPhotoUrl)
        : entry.key === 'careerApplications'
          ? inlineLength(entry.item.cvFileDataUrl)
          : 0;
    if (length > 0) {
      files += 1;
      chars += length;
    }
  }
  return { files, chars };
}

const storedUploadTotals = new WeakMap<CMSState, number>();

/** Size of the inline files already stored in leads and job applications (memoised per snapshot). */
export function storedUploadChars(state: CMSState): number {
  let total = storedUploadTotals.get(state);
  if (total === undefined) {
    total = 0;
    for (const lead of state.leads || []) total += inlineLength(lead.detailedData?.studentPhotoUrl);
    for (const app of state.careerApplications || []) total += inlineLength(app.cvFileDataUrl);
    storedUploadTotals.set(state, total);
  }
  return total;
}
