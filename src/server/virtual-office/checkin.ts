import { randomBytes } from 'node:crypto';
import type { SyncOp } from '../contracts';
import type {
  AdmissionLead,
  CMSState,
  VirtualOfficeConfig,
  VirtualOfficeSession,
  VirtualOfficeStatusMode,
} from '../../types/cms';
import {
  DEFAULT_VIRTUAL_OFFICE_CONFIG,
  evaluateVirtualOfficeLiveStatus,
  resolveDeskJoinDetails,
  type VirtualOfficeCheckinInput,
} from '../../utils/virtualOfficeLogic';
import { findLeadMatches } from '../state/public-submit';

export const MAX_VIRTUAL_OFFICE_SESSIONS = 200;

/** Stored config over the defaults; the default desks are used when none are configured. */
export function getEffectiveVirtualOfficeConfig(raw: Partial<VirtualOfficeConfig> | undefined | null): VirtualOfficeConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_VIRTUAL_OFFICE_CONFIG;
  return {
    ...DEFAULT_VIRTUAL_OFFICE_CONFIG,
    ...raw,
    desks: Array.isArray(raw.desks) && raw.desks.length > 0 ? raw.desks : DEFAULT_VIRTUAL_OFFICE_CONFIG.desks,
  };
}

function formatSubmittedAt(now: Date, timeZone: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  };
  try {
    return now.toLocaleString('en-US', { ...opts, timeZone });
  } catch {
    return now.toLocaleString('en-US', opts);
  }
}

export interface CheckinPlan {
  mode: VirtualOfficeStatusMode;
  isLive: boolean;
  session: VirtualOfficeSession;
  lead: AdmissionLead;
  /** False when `lead` is a stored lead (same visitor checking in again) with a note appended. */
  leadIsNew: boolean;
  join: ReturnType<typeof resolveDeskJoinDetails>;
  dutyOfficerPhone: string;
}

/**
 * Session + CRM lead for a validated check-in. A visitor who already has a lead (same phone and
 * same name, the rule used for website submissions) gets a note on that lead instead of a new one.
 */
export function planVirtualOfficeCheckin(
  input: VirtualOfficeCheckinInput,
  config: VirtualOfficeConfig,
  now: Date,
  existingLeads: readonly AdmissionLead[] = []
): CheckinPlan {
  const mode = evaluateVirtualOfficeLiveStatus(config, now);
  const join = resolveDeskJoinDetails(config, input.deskId);
  const isLive = mode === 'ONLINE_LIVE';
  const suffix = randomBytes(3).toString('hex');
  const ms = now.getTime();

  const session: VirtualOfficeSession = {
    id: `vo-${ms}-${suffix}`,
    fullName: input.fullName,
    phone: input.phone,
    email: input.email,
    deskId: input.deskId || 'desk-admission',
    deskNameBn: join.deskNameBn,
    topic: input.topic || 'Virtual Office Live Counseling',
    department: input.department,
    preferredCallbackTime: input.preferredCallbackTime,
    deskMode: isLive ? 'ONLINE_LIVE' : mode === 'BUSY_IN_SESSION' ? 'BUSY_IN_SESSION' : 'OFFLINE',
    sessionStatus: isLive ? 'Joined' : 'Missed — Call Back',
    checkedInAt: now.toISOString(),
  };

  const callback = input.preferredCallbackTime ? ` · Callback: ${input.preferredCallbackTime}` : '';
  const submittedAt = formatSubmittedAt(now, config.timezone || 'Asia/Dhaka');
  const summary = `[Virtual Office ${isLive ? 'Live Join' : 'Callback Request'}] ${input.topic || join.deskNameEn}${callback}`;
  const dutyOfficerPhone = config.dutyOfficerPhone || DEFAULT_VIRTUAL_OFFICE_CONFIG.dutyOfficerPhone;

  const known = findLeadMatches(existingLeads, input.phone, { name: input.fullName }).sameStudent;
  if (known) {
    const lead: AdmissionLead = {
      ...known,
      notes: [
        ...(known.notes || []),
        { id: `note-vo-${ms}-${suffix}`, authorName: 'Virtual Office', timestamp: submittedAt, text: `${summary} — ${join.deskNameBn}` },
      ],
    };
    return { mode, isLive, session, lead, leadIsNew: false, join, dutyOfficerPhone };
  }

  const lead: AdmissionLead = {
    id: `lead-vo-${ms}-${suffix}`,
    name: input.fullName,
    phone: input.phone,
    email: input.email,
    courseId: 'virtual-office',
    courseTitle: `Virtual Office — ${join.deskNameBn}`,
    message: summary,
    status: 'New',
    submittedAt,
    source: 'Quick Inquiry',
    priority: 'Hot',
    marketingSourceTag: 'Virtual Office Desk',
  };

  return { mode, isLive, session, lead, leadIsNew: true, join, dutyOfficerPhone };
}

const asItem = <T extends { id: string }>(v: T) => v as unknown as { id: string } & Record<string, unknown>;

/**
 * Ops that put the new session and lead first, deleting the oldest sessions beyond the cap.
 * `existingSessionIds` is the current stored order (newest first).
 */
export function checkinOps(plan: CheckinPlan, existingSessionIds: readonly string[]): SyncOp[] {
  const overflow = existingSessionIds.filter((id) => id !== plan.session.id).slice(MAX_VIRTUAL_OFFICE_SESSIONS - 1);
  return [
    { op: 'upsert', key: 'virtualOfficeSessions', item: asItem(plan.session) },
    { op: 'order', key: 'virtualOfficeSessions', ids: [plan.session.id] },
    ...overflow.map((id): SyncOp => ({ op: 'delete', key: 'virtualOfficeSessions', id })),
    { op: 'upsert', key: 'leads', item: asItem(plan.lead) },
    ...(plan.leadIsNew ? [{ op: 'order', key: 'leads', ids: [plan.lead.id] } satisfies SyncOp] : []),
  ];
}

export type CheckinResponse =
  | { ok: true; unlocked: false; status: VirtualOfficeStatusMode; session: VirtualOfficeSession; message: string }
  | {
      ok: true;
      unlocked: true;
      status: VirtualOfficeStatusMode;
      session: VirtualOfficeSession;
      join: {
        deskMode: VirtualOfficeSession['deskMode'];
        deskNameBn: string;
        deskNameEn: string;
        officerNameBn: string;
        dutyOfficerPhone: string;
        platform: CheckinPlan['join']['platform'];
        roomUrl: string;
        zoomMeetingId?: string;
        zoomPasscode?: string;
      };
    };

/** Public response: room links and passcodes are only included when the desk is live. */
export function checkinResponse(plan: CheckinPlan): CheckinResponse {
  if (!plan.isLive) {
    return {
      ok: true,
      unlocked: false,
      status: plan.mode,
      session: plan.session,
      message:
        plan.mode === 'BUSY_IN_SESSION'
          ? 'Our duty officer is currently in a counseling session. Your callback ticket has been registered for priority follow-up.'
          : 'Virtual Office is currently offline. Your callback request has been saved and our admission desk will contact you during office hours.',
    };
  }
  const j = plan.join;
  return {
    ok: true,
    unlocked: true,
    status: plan.mode,
    session: plan.session,
    join: {
      deskMode: plan.session.deskMode,
      deskNameBn: j.deskNameBn,
      deskNameEn: j.deskNameEn,
      officerNameBn: j.officerNameBn,
      dutyOfficerPhone: plan.dutyOfficerPhone,
      platform: j.platform,
      roomUrl: j.roomUrl,
      zoomMeetingId: j.zoomMeetingId,
      zoomPasscode: j.zoomPasscode,
    },
  };
}

export function storedSessions(state: Partial<CMSState>): VirtualOfficeSession[] {
  return Array.isArray(state.virtualOfficeSessions) ? state.virtualOfficeSessions : [];
}
