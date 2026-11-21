/** Career candidate account helpers for the /api/public/career endpoints (pure). */
import type { CMSState, CareerApplicationItem, CareerCandidateAccount } from '../../types/cms';
import { findCareerApplicationsByContact } from '../../utils/admissionToken2027Logic';
import type { SyncOp } from '../contracts';
import { firstNameOf } from './admission-token';

export type CandidateProfile = Omit<CareerCandidateAccount, 'password'>;

/** Applications as shown to their candidate: uploaded CV contents are not sent back. */
export type CandidateApplication = Omit<CareerApplicationItem, 'cvFileDataUrl'>;

export function toCandidateProfile(candidate: CareerCandidateAccount | CandidateProfile): CandidateProfile {
  const copy: Record<string, unknown> = { ...candidate };
  delete copy.password;
  delete copy.passwordHash;
  return copy as CandidateProfile;
}

export function findCandidate(state: CMSState, candidateId: string): CandidateProfile | null {
  const found = (state.careerCandidates || []).find((c) => c.id === candidateId);
  return found ? toCandidateProfile(found) : null;
}

/**
 * The candidate's applications: only those the server bound to this account because they were
 * submitted while signed in. Guest applications that merely carry the same email are not shown,
 * since registering an account does not prove ownership of the email address.
 */
export function applicationsForCandidate(state: CMSState, email: string): CandidateApplication[] {
  const wanted = email.trim().toLowerCase();
  return (state.careerApplications || [])
    .filter((a) => !a.isGuestApplication && a.applicantAccountEmail?.toLowerCase() === wanted)
    .map((a) => {
      const copy: Record<string, unknown> = { ...a };
      delete copy.cvFileDataUrl;
      return copy as CandidateApplication;
    });
}

export interface NewCandidateInput {
  fullName: string;
  email: string;
  phone: string;
}

/** Ops creating a candidate account (newest first, as the client store did). No password in the document. */
export function newCandidateOps(input: NewCandidateInput, id: string, now: Date): { profile: CandidateProfile; ops: SyncOp[] } {
  const profile: CandidateProfile = {
    id,
    fullName: input.fullName,
    email: input.email.trim().toLowerCase(),
    phone: input.phone,
    createdAt: now.toISOString().slice(0, 10),
  };
  return {
    profile,
    ops: [
      { op: 'upsert', key: 'careerCandidates', item: { ...profile } },
      { op: 'order', key: 'careerCandidates', ids: [id] },
    ],
  };
}

/**
 * What the no-login status tracker may show: first name, position, status and date. No contact
 * details, CV, payment or salary data, and not the HR note: the lookup only needs a phone number
 * or email address, which other people know, and the note is a message to the applicant
 * (interview times, decisions). Applicants read it in their signed-in list instead.
 */
export interface PublicApplicationStatus {
  id: string;
  applicantName: string;
  jobTitleBn: string;
  status: CareerApplicationItem['status'];
  submittedAt: string;
}

/** Maximum applications returned by one status lookup. */
export const MAX_STATUS_RESULTS = 10;

export function toPublicApplicationStatus(app: CareerApplicationItem): PublicApplicationStatus {
  return {
    id: app.id,
    applicantName: firstNameOf(app.applicantName),
    jobTitleBn: app.jobTitleBn,
    status: app.status,
    submittedAt: app.submittedAt,
  };
}

/** Guest status lookup by the phone, WhatsApp number, email or application id used when applying. */
export function lookupApplicationStatus(state: CMSState, query: string): PublicApplicationStatus[] {
  return findCareerApplicationsByContact(state.careerApplications, query)
    .slice(0, MAX_STATUS_RESULTS)
    .map(toPublicApplicationStatus);
}
