import type {
  AdmissionToken2027,
  AdmissionTokenLineItem,
  CareerApplicationItem,
  HafizGraduateItem,
  InstitutionalCalendarEvent,
} from '../types/cms';
import type { AppLanguage } from './translations';

/**
 * Cycles the active website/dashboard language directly on click without a dropdown.
 * Order: bn -> en -> ar -> bn
 */
export function getNextLanguage(current: AppLanguage): AppLanguage {
  if (current === 'bn') return 'en';
  if (current === 'en') return 'ar';
  return 'bn';
}

export function getShortLanguageCode(lang: AppLanguage): string {
  if (lang === 'bn') return 'বাং';
  if (lang === 'ar') return 'عر';
  return 'EN';
}

/**
 * Normalizes a phone number or email string for exact token/application matching.
 */
export function normalizeContactPhone(raw?: string): string {
  if (!raw) return '';
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.startsWith('880') && digits.length === 13) {
    return digits.slice(2);
  }
  return digits;
}

export function normalizeContactEmail(raw?: string): string {
  return (raw || '').trim().toLowerCase();
}

export interface Official2027FeeParams {
  classKey:
    | 'play'
    | 'nursery-2'
    | 'class-3-5'
    | 'class-6-8'
    | 'dakhil-9-10-general'
    | 'dakhil-9-10-science';
  studentType: 'new' | 'old';
  section: 'General' | 'Hifz';
  stayMode: 'non-residential' | 'day-care' | 'hostel';
  firstTimeStay: boolean;
  transport: boolean;
  transportAmount?: number;
}

export interface Official2027FeeResult {
  lineItems: AdmissionTokenLineItem[];
  subtotalA: number;
  subtotalB: number;
  grandTotal: number;
  baseOneTime: number;
  labFee: number;
  hostelAdmissionFee: number;
  monthlyTuition: number;
  monthlyStayFee: number;
  monthlyTransportFee: number;
}

export const OFFICIAL_2027_CLASS_OPTIONS: Array<{
  key: Official2027FeeParams['classKey'];
  labelBn: string;
  labelEn: string;
  supportsHifz: boolean;
  supportsLabGeneral: boolean;
  supportsStay: boolean;
  tuitionGeneral: number;
  tuitionHifz: number;
}> = [
  {
    key: 'play',
    labelBn: 'প্লে গ্রুপ (Play Group)',
    labelEn: 'Play Group',
    supportsHifz: false,
    supportsLabGeneral: false,
    supportsStay: false,
    tuitionGeneral: 5000,
    tuitionHifz: 5000,
  },
  {
    key: 'nursery-2',
    labelBn: 'নার্সারি – ২য় শ্রেণি (Nursery – Class 2)',
    labelEn: 'Nursery – Class 2',
    supportsHifz: true,
    supportsLabGeneral: false,
    supportsStay: false,
    tuitionGeneral: 6000,
    tuitionHifz: 6000,
  },
  {
    key: 'class-3-5',
    labelBn: '৩য় – ৫ম শ্রেণি (Class 3 – Class 5)',
    labelEn: 'Class 3 – Class 5',
    supportsHifz: true,
    supportsLabGeneral: false,
    supportsStay: true,
    tuitionGeneral: 5500,
    tuitionHifz: 6500,
  },
  {
    key: 'class-6-8',
    labelBn: '৬ষ্ঠ – ৮ম শ্রেণি (Class 6 – Class 8)',
    labelEn: 'Class 6 – Class 8',
    supportsHifz: true,
    supportsLabGeneral: true,
    supportsStay: true,
    tuitionGeneral: 6000,
    tuitionHifz: 7000,
  },
  {
    key: 'dakhil-9-10-general',
    labelBn: 'দাখিল ৯ম – ১০ম শ্রেণি (সাধারণ)',
    labelEn: 'Dakhil Class 9–10 (General)',
    supportsHifz: false,
    supportsLabGeneral: true,
    supportsStay: true,
    tuitionGeneral: 6500,
    tuitionHifz: 6500,
  },
  {
    key: 'dakhil-9-10-science',
    labelBn: 'দাখিল ৯ম – ১০ম শ্রেণি (বিজ্ঞান)',
    labelEn: 'Dakhil Class 9–10 (Science)',
    supportsHifz: false,
    supportsLabGeneral: true,
    supportsStay: true,
    tuitionGeneral: 7000,
    tuitionHifz: 7000,
  },
];

/**
 * Computes the exact Official 2027 Maharat Model Madrasah Admission & Monthly Fee Schedule
 * matching MMM_Fee_Guide_2027_Guardian.pdf and MMM_Admission_Token_2027.pdf.
 */
export function calculateOfficial2027TokenFees(params: Official2027FeeParams): Official2027FeeResult {
  const cls =
    OFFICIAL_2027_CLASS_OPTIONS.find((c) => c.key === params.classKey) ||
    OFFICIAL_2027_CLASS_OPTIONS[2];

  const isNew = params.studentType === 'new';
  const effectiveSection = cls.supportsHifz ? params.section : 'General';
  const effectiveStay = cls.supportsStay ? params.stayMode : 'non-residential';

  // Part A: One-Time Admission Fees (Items 1-6)
  const formFee = isNew ? 500 : 0;
  const admissionFee = isNew ? 10000 : 0;
  const sessionCharge = 12000;
  const annualOtherFees = 12000;
  const labFee = cls.supportsLabGeneral && effectiveSection === 'General' ? 2000 : 0;
  const hostelAdmissionFee =
    (effectiveStay === 'day-care' || effectiveStay === 'hostel') && params.firstTimeStay
      ? 18500
      : 0;

  // Part B: First Month's Fees (Items 7-10)
  const monthlyTuition =
    effectiveSection === 'Hifz' ? cls.tuitionHifz : cls.tuitionGeneral;
  const monthlyDayCare = effectiveStay === 'day-care' ? 12500 : 0;
  const monthlyHostel = effectiveStay === 'hostel' ? 14500 : 0;
  const monthlyTransport =
    params.transport ? Math.max(0, Math.round(params.transportAmount ?? 5000)) : 0;

  const lineItems: AdmissionTokenLineItem[] = [
    {
      no: 1,
      part: 'A',
      labelEn: 'Admission Form (New students only)',
      labelBn: 'ভর্তি ফরম (শুধুমাত্র নতুন শিক্ষার্থী)',
      fixedAmount: formFee,
      payableAmount: formFee,
      comment: isNew ? '' : 'Old student',
    },
    {
      no: 2,
      part: 'A',
      labelEn: 'Admission Fee (New students only)',
      labelBn: 'ভর্তি ফি (শুধুমাত্র নতুন শিক্ষার্থী)',
      fixedAmount: admissionFee,
      payableAmount: admissionFee,
      comment: isNew ? '' : 'Old student',
    },
    {
      no: 3,
      part: 'A',
      labelEn: 'Session Charge (All students)',
      labelBn: 'সেশন চার্জ (সকল শিক্ষার্থী)',
      fixedAmount: sessionCharge,
      payableAmount: sessionCharge,
      comment: '',
    },
    {
      no: 4,
      part: 'A',
      labelEn: 'Annual Other Fees (Supplies, Tour, AC, IT, Sports, ID, Mag.)',
      labelBn: 'বার্ষিক অন্যান্য ফি (স্টেশনারি, সফর, এসি, আইটি, খেলাধুলা, আইডি, ম্যাগাজিন)',
      fixedAmount: annualOtherFees,
      payableAmount: annualOtherFees,
      comment: '',
    },
    {
      no: 5,
      part: 'A',
      labelEn: 'Lab Fee (Class 6-10 General only)',
      labelBn: 'ল্যাব ফি (৬ষ্ঠ–১০ম জেনারেল)',
      fixedAmount: labFee,
      payableAmount: labFee,
      comment: labFee > 0 ? '' : 'N/A',
    },
    {
      no: 6,
      part: 'A',
      labelEn: 'Hostel / Day-Care Admission (First-time only)',
      labelBn: 'হোস্টেল / ডে-কেয়ার এককালীন ফি (প্রথমবার)',
      fixedAmount: hostelAdmissionFee,
      payableAmount: hostelAdmissionFee,
      comment: hostelAdmissionFee > 0 ? 'Establishment + Sports' : 'N/A',
    },
    {
      no: 7,
      part: 'B',
      labelEn: `Monthly Tuition Fee (${cls.labelEn} · ${effectiveSection})`,
      labelBn: `মাসিক বেতন (${cls.labelBn} · ${effectiveSection})`,
      fixedAmount: monthlyTuition,
      payableAmount: monthlyTuition,
      comment: '',
    },
    {
      no: 8,
      part: 'B',
      labelEn: 'Monthly Day-Care Fee (Class 3+ only)',
      labelBn: 'মাসিক ডে-কেয়ার ফি (৩য় শ্রেণি+)',
      fixedAmount: monthlyDayCare,
      payableAmount: monthlyDayCare,
      comment: monthlyDayCare > 0 ? '2 Meals + 3 Snacks + Care' : 'N/A',
    },
    {
      no: 9,
      part: 'B',
      labelEn: 'Monthly Hostel Fee (Class 3+ only)',
      labelBn: 'মাসিক হোস্টেল ফি (৩য় শ্রেণি+)',
      fixedAmount: monthlyHostel,
      payableAmount: monthlyHostel,
      comment: monthlyHostel > 0 ? '3 Meals + 3 Snacks + Laundry' : 'N/A',
    },
    {
      no: 10,
      part: 'B',
      labelEn: 'Transport Fee (Microbus · ৳5,000-7,000)',
      labelBn: 'পরিবহন ফি (মাইক্রোবাস · ৳৫,০০০–৭,০০০)',
      fixedAmount: monthlyTransport,
      payableAmount: monthlyTransport,
      comment: monthlyTransport > 0 ? '' : 'N/A',
    },
  ];

  const totals = recomputeTokenTotals(lineItems);
  return {
    lineItems,
    subtotalA: totals.subtotalA,
    subtotalB: totals.subtotalB,
    grandTotal: totals.grandTotal,
    baseOneTime: formFee + admissionFee + sessionCharge + annualOtherFees,
    labFee,
    hostelAdmissionFee,
    monthlyTuition,
    monthlyStayFee: monthlyDayCare + monthlyHostel,
    monthlyTransportFee: monthlyTransport,
  };
}

export function recomputeTokenTotals(lineItems: AdmissionTokenLineItem[]): {
  fixedSubtotalA: number;
  subtotalA: number;
  fixedSubtotalB: number;
  subtotalB: number;
  fixedGrandTotal: number;
  grandTotal: number;
  totalDiscount: number;
} {
  const partA = lineItems.filter((i) => i.part === 'A');
  const partB = lineItems.filter((i) => i.part === 'B');
  const fixedSubtotalA = partA.reduce((acc, i) => acc + Math.max(0, Number(i.fixedAmount) || 0), 0);
  const subtotalA = partA.reduce((acc, i) => acc + Math.max(0, Number(i.payableAmount) || 0), 0);
  const fixedSubtotalB = partB.reduce((acc, i) => acc + Math.max(0, Number(i.fixedAmount) || 0), 0);
  const subtotalB = partB.reduce((acc, i) => acc + Math.max(0, Number(i.payableAmount) || 0), 0);
  const fixedGrandTotal = fixedSubtotalA + fixedSubtotalB;
  const grandTotal = subtotalA + subtotalB;
  return {
    fixedSubtotalA,
    subtotalA,
    fixedSubtotalB,
    subtotalB,
    fixedGrandTotal,
    grandTotal,
    totalDiscount: Math.max(0, fixedGrandTotal - grandTotal),
  };
}

/**
 * Auto-matches an Active 2027 Admission Token by Guardian Phone Number or Email.
 */
export function matchAdmissionTokenByContact(
  tokens: AdmissionToken2027[] | undefined,
  contact: { phone?: string; email?: string }
): AdmissionToken2027 | null {
  if (!Array.isArray(tokens) || tokens.length === 0) return null;
  const targetPhone = normalizeContactPhone(contact.phone);
  const targetEmail = normalizeContactEmail(contact.email);
  if (targetPhone.length < 8 && !targetEmail.includes('@')) return null;

  return (
    tokens.find((tok) => {
      if (tok.status !== 'Active') return false;
      const tokPhone = normalizeContactPhone(tok.guardianPhone);
      const tokEmail = normalizeContactEmail(tok.guardianEmail);
      const phoneMatch = targetPhone.length >= 8 && tokPhone.length >= 8 && tokPhone === targetPhone;
      const emailMatch = targetEmail.includes('@') && tokEmail.length > 3 && tokEmail === targetEmail;
      return phoneMatch || emailMatch;
    }) || null
  );
}

/**
 * Generates an official Maharat Admission Token code (e.g. MMM-2027-042).
 */
export function generateAdmissionTokenCode(existingCount: number): string {
  const seq = String(Math.max(1, existingCount + 1)).padStart(3, '0');
  return `MMM-2027-${seq}`;
}

/**
 * Finds career applications for the No-Login Status Tracker by Phone, WhatsApp, or Email.
 */
export function findCareerApplicationsByContact(
  applications: CareerApplicationItem[] | undefined,
  rawQuery: string
): CareerApplicationItem[] {
  if (!Array.isArray(applications) || !rawQuery.trim()) return [];
  const trimmed = rawQuery.trim();
  const qEmail = normalizeContactEmail(trimmed);
  const qPhone = normalizeContactPhone(trimmed);

  return applications.filter((app) => {
    const appEmail = normalizeContactEmail(app.email);
    const appPhone = normalizeContactPhone(app.phone);
    const appWa = normalizeContactPhone(app.whatsapp);

    if (qEmail.includes('@') && appEmail === qEmail) return true;
    if (qPhone.length >= 8 && (appPhone === qPhone || appWa === qPhone)) return true;
    if (trimmed.toUpperCase() === app.id.toUpperCase()) return true;
    return false;
  });
}

/**
 * Verifies a Hifz Certificate by certificate code (from QR scan ?verify-cert=...).
 */
export function findHafizByCertificateCode(
  graduates: HafizGraduateItem[] | undefined,
  certCode: string
): HafizGraduateItem | null {
  if (!Array.isArray(graduates) || !certCode.trim()) return null;
  const clean = certCode.trim().toUpperCase();
  return (
    graduates.find((g) => {
      const computed =
        (g.certificateCode || `MMM-HFZ-${g.completionYear}-${String(g.serialNumber).padStart(2, '0')}`).toUpperCase();
      return computed === clean || g.id.toUpperCase() === clean;
    }) || null
  );
}

/**
 * Built-in Official Bangladesh Government & Islamic Holidays (2026-2027) for Institutional Calendar.
 */
export const BANGLADESH_OFFICIAL_HOLIDAYS: InstitutionalCalendarEvent[] = [
  {
    id: 'hol-2026-11-14',
    titleBn: 'সাধারণ বিভাগ: শিক্ষক নিয়োগ লিখিত ও মৌখিক পরীক্ষা',
    titleEn: 'General Dept: Teacher Recruitment Written & Viva Exam',
    date: '2026-11-14',
    time: '09:00',
    category: 'institutional',
    descriptionBn: 'মাহারাত মডেল মাদ্রাসা শিক্ষক নিয়োগ পরীক্ষা (সকাল ৯:০০ টা)।',
    source: 'local',
  },
  {
    id: 'hol-2026-11-28',
    titleBn: 'হিফজ বিভাগ: শিক্ষক নিয়োগ মৌখিক পরীক্ষা',
    titleEn: 'Hifz Dept: Teacher Recruitment Viva Exam',
    date: '2026-11-28',
    time: '09:00',
    category: 'institutional',
    descriptionBn: 'হিফজ ও নূরানী শিক্ষক নিয়োগের মৌখিক পরীক্ষা (সকাল ৯:০০ টা)।',
    source: 'local',
  },
  {
    id: 'hol-2026-12-16',
    titleBn: 'মহান বিজয় দিবস (সরকারি ছুটি)',
    titleEn: 'Victory Day of Bangladesh (Public Holiday)',
    date: '2026-12-16',
    category: 'govt-holiday',
    descriptionBn: 'বাংলাদেশ সরকারি সাধারণ ছুটি ও দোয়া মাহফিল।',
    source: 'govt',
  },
  {
    id: 'hol-2026-12-25',
    titleBn: 'বড়দিন (সরকারি ছুটি)',
    titleEn: 'Christmas Day (Public Holiday)',
    date: '2026-12-25',
    category: 'govt-holiday',
    descriptionBn: 'সরকারি সাধারণ ছুটি।',
    source: 'govt',
  },
  {
    id: 'hol-2027-01-01',
    titleBn: 'নতুন শিক্ষাবর্ষ ২০২৭ ক্লাস উদ্বোধন ও সবক প্রদান',
    titleEn: 'Academic Session 2027 Inauguration & Sabak Ceremony',
    date: '2027-01-01',
    time: '08:30',
    category: 'academic',
    descriptionBn: '২০২৭ শিক্ষাবর্ষের প্রথম দিন, নবীন বরণ ও দোয়া মাহফিল।',
    source: 'local',
  },
  {
    id: 'hol-2027-02-04',
    titleBn: 'শবে বরাত (ইসলামী ছুটি — চাঁদ দেখা সাপেক্ষে)',
    titleEn: 'Shab-e-Barat (Islamic Holiday — Subject to Moon)',
    date: '2027-02-04',
    category: 'islamic-holiday',
    descriptionBn: 'পবিত্র শবে বরাত উপলক্ষে মাদ্রাসা ছুটি।',
    source: 'islamic',
  },
  {
    id: 'hol-2027-02-21',
    titleBn: 'শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস',
    titleEn: 'Shaheed Day & International Mother Language Day',
    date: '2027-02-21',
    category: 'govt-holiday',
    descriptionBn: 'সরকারি সাধারণ ছুটি ও আলোচনা সভা।',
    source: 'govt',
  },
  {
    id: 'hol-2027-03-10',
    titleBn: 'পবিত্র ঈদুল ফিতর (ইসলামী ছুটি — সম্ভাব্য)',
    titleEn: 'Eid-ul-Fitr (Islamic Holiday — Tentative)',
    date: '2027-03-10',
    category: 'islamic-holiday',
    descriptionBn: 'পবিত্র রমজান ও ঈদুল ফিতরের সরকারি ও প্রাতিষ্ঠানিক ছুটি।',
    source: 'islamic',
  },
  {
    id: 'hol-2027-03-26',
    titleBn: 'মহান স্বাধীনতা ও জাতীয় দিবস (সরকারি ছুটি)',
    titleEn: 'Independence & National Day (Public Holiday)',
    date: '2027-03-26',
    category: 'govt-holiday',
    descriptionBn: 'সরকারি সাধারণ ছুটি।',
    source: 'govt',
  },
  {
    id: 'hol-2027-04-14',
    titleBn: 'বাংলা নববর্ষ ১৪৩৪ (সরকারি ছুটি)',
    titleEn: 'Pohela Boishakh / Bengali New Year (Public Holiday)',
    date: '2027-04-14',
    category: 'govt-holiday',
    descriptionBn: 'সরকারি সাধারণ ছুটি।',
    source: 'govt',
  },
  {
    id: 'hol-2027-05-01',
    titleBn: 'মহান মে দিবস (সরকারি ছুটি)',
    titleEn: 'May Day (Public Holiday)',
    date: '2027-05-01',
    category: 'govt-holiday',
    descriptionBn: 'সরকারি সাধারণ ছুটি।',
    source: 'govt',
  },
  {
    id: 'hol-2027-05-17',
    titleBn: 'পবিত্র ঈদুল আযহা (ইসলামী ছুটি — সম্ভাব্য)',
    titleEn: 'Eid-ul-Adha (Islamic Holiday — Tentative)',
    date: '2027-05-17',
    category: 'islamic-holiday',
    descriptionBn: 'পবিত্র ঈদুল আযহা উপলক্ষে মাদ্রাসা ছুটি।',
    source: 'islamic',
  },
  {
    id: 'hol-2027-06-16',
    titleBn: 'পবিত্র আশুরা (ইসলামী ছুটি — সম্ভাব্য)',
    titleEn: 'Holy Ashura (Islamic Holiday — Tentative)',
    date: '2027-06-16',
    category: 'islamic-holiday',
    descriptionBn: '১০ই মহররম পবিত্র আশুরা।',
    source: 'islamic',
  },
];

/**
 * Generates an RFC-5545 `.ics` calendar file string for exporting to Google/Apple/Outlook Calendar.
 */
export function buildIcsCalendarFile(events: InstitutionalCalendarEvent[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Maharat Model Madrasah//Institutional Calendar 2027//EN',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Maharat Model Madrasah Calendar',
  ];
  for (const ev of events) {
    const cleanDate = ev.date.replace(/-/g, '');
    if (!/^\d{8}$/.test(cleanDate)) continue;
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${ev.id}@maharatmadrasah.edu.bd`);
    lines.push(`DTSTART;VALUE=DATE:${cleanDate}`);
    lines.push(`SUMMARY:${(ev.titleEn || ev.titleBn).replace(/[\r\n]+/g, ' ')}`);
    if (ev.descriptionBn) {
      lines.push(`DESCRIPTION:${ev.descriptionBn.replace(/[\r\n]+/g, ' ')}`);
    }
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export interface SmartPublishSuggestion {
  targetSection: 'hifz-tree' | 'notice' | 'blog' | 'event' | 'news-ticker';
  confidence: number;
  rationaleBn: string;
  rationaleEn: string;
  suggestedTitleBn: string;
  suggestedTitleEn: string;
  suggestedBodyBn: string;
  suggestedBodyEn: string;
  hafizCandidate?: {
    serialNumber: number;
    nameBn: string;
    nameEn: string;
    classNameBn: string;
    completionYear: string;
    durationNoteBn: string;
    facebookPostUrl?: string;
  };
  eventDate?: string;
  category?: string;
  sourceUrl?: string;
}

/**
 * Deterministic fallback classifier when Gemini API is unavailable (and used for unit tests).
 * Accurately detects Hifz graduates (e.g., 31st Hafez from Facebook post), Notices, Events, News, or Blog.
 */
export function classifyContentDeterministically(
  rawText: string,
  sourceUrl: string | undefined,
  currentHuffazCount: number
): SmartPublishSuggestion {
  const text = (rawText || '').trim();
  const lower = text.toLowerCase();
  const nextSerial = Math.max(31, currentHuffazCount + 1);
  const year = String(new Date().getFullYear());

  // 1. Detect Hifz / New Hafez Announcement
  if (
    lower.includes('হাফেজ') ||
    lower.includes('হিফজ') ||
    lower.includes('hafez') ||
    lower.includes('hafiz') ||
    lower.includes('হয়েছে') && lower.includes('পারা')
  ) {
    const nameMatch =
      text.match(/(?:হাফেজ|নাম[:ঃ]?|শিক্ষার্থী[:ঃ]?)\s*([^\n,।()]{3,40})/i) ||
      text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/);
    const extractedName = nameMatch ? nameMatch[1].trim() : `নতুন হাফেজ শিক্ষার্থী #${nextSerial}`;
    return {
      targetSection: 'hifz-tree',
      confidence: 0.94,
      rationaleBn: `পোস্টে হিফজুল কুরআন সমাপ্তি ও হাফেজের তথ্য পাওয়া গেছে। এটি সরাসরি হিফজ ট্রি-তে ${nextSerial}তম হাফেজ হিসেবে যুক্ত করে QR সার্টিফিকেট তৈরি করা যাবে।`,
      rationaleEn: `Detected a new Hifzul Quran completion announcement. Ready to add as #${nextSerial} Hafez in the Hifz Tree with QR-verified certificate.`,
      suggestedTitleBn: `${nextSerial}তম হাফেজ — ${extractedName}`,
      suggestedTitleEn: `#${nextSerial} Hafez — ${extractedName}`,
      suggestedBodyBn: text || `${extractedName} মাহারাত মডেল মাদ্রাসার তাহফিজুল কুরআন বিভাগ থেকে সম্পূর্ণ কুরআন হিফজ সম্পন্ন করেছে।`,
      suggestedBodyEn: `Proudly celebrating ${extractedName} for completing Hifzul Quran at Maharat Model Madrasah.`,
      hafizCandidate: {
        serialNumber: nextSerial,
        nameBn: extractedName,
        nameEn: extractedName,
        classNameBn: 'তাহফিজুল কুরআন বিভাগ',
        completionYear: year,
        durationNoteBn: 'পূর্ণাঙ্গ ৩০ পারা হিফজ সম্পন্ন',
        facebookPostUrl: sourceUrl && sourceUrl.includes('facebook') ? sourceUrl : undefined,
      },
    };
  }

  // 2. Detect Event / Exam / Seminar
  if (
    lower.includes('সেমিনার') ||
    lower.includes('পরীক্ষা') ||
    lower.includes('অনুষ্ঠান') ||
    lower.includes('মাহফিল') ||
    lower.includes('event') ||
    lower.includes('seminar')
  ) {
    const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
    return {
      targetSection: 'event',
      confidence: 0.87,
      rationaleBn: 'এতে অনুষ্ঠান, পরীক্ষা বা সেমিনারের সময়সূচি রয়েছে—এটি ইভেন্ট ও প্রাতিষ্ঠানিক ক্যালেন্ডারে যুক্ত করার জন্য উপযুক্ত।',
      rationaleEn: 'Detected an institutional program, exam, or seminar schedule suitable for Events & Calendar.',
      suggestedTitleBn: text.split('\n')[0].slice(0, 80) || 'মাহারাত প্রাতিষ্ঠানিক অনুষ্ঠান',
      suggestedTitleEn: 'Maharat Institutional Event',
      suggestedBodyBn: text,
      suggestedBodyEn: text,
      eventDate: dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10),
    };
  }

  // 3. Detect Official Notice / Holiday / Circular
  if (
    lower.includes('নোটিশ') ||
    lower.includes('ছুটি') ||
    lower.includes('বিজ্ঞপ্তি') ||
    lower.includes('ভর্তি') ||
    lower.includes('notice') ||
    lower.includes('holiday')
  ) {
    return {
      targetSection: 'notice',
      confidence: 0.89,
      rationaleBn: 'এটি একটি প্রাতিষ্ঠানিক ঘোষণা বা নোটিশ—নোটিশ বোর্ডে পাবলিশ করার জন্য সুপারিশ করা হয়েছে।',
      rationaleEn: 'Detected an official notice/announcement suitable for the Notice Board.',
      suggestedTitleBn: text.split('\n')[0].slice(0, 90) || 'জরুরি প্রাতিষ্ঠানিক নোটিশ',
      suggestedTitleEn: 'Official Institutional Notice',
      suggestedBodyBn: text,
      suggestedBodyEn: text,
      category: lower.includes('ভর্তি') ? 'Admission' : lower.includes('পরীক্ষা') ? 'Exam' : 'General',
    };
  }

  // 4. Short Breaking Headline -> News Ticker
  if (text.length > 0 && text.length <= 140) {
    return {
      targetSection: 'news-ticker',
      confidence: 0.82,
      rationaleBn: 'সংক্ষিপ্ত আপডেট হওয়ায় এটি হোমপেইজের একদম উপরের স্ক্রলিং নিউজ বারে যুক্ত করার জন্য উপযুক্ত।',
      rationaleEn: 'Short update detected — ideal for the top Scrolling News Ticker.',
      suggestedTitleBn: text,
      suggestedTitleEn: text,
      suggestedBodyBn: text,
      suggestedBodyEn: text,
    };
  }

  // 5. Long-form article -> Blog
  return {
    targetSection: 'blog',
    confidence: 0.85,
    rationaleBn: 'বিস্তারিত লেখা বা প্রবন্ধ শনাক্ত হয়েছে—এটি ওয়েবসাইটের ব্লগ সেকশনে আর্টিকেল হিসেবে পাবলিশ করার জন্য উপযুক্ত।',
    rationaleEn: 'Long-form editorial content detected — recommended for publishing in the Blog section.',
    suggestedTitleBn: text.split('\n')[0].slice(0, 90) || 'মাহারাত শিক্ষা ও তারবিয়াহ ব্লগ',
    suggestedTitleEn: 'Maharat Education & Tarbiyah Article',
    suggestedBodyBn: text,
    suggestedBodyEn: text,
    category: 'Education & Tarbiyah',
  };
}
