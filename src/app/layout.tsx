import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import '../index.css';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_TITLE,
  OG_DESCRIPTION,
  OG_IMAGE,
  SITE_NAME,
  requestOrigin,
} from './seo';

const SITE_METADATA: Metadata = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  robots: { index: true, follow: true },
  icons: { icon: [{ url: '/assets/maharat/maharat-favicon.png', type: 'image/png' }] },
  openGraph: {
    title: DEFAULT_TITLE,
    description: OG_DESCRIPTION,
    images: [OG_IMAGE],
    siteName: SITE_NAME,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description:
      'একটি আধুনিক মানসম্পন্ন ব্যতিক্রমী দ্বীনি শিক্ষা প্রতিষ্ঠান — প্রি-প্লে ও প্লে থেকে নবম/দাখিল এবং তাহফিজুল কুরআন বিভাগে ভর্তি চলছে। উত্তরা, ঢাকা।',
    images: [OG_IMAGE],
  },
};

/**
 * Relative metadata URLs (canonical links, Open Graph images) resolve against NEXT_PUBLIC_APP_URL
 * or, when it is not set, the host the request arrived on.
 */
export async function generateMetadata(): Promise<Metadata> {
  const origin = requestOrigin(await headers());
  return { ...SITE_METADATA, metadataBase: new URL(origin || 'http://localhost:3000') };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Maharat Model Madrasah',
  alternateName: ['মাহারাত মডেল মাদ্রাসা', 'مدرسة المهارات النموذجية'],
  identifier: 'EIIN: 140630',
  telephone: '+8801886340308',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'House-7, Road-17/A, Sector-12',
    addressLocality: 'Uttara, Dhaka',
    postalCode: '1230',
    addressCountry: 'BD',
  },
  logo: '/assets/maharat/maharat-favicon.png',
};

const THEME_BOOT_SCRIPT = `(function(){try{var s=localStorage.getItem('maharat_model_madrasah_theme')||localStorage.getItem('craft_international_institute_theme')||localStorage.getItem('theme');var d=s==='dark'||(s!=='light'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.add(d?'dark':'light');r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700;800&family=Hind+Siliguri:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Apply the saved light / dark choice before first paint (same rule as ThemeContext). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-purple-600 selection:text-white transition-colors duration-200"
      >
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
