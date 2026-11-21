import type { Metadata, Viewport } from 'next';
import '../index.css';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_TITLE,
  OG_DESCRIPTION,
  OG_IMAGE,
  SITE_NAME,
  siteUrl,
} from './seo';

export const metadata: Metadata = {
  metadataBase: siteUrl(),
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700;800&family=Hind+Siliguri:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
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
