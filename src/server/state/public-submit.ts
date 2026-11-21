/**
 * Turns validated anonymous submissions into sync ops (pure; see POST /api/public/submit).
 *
 * - Every record gets a server-generated id, timestamp and status; client ids are ignored.
 * - A lead whose normalised phone matches a stored (or earlier submitted) lead is not duplicated:
 *   the submission is appended to that lead's notes and the existing id is returned.
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
import { findMatchingLeadByPhone, resolveCourseTitle } from '../../utils/cmsLogic';
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

function newLead(input: PublicLeadInput, state: CMSState, ctx: PublicSubmitContext): AdmissionLead {
  const full = isFullAdmission(input);
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
        const match = findMatchingLeadByPhone(leads, phone);
        const lead = match ? mergeIntoLead(match, entry.item, ctx) : newLead(entry.item, state, ctx);
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
