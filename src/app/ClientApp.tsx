'use client';

import dynamic from 'next/dynamic';
import type { CMSState } from '../types/cms';

/** Shown while the application bundle loads: site colours and logo instead of a blank page. */
function LoadingShell() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950"
    >
      <img src="/assets/maharat/maharat-favicon.png" alt="" width={56} height={56} className="h-14 w-14 rounded-2xl" />
      <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#192f64]/20 border-t-[#192f64] dark:border-white/20 dark:border-t-[#f0c95e]" />
    </div>
  );
}

/**
 * The interactive site (public website + admin CMS) is a large client application that reads
 * localStorage, window and other browser APIs while rendering. It is loaded on the client only,
 * which keeps its behaviour identical to the original single-page app and avoids hydration
 * mismatches. SEO metadata, structured data, sitemap and robots are rendered on the server, and
 * the server hands over the current public content so the first paint shows live data.
 */
const App = dynamic(() => import('../App'), { ssr: false, loading: LoadingShell });

export default function ClientApp({ initialPublicState }: { initialPublicState?: Partial<CMSState> | null }) {
  return <App initialPublicState={initialPublicState} />;
}
