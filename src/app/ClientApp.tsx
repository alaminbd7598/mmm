'use client';

import dynamic from 'next/dynamic';

/**
 * The interactive site (public website + admin CMS) is a large client application that reads
 * localStorage, window and other browser APIs while rendering. It is loaded on the client only,
 * which keeps its behaviour identical to the original single-page app and avoids hydration
 * mismatches. SEO metadata, structured data, sitemap and robots are rendered on the server.
 */
const App = dynamic(() => import('../App'), { ssr: false });

export default function ClientApp() {
  return <App />;
}
