import { BotQAItem, ExternalPortalLink, HafizGraduateItem } from '../types/cms';

export const MAHARAT_LOGO_COLORS = {
  navyDeep: '#0a1738',
  navyPrimary: '#192f64', // Exact Maharat Logo Shield & English bar hex
  navyBright: '#1e4280',
  tealDeep: '#004454',
  tealPrimary: '#005a6e', // Exact Maharat Logo Bangla wordmark & ribbon hex
  tealBright: '#007c91',
  tealCyan: '#0ea5b7',
  goldPrimary: '#9c7a32', // Exact Maharat Logo Arabic wordmark & laurel hex
  goldMid: '#c4962c',
  goldBright: '#e5b94c',
} as const;

export const DEFAULT_EXTERNAL_PORTALS: ExternalPortalLink[] = [
  {
    id: 'erp-student-portal',
    labelBn: 'স্টুডেন্ট ও অভিভাবক লগইন (ERP Portal)',
    labelEn: 'Student & Guardian Login (ERP)',
    subtitleBn: 'ক্লাস রুটিন, হোমওয়ার্ক, রেজাল্ট, উপস্থিতি ও বেতন পেমেন্ট',
    subtitleEn: 'Class Routine, Homework, Exam Results, Attendance & Fees',
    url: 'http://103.166.74.212:2020/student_login.aspx',
    category: 'student',
    active: true,
  },
  {
    id: 'erp-admin-portal',
    labelBn: 'মাদ্রাসা ইআরপি অ্যাডমিন লগইন (ERP Software)',
    labelEn: 'Madrasah ERP Admin Login',
    subtitleBn: 'কেন্দ্রীয় ইআরপি অ্যাডমিন, শিক্ষক, হিসাবরক্ষণ ও পূর্ণাঙ্গ রিপোর্ট',
    subtitleEn: 'Central School ERP Admin, Accounts & Operations',
    url: 'http://103.166.74.212:2020/login.aspx',
    category: 'admin',
    active: true,
  },
];

export function resolveExternalPortals(
  configured?: ExternalPortalLink[] | null
): ExternalPortalLink[] {
  if (!Array.isArray(configured) || configured.length === 0) {
    return DEFAULT_EXTERNAL_PORTALS;
  }
  return configured.map((item) => ({
    ...item,
    url: (item.url || '').trim(),
  }));
}

export function isValidExternalPortalUrl(url: string): boolean {
  const trimmed = (url || '').trim();
  if (!trimmed) return false;
  return /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(trimmed);
}

export function buildHafizCertificateCode(grad: Pick<HafizGraduateItem, 'serialNumber' | 'completionYear' | 'certificateCode'>): string {
  if (grad.certificateCode && grad.certificateCode.trim()) {
    return grad.certificateCode.trim();
  }
  const year = (grad.completionYear || '2026').replace(/[^0-9]/g, '') || '2026';
  const serialPadded = String(grad.serialNumber || 1).padStart(3, '0');
  return `MMM-HIFZ-${year}-${serialPadded}`;
}

export function buildHafizBiography(grad: HafizGraduateItem): string {
  if (grad.biographyBn && grad.biographyBn.trim()) {
    return grad.biographyBn.trim();
  }
  const cleanName = (grad.nameBn || '').trim();
  const displayName = /^হাফে[জয]\s*/.test(cleanName) ? cleanName : `হাফেজ ${cleanName}`;
  const parts: string[] = [];
  parts.push(
    `${displayName} মাহারাত মডেল মাদ্রাসার (EIIN: 140630 | কোড: 21023) হিফজুল কুরআন বিভাগের গর্বিত ${grad.serialLabelBn}।`
  );
  if (grad.descriptionBn) {
    parts.push(grad.descriptionBn);
  }
  if (grad.durationNoteBn) {
    parts.push(`হিফজ সম্পন্নকরণ তথ্য: ${grad.durationNoteBn} (${grad.completionDate})।`);
  }
  return parts.join(' ');
}

export function sortHifzLineage(
  graduates: HafizGraduateItem[],
  order: 'asc' | 'desc'
): HafizGraduateItem[] {
  return [...graduates].sort((a, b) =>
    order === 'asc' ? a.serialNumber - b.serialNumber : b.serialNumber - a.serialNumber
  );
}

export function reorderSuggestedQuestions(
  list: string[],
  index: number,
  direction: 'up' | 'down'
): string[] {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || index >= list.length || targetIndex < 0 || targetIndex >= list.length) {
    return [...list];
  }
  const next = [...list];
  const [moved] = next.splice(index, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

export function upsertBotQAItem(items: BotQAItem[], entry: BotQAItem): BotQAItem[] {
  const exists = items.some((i) => i.id === entry.id);
  if (exists) {
    return items.map((i) => (i.id === entry.id ? entry : i));
  }
  return [entry, ...items];
}

export function removeBotQAItem(items: BotQAItem[], id: string): BotQAItem[] {
  return items.filter((i) => i.id !== id);
}
