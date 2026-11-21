import type { Metadata } from 'next';

export const SITE_NAME = 'মাহারাত মডেল মাদ্রাসা | Maharat Model Madrasah';
export const DEFAULT_TITLE = 'মাহারাত মডেল মাদ্রাসা | Maharat Model Madrasah (EIIN: 140630)';
export const DEFAULT_DESCRIPTION =
  'মাহারাত মডেল মাদ্রাসা (Maharat Model Madrasah | مدرسة المهارات النموذجية) — A Madrasah with Excellence | EIIN: 140630 | Madrasah Code: 21023. প্রি-প্লে ও প্লে থেকে নবম/দাখিল (আরবি ও ইংলিশ ভার্সন) এবং তাহফিজুল কুরআন বিভাগে ভর্তি চলছে। উত্তরা সেক্টর-১২, ঢাকা।';
export const DEFAULT_KEYWORDS =
  'মাহারাত মডেল মাদ্রাসা, Maharat Model Madrasah, EIIN 140630, উত্তরা মাদ্রাসা, হিফজুল কুরআন মাদ্রাসা, দাখিল মাদ্রাসা ঢাকা, আরবি ও ইংলিশ ভার্সন মাদ্রাসা, Tahfizul Quran Madrasah Uttara';
export const OG_DESCRIPTION =
  'একটি আধুনিক মানসম্পন্ন ব্যতিক্রমী দ্বীনি শিক্ষা প্রতিষ্ঠান — মানসম্মত শিক্ষা, দক্ষ জাতি ও উন্নত দেশ। প্রধান অফিস ও গার্লস ক্যাম্পাস: বাড়ি-৭, রোড-১৭/এ, সেক্টর-১২, উত্তরা, ঢাকা। বয়েস ক্যাম্পাস: বাড়ি-১১, রোড-১৯, সেক্টর-১২, উত্তরা, ঢাকা।';
export const OG_IMAGE = '/assets/maharat/fb/fb-media-3.jpg';

/** Public page paths (mirrors PAGE_PATH_MAP in src/utils/i18nContent.ts) with Bangla / English page names. */
export const PUBLIC_PAGES: Record<string, { bn: string; en: string }> = {
  '/': { bn: 'হোম', en: 'Home' },
  '/about': { bn: 'আমাদের সম্পর্কে', en: 'About Us' },
  '/context': { bn: 'মাদ্রাসার প্রেক্ষাপট', en: 'Our Context' },
  '/hifz-tree': { bn: 'হিফজুল কুরআন ট্রি', en: 'Hifzul Quran Tree' },
  '/gallery': { bn: 'ফটো গ্যালারি', en: 'Photo Gallery' },
  '/activities': { bn: 'কার্যক্রম', en: 'Activities' },
  '/reviews': { bn: 'অভিভাবকদের মতামত', en: 'Guardian Reviews' },
  '/education-method': { bn: 'শিক্ষা পদ্ধতি', en: 'Education Method' },
  '/ten-year-plan': { bn: '১০ বছরের পাঠ পরিকল্পনা', en: 'Ten-Year Plan' },
  '/curriculum': { bn: 'কারিকুলাম', en: 'Curriculum' },
  '/syllabus': { bn: 'সিলেবাস', en: 'Syllabus' },
  '/daycare-routine': { bn: 'ডে-কেয়ার রুটিন', en: 'Day-Care Routine' },
  '/fees': { bn: 'ভর্তি ও ফি', en: 'Admission & Fees' },
  '/admission-guide': { bn: 'ভর্তি নির্দেশিকা', en: 'Admission Guide' },
  '/admission': { bn: 'অনলাইন ভর্তি', en: 'Online Admission' },
  '/transport': { bn: 'পরিবহন', en: 'Transport' },
  '/feedback': { bn: 'মতামত ও অভিযোগ', en: 'Feedback' },
  '/notices': { bn: 'নোটিশ বোর্ড', en: 'Notice Board' },
  '/blog': { bn: 'ব্লগ ও প্রবন্ধ', en: 'Blog & Articles' },
  '/career': { bn: 'ক্যারিয়ার', en: 'Career' },
  '/contact': { bn: 'যোগাযোগ', en: 'Contact' },
};

const withScheme = (value: string): string => (/^https?:\/\//i.test(value) ? value : `https://${value}`);

/**
 * Canonical origin of the site: NEXT_PUBLIC_APP_URL (or APP_URL), else the Vercel production /
 * deployment domain when running on Vercel. Undefined when nothing is configured.
 */
export function siteUrl(env: Readonly<Record<string, string | undefined>> = process.env): URL | undefined {
  const raw =
    env.NEXT_PUBLIC_APP_URL?.trim() ||
    env.APP_URL?.trim() ||
    env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    env.VERCEL_URL?.trim();
  if (!raw) return undefined;
  try {
    return new URL(withScheme(raw));
  } catch {
    return undefined;
  }
}

/**
 * Origin for absolute URLs built per request (sitemap, robots): the configured site URL, else the
 * host the request arrived on (as forwarded by the hosting proxy).
 */
export function requestOrigin(headers: { get(name: string): string | null }): string {
  const configured = siteUrl();
  if (configured) return configured.origin;
  const host = (headers.get('x-forwarded-host') || headers.get('host') || '').split(',')[0].trim();
  if (!/^[a-z0-9.-]+(:\d+)?$/i.test(host)) return '';
  const proto = (headers.get('x-forwarded-proto') || '').split(',')[0].trim() === 'http' || /^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? 'http' : 'https';
  return `${proto}://${host}`;
}

/** Browser-tab title of a public page path (also used by the client on in-app navigation). */
export function titleForPath(path: string): string {
  const page = PUBLIC_PAGES[path];
  return page && path !== '/' ? `${page.bn} | ${SITE_NAME}` : DEFAULT_TITLE;
}

export function metadataForPath(path: string): Metadata {
  const page = PUBLIC_PAGES[path];
  const isAdmin = path === '/admin' || path.startsWith('/admin/');
  const title = titleForPath(path);
  return {
    title,
    alternates: page ? { canonical: path } : undefined,
    robots: page ? { index: true, follow: true } : { index: false, follow: !isAdmin },
    openGraph: {
      title,
      description: OG_DESCRIPTION,
      images: [OG_IMAGE],
      siteName: SITE_NAME,
      type: 'website',
      url: page ? path : undefined,
    },
  };
}
