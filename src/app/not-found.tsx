import type { Metadata } from 'next';
import { SITE_NAME } from './seo';

export const metadata: Metadata = {
  title: `পেইজটি পাওয়া যায়নি | ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

/** Unknown addresses: a real 404 with a way back, instead of the home page under a wrong URL. */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-50 px-6 text-center dark:bg-slate-950">
      <img src="/assets/maharat/maharat-favicon.png" alt="" width={64} height={64} className="h-16 w-16 rounded-2xl" />
      <p className="font-mono text-sm font-bold tracking-widest text-[#005a6e] dark:text-[#f0c95e]">404</p>
      <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">পেইজটি পাওয়া যায়নি</h1>
      <div className="max-w-md space-y-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        <p>দুঃখিত, আপনি যে ঠিকানাটি খুঁজছেন সেটি এই ওয়েবসাইটে নেই অথবা সরিয়ে নেওয়া হয়েছে।</p>
        <p lang="en">Sorry, the page you are looking for does not exist or has been moved.</p>
        <p lang="ar" dir="rtl">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
      </div>
      <a
        href="/"
        className="rounded-full bg-gradient-to-r from-[#192f64] to-[#005a6e] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005a6e] focus-visible:ring-offset-2"
      >
        হোম পেইজে ফিরে যান · Home · الرئيسية
      </a>
    </main>
  );
}
