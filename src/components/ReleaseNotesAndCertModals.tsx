import React from 'react';
import {
  Award,
  CheckCircle2,
  Download,
  MinusCircle,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import { resolveVersionManagerConfig } from '../utils/versionLogic';
import { findHafizByCertificateCode } from '../utils/admissionToken2027Logic';
import { generateHafizCertificatePdf } from '../utils/certificatePdf';

export const ReleaseNotesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { state, language } = useCMS();
  if (!isOpen) return null;

  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  const vm = resolveVersionManagerConfig(state.versionManager);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-[#0a1738] via-[#192f64] to-[#005a6e] px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <Tag className="h-5 w-5 text-[#f0c95e]" />
            <div>
              <h3 className="text-base font-bold">
                {tr(
                  `সিস্টেম আপডেট নোটিস ও চেঞ্জলগ (v${vm.activeVersion})`,
                  `Platform Release Notes & Changelog (v${vm.activeVersion})`,
                  `ملاحظات التحديث والإصدار (v${vm.activeVersion})`
                )}
              </h3>
              <p className="text-[11px] text-slate-200">
                Maharat Model Madrasah · EIIN: 140630 · MC: 21023
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {vm.releases.slice(0, 6).map((rel, idx) => (
            <div
              key={rel.id}
              className={`rounded-2xl border p-4 ${
                idx === 0
                  ? 'border-[#005a6e]/30 bg-[#005a6e]/5 dark:border-teal-800 dark:bg-teal-950/20'
                  : 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#192f64] px-2.5 py-0.5 font-mono text-xs font-bold text-[#f0c95e]">
                    {rel.tag}
                  </span>
                  <span className="text-sm font-bold text-[#192f64] dark:text-white">
                    {rel.title}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {rel.createdAt?.slice(0, 10)}
                </span>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {rel.notes}
              </p>

              {rel.added && rel.added.length > 0 && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                    <PlusCircle className="h-3.5 w-3.5" />
                    {tr('নতুন যুক্ত হয়েছে (Added)', 'Added Features', 'الميزات المضافة')}
                  </div>
                  <ul className="space-y-1 pl-5 text-xs text-slate-700 list-disc dark:text-slate-300">
                    {rel.added.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {rel.improved && rel.improved.length > 0 && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase text-sky-700 dark:text-sky-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    {tr('উন্নয়ন করা হয়েছে (Improved)', 'Improved', 'تحسينات')}
                  </div>
                  <ul className="space-y-1 pl-5 text-xs text-slate-700 list-disc dark:text-slate-300">
                    {rel.improved.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {rel.removed && rel.removed.length > 0 && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase text-rose-700 dark:text-rose-400">
                    <MinusCircle className="h-3.5 w-3.5" />
                    {tr('বাদ দেওয়া হয়েছে (Removed)', 'Removed', 'المحذوفات')}
                  </div>
                  <ul className="space-y-1 pl-5 text-xs text-slate-700 list-disc dark:text-slate-300">
                    {rel.removed.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CertificateVerificationModal: React.FC<{
  certCode: string | null;
  onClose: () => void;
}> = ({ certCode, onClose }) => {
  const { state, language } = useCMS();
  if (!certCode) return null;

  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  const graduates = state.hifzTreeConfig?.graduates || [];
  const matched = findHafizByCertificateCode(graduates, certCode);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-[#0a1738] to-[#005a6e] px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#f0c95e]" />
            <span className="text-sm font-bold">
              {tr('অফিশিয়াল হিফজ সার্টিফিকেট ভেরিফিকেশন', 'Official Hifz Certificate Verification', 'التحقق من شهادة التحفيظ')}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white/10 p-1 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 text-center">
          {matched ? (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                <Award className="h-3.5 w-3.5" />
                {tr('ভেরিফাইড ও অথেনটিক সার্টিফিকেট', 'VERIFIED & AUTHENTIC CERTIFICATE', 'شهادة موثقة ورسمية')}
              </div>
              <h3 className="mt-3 text-xl font-extrabold text-[#192f64] dark:text-white">
                {matched.nameBn}
              </h3>
              <p className="text-xs font-semibold text-slate-500">{matched.nameEn}</p>

              <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-4 text-left text-xs dark:bg-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Certificate Code:</span>
                  <span className="font-mono font-bold text-[#192f64] dark:text-[#f0c95e]">
                    {certCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hifz Lineage Serial:</span>
                  <span className="font-bold">
                    #{matched.serialNumber} of {graduates.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Completion Year:</span>
                  <span className="font-bold">{matched.completionYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Institution:</span>
                  <span className="font-bold">Maharat Model Madrasah</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">EIIN / MC:</span>
                  <span className="font-mono font-bold">140630 / 21023</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  generateHafizCertificatePdf({
                    grad: matched,
                    totalHuffaz: graduates.length,
                    users: state.users,
                  })
                }
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#192f64] py-2.5 text-xs font-bold text-white shadow hover:bg-[#0a1738]"
              >
                <Download className="h-4 w-4 text-[#f0c95e]" />
                {tr('সার্টিফিকেট PDF ডাউনলোড করুন', 'Download Verified Certificate PDF', 'تحميل الشهادة PDF')}
              </button>
            </>
          ) : (
            <div className="py-6">
              <p className="text-sm font-bold text-rose-600">
                {tr('সার্টিফিকেট কোড পাওয়া যায়নি', 'Certificate Code Not Found', 'رمز الشهادة غير موجود')}
              </p>
              <p className="mt-1 font-mono text-xs text-slate-500">{certCode}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
