import { z } from 'zod';
import type {
  PublicVirtualOfficeStatus,
  VirtualOfficeConfig,
  VirtualOfficeDesk,
  VirtualOfficePlatform,
  VirtualOfficeSession,
  VirtualOfficeStatusMode,
} from '../types/cms';
import { normalizeContactPhone } from './admissionToken2027Logic.ts';

export const DEFAULT_VIRTUAL_OFFICE_CONFIG: VirtualOfficeConfig = {
  enabled: true,
  manualStatus: 'AUTO',
  timezone: 'Asia/Dhaka',
  officeDays: [0, 1, 2, 3, 4, 6], // Sat-Thu (Fri=5 closed)
  openTime: '08:00',
  closeTime: '20:00',
  primaryPlatform: 'Google Meet',
  dutyOfficerNameBn: 'মাওলানা মুনকাদির সাদী ও ভর্তি কাউন্সিলর ডেস্ক',
  dutyOfficerNameEn: 'Admission & Counseling Duty Officer',
  dutyOfficerTitleBn: 'অ্যাডমিশন ও অভিভাবক সহায়তা ডেস্ক',
  dutyOfficerTitleEn: 'Admission & Guardian Desk',
  dutyOfficerPhone: '01886-340308',
  dutyOfficerPhotoUrl: '/assets/maharat/principal-munkadir-sadi.jpg',
  roomUrl: 'https://meet.google.com/mmm-uttara-live',
  zoomMeetingId: '880 1886 3403',
  zoomPasscode: 'MMM2027',
  desks: [
    {
      id: 'desk-admission',
      nameBn: 'ভর্তি ও একাডেমিক কাউন্সেলিং ডেস্ক',
      nameEn: 'Admission & Academic Counseling',
      nameAr: 'مكتب القبول والإرشاد الأكاديمي',
      officerNameBn: 'ভর্তি কাউন্সিলর (উত্তরা সেক্টর-১২)',
      officerNameEn: 'Admission Counselor (Uttara Sec-12)',
      platform: 'Google Meet',
      roomUrl: 'https://meet.google.com/mmm-uttara-live',
      active: true,
    },
    {
      id: 'desk-fees',
      nameBn: 'ফি, বৃত্তি ও এডমিশন টোকেন ডেস্ক',
      nameEn: 'Fee, Scholarship & Token Desk',
      nameAr: 'مكتب الرسوم والمنح الدراسية',
      officerNameBn: 'হিসাব ও বৃত্তি কর্মকর্তা',
      officerNameEn: 'Accounts & Scholarship Officer',
      platform: 'Google Meet',
      roomUrl: 'https://meet.google.com/mmm-fees-desk',
      active: true,
    },
    {
      id: 'desk-principal',
      nameBn: 'অধ্যক্ষের ভার্চুয়াল চেম্বার (প্রবাসী ও বিশেষ সাক্ষাৎ)',
      nameEn: "Principal's Virtual Chamber (NRB & Overseas)",
      nameAr: 'المكتب الافتراضي لمدير المدرسة',
      officerNameBn: 'মুনকাদির সাদী আল-মাদানী (ভারপ্রাপ্ত অধ্যক্ষ)',
      officerNameEn: 'Munkadir Sadi Al-Madani (Acting Principal)',
      platform: 'Zoom',
      roomUrl: 'https://zoom.us/j/88018863403',
      zoomMeetingId: '880 1886 3403',
      zoomPasscode: 'MMM2027',
      active: true,
    },
  ],
};

/**
 * Zod schema enforcing mandatory lead-capture gate fields BEFORE revealing any Meet/Zoom link.
 */
export const virtualOfficeCheckinSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(120, 'Name is too long'),
  phone: z
    .string()
    .trim()
    .refine((val) => {
      const digits = normalizeContactPhone(val);
      return digits.length >= 10 && digits.length <= 15;
    }, 'Please enter a valid mobile / WhatsApp number (10–15 digits)'),
  email: z.string().trim().email('Please enter a valid email address'),
  deskId: z.string().trim().optional(),
  topic: z.string().trim().max(200).optional(),
  department: z.string().trim().max(120).optional(),
  preferredCallbackTime: z.string().trim().max(120).optional(),
});

export type VirtualOfficeCheckinInput = z.infer<typeof virtualOfficeCheckinSchema>;

function parseTimeToMinutes(hhmm: string, fallback: number): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec((hhmm || '').trim());
  if (!m) return fallback;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return fallback;
  return h * 60 + min;
}

/**
 * Evaluates real-time live desk status from manual override OR configured institutional office hours.
 */
export function evaluateVirtualOfficeLiveStatus(
  config: VirtualOfficeConfig,
  now: Date = new Date()
): VirtualOfficeStatusMode {
  if (!config.enabled) return 'OFFLINE';
  if (
    config.manualStatus === 'ONLINE_LIVE' ||
    config.manualStatus === 'BUSY_IN_SESSION' ||
    config.manualStatus === 'OFFLINE'
  ) {
    return config.manualStatus;
  }

  // Evaluate in configured timezone (e.g., Asia/Dhaka)
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: config.timezone || 'Asia/Dhaka',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const weekdayStr = parts.find((p) => p.type === 'weekday')?.value || 'Sun';
    const hourNum = Number(parts.find((p) => p.type === 'hour')?.value || '0') % 24;
    const minNum = Number(parts.find((p) => p.type === 'minute')?.value || '0');
    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    const dayIdx = weekdayMap[weekdayStr] ?? now.getDay();
    const openDays = Array.isArray(config.officeDays) ? config.officeDays : [0, 1, 2, 3, 4, 6];
    if (!openDays.includes(dayIdx)) return 'OFFLINE';

    const curMinutes = hourNum * 60 + minNum;
    const openMin = parseTimeToMinutes(config.openTime, 8 * 60);
    const closeMin = parseTimeToMinutes(config.closeTime, 20 * 60);
    return curMinutes >= openMin && curMinutes < closeMin ? 'ONLINE_LIVE' : 'OFFLINE';
  } catch {
    return 'ONLINE_LIVE';
  }
}

/**
 * STRICT SECURITY SANITIZER:
 * Strips all Meet/Zoom Room URLs, Zoom Meeting IDs, and Passcodes before sending public status
 * or public CMS state to unauthenticated clients.
 */
export function sanitizeVirtualOfficeForPublic(
  config: VirtualOfficeConfig | undefined,
  now: Date = new Date()
): PublicVirtualOfficeStatus {
  const cfg = config || DEFAULT_VIRTUAL_OFFICE_CONFIG;
  const effectiveStatus = evaluateVirtualOfficeLiveStatus(cfg, now);
  const safeDesks = (cfg.desks || DEFAULT_VIRTUAL_OFFICE_CONFIG.desks)
    .filter((d) => d.active !== false)
    .map((d) => ({
      id: d.id,
      nameBn: d.nameBn,
      nameEn: d.nameEn,
      nameAr: d.nameAr,
      officerNameBn: d.officerNameBn,
      officerNameEn: d.officerNameEn,
      platform: d.platform,
    }));

  return {
    enabled: cfg.enabled !== false,
    status: effectiveStatus,
    isOpen: effectiveStatus === 'ONLINE_LIVE',
    platform: cfg.primaryPlatform || 'Google Meet',
    timezone: cfg.timezone || 'Asia/Dhaka',
    openTime: cfg.openTime || '08:00',
    closeTime: cfg.closeTime || '20:00',
    dutyOfficerNameBn: cfg.dutyOfficerNameBn,
    dutyOfficerNameEn: cfg.dutyOfficerNameEn,
    dutyOfficerTitleBn: cfg.dutyOfficerTitleBn,
    dutyOfficerTitleEn: cfg.dutyOfficerTitleEn,
    dutyOfficerPhotoUrl: cfg.dutyOfficerPhotoUrl,
    dutyOfficerPhone: cfg.dutyOfficerPhone,
    desks: safeDesks,
  };
}

/**
 * Resolves the target desk's meeting join details ONLY on server-side after validated check-in.
 */
export function resolveDeskJoinDetails(
  config: VirtualOfficeConfig,
  deskId?: string
): {
  deskNameBn: string;
  deskNameEn: string;
  officerNameBn: string;
  platform: VirtualOfficePlatform;
  roomUrl: string;
  zoomMeetingId?: string;
  zoomPasscode?: string;
} {
  const desk: VirtualOfficeDesk | undefined = (config.desks || []).find(
    (d) => d.id === deskId && d.active !== false
  );
  return {
    deskNameBn: desk?.nameBn || 'ভর্তি ও একাডেমিক কাউন্সেলিং ডেস্ক',
    deskNameEn: desk?.nameEn || 'Admission & Academic Counseling',
    officerNameBn: desk?.officerNameBn || config.dutyOfficerNameBn,
    platform: desk?.platform || config.primaryPlatform || 'Google Meet',
    roomUrl: desk?.roomUrl || config.roomUrl || 'https://meet.google.com/mmm-uttara-live',
    zoomMeetingId: desk?.zoomMeetingId || config.zoomMeetingId,
    zoomPasscode: desk?.zoomPasscode || config.zoomPasscode,
  };
}

/**
 * Computes Virtual Office KPIs & hourly distribution for Admin Dashboard Recharts analytics.
 */
export function computeVirtualOfficeAnalytics(sessions: VirtualOfficeSession[] | undefined) {
  const list = Array.isArray(sessions) ? sessions : [];
  const totalVisits = list.length;
  const enrolledCount = list.filter((s) => s.sessionStatus === 'Enrolled').length;
  const counseledCount = list.filter(
    (s) => s.sessionStatus === 'Counseled' || s.sessionStatus === 'Enrolled'
  ).length;
  const conversionRate = totalVisits > 0 ? Math.round((enrolledCount / totalVisits) * 1000) / 10 : 0;

  const hourBuckets: Record<string, number> = {
    '09:00': 0,
    '11:00': 0,
    '13:00': 0,
    '15:00': 0,
    '17:00': 0,
    '19:00': 0,
  };

  for (const s of list) {
    const dt = new Date(s.checkedInAt);
    if (Number.isNaN(dt.getTime())) continue;
    const hr = dt.getHours();
    if (hr < 10) hourBuckets['09:00'] += 1;
    else if (hr < 12) hourBuckets['11:00'] += 1;
    else if (hr < 14) hourBuckets['13:00'] += 1;
    else if (hr < 16) hourBuckets['15:00'] += 1;
    else if (hr < 18) hourBuckets['17:00'] += 1;
    else hourBuckets['19:00'] += 1;
  }

  return {
    totalVisits,
    counseledCount,
    enrolledCount,
    conversionRate,
    peakHoursData: Object.entries(hourBuckets).map(([slot, visits]) => ({ slot, visits })),
  };
}
