import {
  CareerApplicationItem,
  CareerCandidateAccount,
  CareerJobCircular,
  LeadStatus,
} from '../types/cms';
import { isGoogleMapsEmbedUrl } from './safeUrl';

export const DEFAULT_BOYS_CAMPUS_MAP_URL = 'https://maps.app.goo.gl/SxcrUPWtW8VbSYdEA';
export const DEFAULT_BOYS_CAMPUS_EMBED_URL =
  'https://maps.google.com/maps?q=23.8747771,90.3803319&hl=bn&z=17&output=embed';

export const DEFAULT_GIRLS_CAMPUS_MAP_URL =
  'https://www.google.com/maps/search/?api=1&query=House+7,+Road+17/A,+Sector+12,+Uttara,+Dhaka+1230';
export const DEFAULT_GIRLS_CAMPUS_EMBED_URL =
  'https://maps.google.com/maps?q=House+7,+Road+17/A,+Sector+12,+Uttara,+Dhaka+1230&hl=bn&z=17&output=embed';

/**
 * Pure helper that converts any pasted Google Maps link (short share link,
 * full Google Maps place URL with @lat,lng or !3dLAT!4dLNG, embed URL,
 * or plain campus address) into a clean, reliable iframe embed URL.
 */
export function resolveGoogleMapsEmbedUrl(
  rawUrlOrQuery?: string,
  fallbackEmbedUrl: string = DEFAULT_BOYS_CAMPUS_EMBED_URL
): string {
  const raw = (rawUrlOrQuery || '').trim();
  if (!raw) return fallbackEmbedUrl;

  // Already an embed URL: accepted only from Google's own hosts, never from an arbitrary site.
  if (raw.includes('/maps/embed') || raw.includes('output=embed')) {
    return isGoogleMapsEmbedUrl(raw) ? raw : fallbackEmbedUrl;
  }

  // Known verified Maharat Boys & Main Campus short link
  if (raw.includes('SxcrUPWtW8VbSYdEA')) {
    return DEFAULT_BOYS_CAMPUS_EMBED_URL;
  }

  // Extract !3dLAT!4dLNG exact pin coordinates from Google Maps URLs
  const pinMatch = raw.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (pinMatch) {
    return `https://maps.google.com/maps?q=${pinMatch[1]},${pinMatch[2]}&hl=bn&z=17&output=embed`;
  }

  // Extract @lat,lng viewport coordinates from Google Maps URLs
  const atMatch = raw.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return `https://maps.google.com/maps?q=${atMatch[1]},${atMatch[2]}&hl=bn&z=17&output=embed`;
  }

  // Extract ?q=... or ?query=... from search URLs
  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      const parsed = new URL(raw);
      const qParam = parsed.searchParams.get('q') || parsed.searchParams.get('query');
      if (qParam && qParam.trim()) {
        return `https://maps.google.com/maps?q=${encodeURIComponent(qParam.trim())}&hl=bn&z=17&output=embed`;
      }
      // If it's another unknown maps.app.goo.gl short link that can't be resolved client-side, use fallback embed
      if (parsed.hostname.includes('maps.app.goo.gl') || parsed.hostname.includes('goo.gl')) {
        return fallbackEmbedUrl;
      }
    }
  } catch {
    // Plain address string falls through below
  }

  return `https://maps.google.com/maps?q=${encodeURIComponent(raw)}&hl=bn&z=16&output=embed`;
}

/**
 * Pure step-by-step Lead-to-Admission stage progression helper.
 */
export const LEAD_TO_ADMISSION_FLOW: LeadStatus[] = [
  'New',
  'Contacted',
  'Interested',
  'Follow-up',
  'Campus Visit',
  'Admitted',
];

export const LEAD_STAGE_PROGRESSION_ORDER = LEAD_TO_ADMISSION_FLOW;

export function advanceLeadToNextStage(currentStatus: LeadStatus): LeadStatus {
  const normalized: LeadStatus = currentStatus === 'Pending' ? 'New' : currentStatus;
  const idx = LEAD_TO_ADMISSION_FLOW.indexOf(normalized);
  if (idx === -1) {
    return normalized === 'Not Now' || normalized === 'Rejected' ? 'Contacted' : 'Admitted';
  }
  if (idx >= LEAD_TO_ADMISSION_FLOW.length - 1) {
    return 'Admitted';
  }
  return LEAD_TO_ADMISSION_FLOW[idx + 1];
}

export function getLeadStageProgressPercent(status: LeadStatus): number {
  const normalized: LeadStatus = status === 'Pending' ? 'New' : status;
  if (normalized === 'Enrolled' || normalized === 'Admitted') return 100;
  if (normalized === 'Not Now' || normalized === 'Rejected') return 15;
  const idx = LEAD_TO_ADMISSION_FLOW.indexOf(normalized);
  if (idx < 0) return 50;
  return Math.round(((idx + 1) / LEAD_TO_ADMISSION_FLOW.length) * 100);
}

/**
 * Official Maharat Model Madrasah Recruitment Circulars (5 Positions · Uttara Sector-12)
 */
export const DEFAULT_CAREER_JOBS: CareerJobCircular[] = [
  {
    id: 'job-senior-teacher-general',
    titleBn: 'সিনিয়র শিক্ষক (বাংলা, ইংরেজি, গণিত, বিজ্ঞান ও সামাজিক বিজ্ঞান)',
    titleEn: 'Senior Teacher (Bangla, English, Mathematics, Science & Social Science)',
    departmentBn: 'জেনারেল সেকশন (নার্সারি – দাখিল/দশম)',
    campusBn: 'বয়েজ ও গার্লস ক্যাম্পাস (সেক্টর-১২, উত্তরা)',
    employmentTypeBn: 'পূর্ণকালীন (শনিবার – বৃহস্পতিবার)',
    salaryRangeBn: '৳ ২২,০০০ – ৩৫,০০০/- (যোগ্যতা ও ডেমো ক্লাস মূল্যায়ন সাপেক্ষে)',
    vacancies: 6,
    deadline: '2026-12-30',
    ageLimitBn: 'সর্বোচ্চ ৩৮ বছর (অভিজ্ঞ প্রার্থীদের জন্য শিথিলযোগ্য)',
    priorityBn: 'ইংলিশ ভার্সন, ক্যাডেট বা মানসম্মত মডেল মাদ্রাসায় পাঠদানের অভিজ্ঞতা অগ্রাধিকার পাবে।',
    subjectBreakdownBn: 'বাংলা (১), ইংরেজি (২), গণিত (১), পদার্থ/রসায়ন/বিজ্ঞান (১), বাংলাদেশ ও বিশ্বপরিচয় (১)',
    applicationFeeBDT: 200,
    examDateNoteBn: 'লিখিত পরীক্ষা ও ডেমো ক্লাসের তারিখ SMS/WhatsApp-এ জানানো হবে। আবেদন ফি ৳২০০/- (Bangla QR / bKash / Nagad)।',
    summaryBn:
      'মাহারাত মডেল মাদ্রাসার জেনারেল ও ইংলিশ ভার্সন শাখায় প্রজেক্টর ও স্মার্ট বোর্ড ব্যবহারে দক্ষ, অভিজ্ঞ সিনিয়র শিক্ষক আবশ্যক।',
    requirementsBn: [
      'স্বীকৃত বিশ্ববিদ্যালয় থেকে সংশ্লিষ্ট বিষয়ে স্নাতক (সম্মান) ও স্নাতকোত্তর (ন্যূনতম ২য় শ্রেণি/সিজিপিএ ২.৭৫)।',
      'ক্লাসের পড়া ক্লাসেই আদায় এবং সৃজনশীল প্রশ্নপত্র প্রণয়নে দক্ষতা।',
      'ইসলামি আদব-আখলাক ও প্রাতিষ্ঠানিক ড্রেস কোড অনুসরণে আগ্রহী।',
    ],
    responsibilitiesBn: [
      'দৈনিক লেসন প্ল্যান, স্মার্ট বোর্ড প্রেজেন্টেশন ও অ্যাক্টিভিটি-বেজড পাঠদান।',
      'মাসিক মূল্যায়ন, অভিভাবক মিটিং ও বোর্ড পরীক্ষার প্রস্তুতি তদারকি।',
      'শিক্ষার্থীদের ড্রীম ডায়েরি ও নৈতিক তারবিয়াহ পর্যবেক্ষণ।',
    ],
    active: true,
    featured: true,
    createdAt: '2026-11-15',
  },
  {
    id: 'job-arabic-islamic-teacher',
    titleBn: 'আরবি ও ইসলামিক স্টাডিজ শিক্ষক (কুরআন, হাদিস, ফিকহ ও আরবি সাহিত্য)',
    titleEn: 'Arabic & Islamic Studies Teacher (Quran, Hadith, Fiqh & Spoken Arabic)',
    departmentBn: 'আরবি ও দ্বীনিয়াত বিভাগ',
    campusBn: 'বয়েজ ও গার্লস ক্যাম্পাস (সেক্টর-১২, উত্তরা)',
    employmentTypeBn: 'পূর্ণকালীন (সকাল ৮:০০ – দুপুর ২:৩০)',
    salaryRangeBn: '৳ ২০,০০০ – ৩২,০০০/- + ২টি উৎসব ভাতা',
    vacancies: 4,
    deadline: '2026-12-30',
    ageLimitBn: 'সর্বোচ্চ ৩৮ বছর',
    priorityBn: 'আল-আজহার, মদিনা বিশ্ববিদ্যালয় অথবা দাওরায়ে হাদিস / কামিল (১ম শ্রেণি) ও সাবলীল আরবি কথোপকথনে দক্ষ প্রার্থীদের অগ্রাধিকার।',
    subjectBreakdownBn: 'কুরআন ও তাজবীদ (১), আরবি কথোপকথন ও ব্যাকরণ (২), ফিকহ ও হাদিস (১)',
    applicationFeeBDT: 200,
    examDateNoteBn: 'লিখিত, আরবি কথোপকথন ও তিলাওয়াত যাচাই পরীক্ষা উত্তরা সেক্টর-১২ ক্যাম্পাসে অনুষ্ঠিত হবে।',
    summaryBn:
      'মাদ্রাসা বোর্ড ও AQVI আরবি কারিকুলাম অনুযায়ী ১ম শ্রেণি থেকে দাখিল পর্যন্ত বিশুদ্ধ আরবি ও ইসলামিক স্টাডিজ পাঠদানে অভিজ্ঞ আলেম/আলেমা শিক্ষক আবশ্যক।',
    requirementsBn: [
      'কামিল / দাওরায়ে হাদিস অথবা ইসলামি বিশ্ববিদ্যালয় থেকে স্নাতকোত্তর ডিগ্রি।',
      'বিশুদ্ধ তাজবীদ ও সাবলীল আরবি ভাষায় শ্রেণিকক্ষে কথোপকথনের দক্ষতা।',
      'কম্পিউটারে আরবি ও বাংলা টাইপিং জ্ঞান অতিরিক্ত যোগ্যতা হিসেবে বিবেচিত হবে।',
    ],
    responsibilitiesBn: [
      'শিক্ষার্থীদের আরবি স্পোকেন, নাহু-সরফ ও ব্যবহারিক ফিকহ প্রশিক্ষণ।',
      'দৈনিক সালাত, মাসনুন দোয়া ও সুন্নাহ আমল তত্ত্বাবধান।',
    ],
    active: true,
    featured: true,
    createdAt: '2026-11-16',
  },
  {
    id: 'job-hifz-ustad',
    titleBn: 'সিনিয়র হিফজুল কুরআন ও তাজবীদ শিক্ষক (উস্তাদ / হাফেজা শিক্ষিকা)',
    titleEn: 'Senior Hifzul Quran & Tajweed Teacher (Boys & Girls Wing)',
    departmentBn: 'তাহফিজুল কুরআন বিভাগ',
    campusBn: 'বয়েজ ক্যাম্পাস ও গার্লস ক্যাম্পাস (সেক্টর-১২, উত্তরা)',
    employmentTypeBn: 'পূর্ণকালীন (আবাসিক / ডে-কেয়ার)',
    salaryRangeBn: '৳ ১৮,০০০ – ২৮,০০০/- (আবাসিক ও খাবার সুবিধাসহ আলোচনা সাপেক্ষে)',
    vacancies: 4,
    deadline: '2026-12-30',
    ageLimitBn: '২২ – ৩৫ বছর',
    priorityBn: 'আন্তর্জাতিক হিফজ প্রতিযোগিতায় অংশগ্রহণকারী অথবা হুফফাজুল কুরআন ফাউন্ডেশন প্রশিক্ষণপ্রাপ্ত প্রার্থীদের বিশেষ অগ্রাধিকার।',
    subjectBreakdownBn: 'বালক হিফজ শাখা (২), বালিকা হিফজ শাখা (২)',
    applicationFeeBDT: 200,
    examDateNoteBn: 'সরাসরি তিলাওয়াত ও মাশক মূল্যায়নের মাধ্যমে শর্টলিস্ট করা হবে।',
    summaryBn:
      'সুমিষ্ট তিলাওয়াত, বিশুদ্ধ মাখরাজ ও ২.৫–৩ বছরে হিফজ সম্পন্ন করানোর বাস্তব অভিজ্ঞতাসম্পন্ন হাফেজ উস্তাদ ও হাফেজা শিক্ষিকা আবশ্যক।',
    requirementsBn: [
      'পূর্ণ ৩০ পারা কুরআনুল কারীম হিফজ ও স্বীকৃত প্রতিষ্ঠান থেকে তাজবীদ/ক্বিরাত সনদ।',
      'ন্যূনতম ২–৩ বছর আদর্শ হিফজ মাদ্রাসায় পাঠদানের বাস্তব অভিজ্ঞতা।',
      'শিক্ষার্থীদের প্রতি স্নেহশীল, ধৈর্যশীল ও আমলি তারবিয়াহ প্রদানে দক্ষ।',
    ],
    responsibilitiesBn: [
      'দৈনিক সবক, সাত-সবক, আমুখতা ও মাশক নিবিড়ভাবে তত্ত্বাবধান করা।',
      'আবাসিক ও ডে-কেয়ার শিক্ষার্থীদের সালাত ও সুন্নাহ আমল পর্যবেক্ষণ।',
      'অভিভাবকদের সাথে মাসিক হিফজ প্রগ্রেস রিপোর্ট শেয়ার করা।',
    ],
    active: true,
    featured: true,
    createdAt: '2026-11-16',
  },
  {
    id: 'job-nurani-female',
    titleBn: 'সহকারী শিক্ষিকা — প্রি-প্লে, প্লে, নার্সারি ও নূরানী বিভাগ (গার্লস ও আর্লি ইয়ার্স)',
    titleEn: 'Female Assistant Teacher — Pre-Play, Play, Nursery & Noorani Wing',
    departmentBn: 'আর্লি চাইল্ডহুড ও নূরানী বিভাগ',
    campusBn: 'গার্লস ক্যাম্পাস (বাড়ি-৭, রোড-১৭/এ, সেক্টর-১২)',
    employmentTypeBn: 'পূর্ণকালীন (শনিবার – বৃহস্পতিবার)',
    salaryRangeBn: '৳ ১৫,০০০ – ২২,০০০/- + উৎসব ভাতা',
    vacancies: 3,
    deadline: '2026-12-28',
    ageLimitBn: 'সর্বোচ্চ ৩২ বছর',
    priorityBn: 'নূরানী মুয়াল্লিম প্রশিক্ষণ ও ইংলিশ ফনিক্স/মন্টেসরি অভিজ্ঞতা থাকলে অগ্রাধিকার।',
    subjectBreakdownBn: 'প্রি-প্লে ও প্লে (২), নূরানী ও কেজি (১)',
    applicationFeeBDT: 200,
    examDateNoteBn: 'মহিলা প্রার্থীদের সাক্ষাৎকার পৃথক পর্দাশীল পরিবেশে গ্রহণ করা হবে।',
    summaryBn:
      'কোমলমতি শিশুদের মায়ের যত্নে পাঠদান, নূরানী কায়দা, বাংলা-ইংরেজি ফনিক্স ও আদব-আখলাক শেখানোর জন্য যোগ্যতাসম্পন্ন মহিলা শিক্ষক আবশ্যক।',
    requirementsBn: [
      'স্নাতক / ফাজিল / কামিল অথবা সমমানের ডিগ্রি ও নূরানী মুয়াল্লিম প্রশিক্ষণ।',
      'ছোট শিশুদের আনন্দময় পরিবেশে পাঠদানের দক্ষতা ও মমতাময় আচরণ।',
      'বিশুদ্ধ কুরআন তিলাওয়াত ও প্রমিত বাংলা-ইংরেজি উচ্চারণ।',
    ],
    responsibilitiesBn: [
      'প্রি-প্লে ও প্লে শ্রেণির শিক্ষার্থীদের দৈনিক আনন্দময় পাঠদান ও যত্ন।',
      'হাতের লেখা, ছড়া, মাসনুন দোয়া ও প্রাথমিক গণিত অনুশীলন।',
    ],
    active: true,
    featured: false,
    createdAt: '2026-11-17',
  },
  {
    id: 'job-admission-admin-officer',
    titleBn: 'অ্যাডমিশন অফিসার, হিসাব সহকারী ও ফ্রন্ট-ডেস্ক কো-অর্ডিনেটর',
    titleEn: 'Admission Officer, Accounts Assistant & Front-Desk Coordinator',
    departmentBn: 'প্রশাসন, হিসাব ও অ্যাডমিশন ডেস্ক',
    campusBn: 'প্রধান অফিস (বাড়ি-৭, রোড-১৭/এ, সেক্টর-১২, উত্তরা)',
    employmentTypeBn: 'পূর্ণকালীন (সকাল ৮:৩০ – বিকাল ৫:০০)',
    salaryRangeBn: '৳ ১৬,০০০ – ২৬,০০০/- + পারফরম্যান্স বোনাস',
    vacancies: 2,
    deadline: '2026-12-28',
    ageLimitBn: '২২ – ৩৫ বছর',
    priorityBn: 'শিক্ষাপ্রতিষ্ঠানের ERP সফটওয়্যার, MS Excel, Google Workspace ও অভিভাবক কাউন্সেলিংয়ে অভিজ্ঞদের অগ্রাধিকার।',
    subjectBreakdownBn: 'অ্যাডমিশন ও ফ্রন্ট-ডেস্ক (১), হিসাব ও আইটি সাপোর্ট (১)',
    applicationFeeBDT: 200,
    examDateNoteBn: 'প্র্যাকটিক্যাল কম্পিউটার টেস্ট (Excel/Bangla Typing) ও মৌখিক সাক্ষাৎকার নেওয়া হবে।',
    summaryBn:
      'ভর্তিচ্ছু অভিভাবকদের কাউন্সেলিং, ক্যাম্পাস ভিজিট পরিচালনা, ডিজিটাল লিড ফলো-আপ এবং ২০২৭ এডমিশন টোকেন ও হিসাব ব্যবস্থাপনার জন্য স্মার্ট কর্মকর্তা আবশ্যক।',
    requirementsBn: [
      'যেকোনো বিষয়ে স্নাতক / বিবিএ ডিগ্রি ও কম্পিউটার (MS Office, Excel, বাংলা টাইপিং) দক্ষতা।',
      'অভিভাবকদের সাথে মার্জিত, প্রমিত ও আন্তরিক যোগাযোগ দক্ষতা।',
    ],
    responsibilitiesBn: [
      'অনলাইন ও অফলাইন ভর্তি লিড ফলো-আপ এবং ক্যাম্পাস ভিজিট সমন্বয়।',
      'শিক্ষার্থীদের ভর্তি ডকুমেন্টস যাচাই, ২০২৭ এডমিশন টোকেন ইস্যু ও রেজিস্টার হালনাগাদ রাখা।',
    ],
    active: true,
    featured: false,
    createdAt: '2026-11-18',
  },
];

export const DEFAULT_CAREER_APPLICATIONS: CareerApplicationItem[] = [
  {
    id: 'capp-seed-1',
    jobId: 'job-hifz-ustad',
    jobTitleBn: 'সিনিয়র হিফজুল কুরআন ও তাজবীদ শিক্ষক (উস্তাদ / হাফেজা শিক্ষিকা)',
    applicantName: 'হাফেজ মাওলানা আব্দুল্লাহ আল-মামুন',
    phone: '01718-456789',
    whatsapp: '01718-456789',
    email: 'abdullah.hifz@example.com',
    educationBn: 'হাফেজে কুরআন, হুফফাজুল কুরআন সনদ, কামিল (হাদিস)',
    experienceYearsBn: '৪ বছর (উত্তরা ও মিরপুর হিফজ মাদ্রাসা)',
    expectedSalaryBn: '৳ ২৪,০০০/-',
    paymentTrxId: 'BQR20268891A',
    cvLinkOrFileName: 'CV_Hafiz_Abdullah_Al_Mamun.pdf',
    cvFileName: 'CV_Hafiz_Abdullah_Al_Mamun.pdf',
    coverLetterBn:
      'আমি ৪ বছর যাবত আদর্শ হিফজ বিভাগে সবক ও শুনানী পরিচালনার অভিজ্ঞতাসম্পন্ন। মাহারাত মডেল মাদ্রাসার সাথে কাজ করতে আগ্রহী।',
    isGuestApplication: true,
    status: 'Shortlisted',
    hrNote: 'তিলাওয়াত ও অভিজ্ঞতা চমৎকার — আগামী শনিবার সকাল ১০:০০ টায় ডেমো ক্লাস ও সাক্ষাৎকারের জন্য নির্বাচিত।',
    submittedAt: 'Nov 18, 2026, 11:20 AM',
  },
];

export interface CareerApplicationInput {
  jobId: string;
  jobTitleBn: string;
  applicantName: string;
  phone: string;
  whatsapp?: string;
  email: string;
  educationBn: string;
  experienceYearsBn: string;
  expectedSalaryBn?: string;
  paymentTrxId?: string;
  cvLinkOrFileName?: string;
  cvFileName?: string;
  cvFileDataUrl?: string;
  coverLetterBn?: string;
}

export function validateCareerApplication(
  input: CareerApplicationInput,
  lang: 'bn' | 'en' | 'ar' = 'bn'
): { valid: boolean; error?: string } {
  const tr = (bn: string, en: string, ar: string) =>
    lang === 'bn' ? bn : lang === 'ar' ? ar : en;

  if (!input.applicantName || input.applicantName.trim().length < 2) {
    return {
      valid: false,
      error: tr(
        'অনুগ্রহ করে আবেদনকারীর পূর্ণ নাম লিখুন।',
        'Please enter your full name.',
        'يرجى إدخال الاسم الكامل.'
      ),
    };
  }

  const digits = (input.phone || '').replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    return {
      valid: false,
      error: tr(
        'অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।',
        'Please enter a valid mobile phone number.',
        'يرجى إدخال رقم هاتف صحيح.'
      ),
    };
  }

  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    return {
      valid: false,
      error: tr(
        'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা লিখুন।',
        'Please provide a valid email address.',
        'يرجى إدخال بريد إلكتروني صحيح.'
      ),
    };
  }

  if (!input.educationBn || input.educationBn.trim().length < 2) {
    return {
      valid: false,
      error: tr(
        'অনুগ্রহ করে আপনার সর্বশেষ শিক্ষাগত যোগ্যতা উল্লেখ করুন।',
        'Please enter your highest educational qualification.',
        'يرجى ذكر المؤهل العلمي.'
      ),
    };
  }

  return { valid: true };
}

export function validateCandidateRegistration(
  input: { fullName: string; email: string; phone: string; password: string },
  existingAccounts: CareerCandidateAccount[]
): { valid: boolean; error?: string } {
  if (!input.fullName || input.fullName.trim().length < 2) {
    return { valid: false, error: 'অনুগ্রহ করে পূর্ণ নাম লিখুন।' };
  }
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    return { valid: false, error: 'অনুগ্রহ করে সঠিক ইমেইল ঠিকানা লিখুন।' };
  }
  if ((input.phone || '').replace(/\D/g, '').length < 10) {
    return { valid: false, error: 'অনুগ্রহ করে সঠিক মোবাইল নম্বর লিখুন।' };
  }
  if (!input.password || input.password.trim().length < 4) {
    return { valid: false, error: 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।' };
  }
  const normalizedEmail = input.email.trim().toLowerCase();
  if (existingAccounts.some((a) => a.email.toLowerCase() === normalizedEmail)) {
    return { valid: false, error: 'এই ইমেইল দিয়ে ইতিপূর্বেই অ্যাকাউন্ট তৈরি করা হয়েছে। অনুগ্রহ করে লগইন করুন।' };
  }
  return { valid: true };
}
