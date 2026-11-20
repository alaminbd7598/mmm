import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Plus,
  Printer,
  RotateCcw,
  Ticket,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import type { AdmissionToken2027, AdmissionTokenLineItem } from '../types/cms';
import {
  calculateOfficial2027TokenFees,
  generateAdmissionTokenCode,
  OFFICIAL_2027_CLASS_OPTIONS,
  Official2027FeeParams,
  recomputeTokenTotals,
} from '../utils/admissionToken2027Logic';
import { generateAdmissionToken2027Pdf } from '../utils/certificatePdf';

export const AdminAdmissionTokenTab: React.FC = () => {
  const {
    state,
    currentUser,
    language,
    addAdmissionToken,
    updateAdmissionToken,
    deleteAdmissionToken,
    pushToast,
  } = useCMS();

  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  const tokens = state.admissionTokens2027 || [];

  const [studentName, setStudentName] = useState('');
  const [studentIdNo, setStudentIdNo] = useState(`MMM-2027-${String(tokens.length + 101)}`);
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().slice(0, 10));
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');

  const [classKey, setClassKey] = useState<Official2027FeeParams['classKey']>('class-6-8');
  const [studentType, setStudentType] = useState<'new' | 'old'>('new');
  const [section, setSection] = useState<'General' | 'Hifz'>('Hifz');
  const [stayMode, setStayMode] = useState<'non-residential' | 'day-care' | 'hostel'>('hostel');
  const [firstTimeStay, setFirstTimeStay] = useState(true);
  const [transport, setTransport] = useState(false);
  const [transportAmount, setTransportAmount] = useState(5000);
  const [generalNote, setGeneralNote] = useState('');

  const [lineItems, setLineItems] = useState<AdmissionTokenLineItem[]>(() =>
    calculateOfficial2027TokenFees({
      classKey: 'class-6-8',
      studentType: 'new',
      section: 'Hifz',
      stayMode: 'hostel',
      firstTimeStay: true,
      transport: false,
      transportAmount: 5000,
    }).lineItems
  );

  const selectedClassMeta = useMemo(
    () =>
      OFFICIAL_2027_CLASS_OPTIONS.find((c) => c.key === classKey) ||
      OFFICIAL_2027_CLASS_OPTIONS[2],
    [classKey]
  );

  const recalculateSchedule = (patch: Partial<Official2027FeeParams>) => {
    const nextParams: Official2027FeeParams = {
      classKey: patch.classKey ?? classKey,
      studentType: patch.studentType ?? studentType,
      section: patch.section ?? section,
      stayMode: patch.stayMode ?? stayMode,
      firstTimeStay: patch.firstTimeStay ?? firstTimeStay,
      transport: patch.transport ?? transport,
      transportAmount: patch.transportAmount ?? transportAmount,
    };
    const cls =
      OFFICIAL_2027_CLASS_OPTIONS.find((c) => c.key === nextParams.classKey) ||
      OFFICIAL_2027_CLASS_OPTIONS[2];
    if (!cls.supportsHifz) nextParams.section = 'General';
    if (!cls.supportsStay) nextParams.stayMode = 'non-residential';

    setClassKey(nextParams.classKey);
    setStudentType(nextParams.studentType);
    setSection(nextParams.section);
    setStayMode(nextParams.stayMode);
    setFirstTimeStay(nextParams.firstTimeStay);
    setTransport(nextParams.transport);
    setTransportAmount(nextParams.transportAmount ?? 5000);

    const computed = calculateOfficial2027TokenFees(nextParams);
    setLineItems(computed.lineItems);
  };

  const totals = useMemo(() => recomputeTokenTotals(lineItems), [lineItems]);

  const handleRowChange = (
    no: number,
    field: 'payableAmount' | 'comment',
    value: string | number
  ) => {
    setLineItems((prev) =>
      prev.map((row) =>
        row.no === no
          ? {
              ...row,
              [field]:
                field === 'payableAmount' ? Math.max(0, Number(value) || 0) : String(value),
            }
          : row
      )
    );
  };

  const handleIssueToken = (alsoDownloadPdf: boolean) => {
    if (!studentName.trim() || !guardianPhone.trim()) {
      pushToast(
        tr('তথ্য অসম্পূর্ণ', 'Missing Required Fields', 'الحقول المطلوبة ناقصة'),
        tr(
          'অনুগ্রহ করে শিক্ষার্থীর নাম এবং অভিভাবকের মোবাইল নম্বর লিখুন।',
          'Please enter Student Name and Guardian Phone Number.',
          'يرجى إدخال اسم الطالب ورقم هاتف ولي الأمر.'
        ),
        'info'
      );
      return;
    }

    const tokenCode = generateAdmissionTokenCode(tokens.length);
    const created = addAdmissionToken({
      tokenCode,
      studentName: studentName.trim(),
      studentIdNo: studentIdNo.trim() || tokenCode,
      admissionDate,
      classKey,
      classNameLabel: selectedClassMeta.labelEn,
      studentType,
      section: selectedClassMeta.supportsHifz ? section : 'General',
      stayMode: selectedClassMeta.supportsStay ? stayMode : 'non-residential',
      firstTimeStay,
      transport,
      transportAmount: transport ? transportAmount : 0,
      guardianPhone: guardianPhone.trim(),
      guardianEmail: guardianEmail.trim(),
      lineItems,
      subtotalA: totals.subtotalA,
      subtotalB: totals.subtotalB,
      grandTotal: totals.grandTotal,
      totalDiscount: totals.totalDiscount,
      issuedBy: currentUser?.fullName || 'Principal Office',
      status: 'Active',
      generalNote: generalNote.trim() || undefined,
    });

    if (alsoDownloadPdf) {
      generateAdmissionToken2027Pdf(created, state.users);
    }

    setStudentName('');
    setGuardianPhone('');
    setGuardianEmail('');
    setGeneralNote('');
    setStudentIdNo(`MMM-2027-${String(tokens.length + 102)}`);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    pushToast(
      tr('টোকেন কোড কপি হয়েছে', 'Token Code Copied', 'تم نسخ رمز القبول'),
      code,
      'info'
    );
  };

  const handleToggleStatus = (tok: AdmissionToken2027) => {
    const nextStatus: AdmissionToken2027['status'] =
      tok.status === 'Active' ? 'Applied' : tok.status === 'Applied' ? 'Cancelled' : 'Active';
    updateAdmissionToken({ ...tok, status: nextStatus });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0a1738] via-[#192f64] to-[#005a6e] p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#f0c95e]">
              <Ticket className="h-3.5 w-3.5" />
              {tr(
                'অফিশিয়াল এডমিশন টোকেন ২০২৭ (MMM_Admission_Token_2027)',
                'Official Admission Token 2027 Builder',
                'نظام إصدار رمز القبول الرسمي 2027'
              )}
            </div>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl">
              {tr(
                'ভর্তি টোকেন জেনারেটর ও স্পেশাল ফি ছাড় কন্ট্রোলার',
                'Admission Token Generator & Special Fee Waiver Desk',
                'منشئ رموز القبول والخصومات الخاصة 2027'
              )}
            </h2>
            <p className="mt-1 max-w-2xl text-xs text-slate-200 sm:text-sm">
              {tr(
                'অভিভাবকের মোবাইল বা ইমেইল যুক্ত করে টোকেন ইস্যু করলে ওয়েবসাইটের অনলাইন ভর্তি ফর্মে স্বয়ংক্রিয়ভাবে নির্ধারিত ফি ও ডিসকাউন্ট প্রয়োগ হবে এবং A4 ডুয়াল-কপি PDF প্রিন্ট করা যাবে।',
                'Attach Guardian Phone or Email to auto-apply negotiated 2027 fees & waivers in the online registration form, and print official A4 Landscape Dual-Copy PDFs (Office + Guardian Copy).',
                'أضف هاتف أو بريد ولي الأمر لتطبيق الرسوم والخصومات تلقائياً في نموذج التسجيل عبر الإنترنت وطباعة نسخة PDF رسمية.'
              )}
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-right backdrop-blur-sm">
            <div className="text-[11px] uppercase tracking-wider text-slate-300">
              {tr('ইস্যুকৃত সক্রিয় টোকেন', 'Active Issued Tokens', 'الرموز النشطة')}
            </div>
            <div className="text-2xl font-extrabold text-[#f0c95e]">
              {tokens.filter((t) => t.status === 'Active').length}{' '}
              <span className="text-xs font-normal text-slate-200">/ {tokens.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Builder Form + 10-Line Fee Sheet */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left: Student & Fee Controls */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-5">
          <h3 className="flex items-center gap-2 text-base font-bold text-[#192f64] dark:text-white">
            <UserCheck className="h-4 w-4 text-[#005a6e]" />
            {tr('১. শিক্ষার্থী ও অভিভাবক তথ্য', '1. Student & Guardian Details', '١. بيانات الطالب وولي الأمر')}
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                {tr('শিক্ষার্থীর পূর্ণ নাম *', 'Student Name *', 'اسم الطالب *')}
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g., Abdullah Al Mahi"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                {tr('স্টুডেন্ট আইডি (ID)', 'Student ID No.', 'رقم الطالب')}
              </label>
              <input
                type="text"
                value={studentIdNo}
                onChange={(e) => setStudentIdNo(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                {tr('অভিভাবকের মোবাইল (অটো-অ্যাপ্লাই) *', 'Guardian Phone (Auto-Apply) *', 'هاتف ولي الأمر *')}
              </label>
              <input
                type="tel"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                placeholder="01711-XXXXXX"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                {tr('অভিভাবকের ইমেইল (ঐচ্ছিক)', 'Guardian Email (Optional)', 'بريد ولي الأمر')}
              </label>
              <input
                type="email"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
                placeholder="guardian@example.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                {tr('ভর্তির তারিখ', 'Admission Date', 'تاريخ القبول')}
              </label>
              <input
                type="date"
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                {tr('শ্রেণি নির্বাচন করুন', 'Target Class (2027)', 'الصف الدراسي')}
              </label>
              <select
                value={classKey}
                onChange={(e) =>
                  recalculateSchedule({
                    classKey: e.target.value as Official2027FeeParams['classKey'],
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {OFFICIAL_2027_CLASS_OPTIONS.map((cls) => (
                  <option key={cls.key} value={cls.key}>
                    {language === 'bn' ? cls.labelBn : cls.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggle Pills */}
          <div className="space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => recalculateSchedule({ studentType: 'new' })}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                  studentType === 'new'
                    ? 'bg-[#192f64] text-white shadow'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {tr('নতুন শিক্ষার্থী (৳৩৪,৫০০)', 'New Student (৳34,500)', 'طالب جديد')}
              </button>
              <button
                type="button"
                onClick={() => recalculateSchedule({ studentType: 'old' })}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                  studentType === 'old'
                    ? 'bg-[#192f64] text-white shadow'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {tr('পুরাতন / পুনঃভর্তি (৳২৪,০০০)', 'Old / Re-Adm (৳24,000)', 'طالب قديم')}
              </button>
            </div>

            {selectedClassMeta.supportsHifz && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => recalculateSchedule({ section: 'General' })}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                    section === 'General'
                      ? 'bg-[#005a6e] text-white shadow'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {tr('জেনারেল বিভাগ', 'General Section', 'القسم العام')}
                </button>
                <button
                  type="button"
                  onClick={() => recalculateSchedule({ section: 'Hifz' })}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                    section === 'Hifz'
                      ? 'bg-[#005a6e] text-white shadow'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {tr('হিফজ বিভাগ (ল্যাব ফ্রি)', 'Hifz Section (No Lab)', 'قسم التحفيظ')}
                </button>
              </div>
            )}

            {selectedClassMeta.supportsStay && (
              <div className="grid grid-cols-3 gap-2">
                {(['non-residential', 'day-care', 'hostel'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => recalculateSchedule({ stayMode: mode })}
                    className={`rounded-xl px-2.5 py-2 text-xs font-bold transition ${
                      stayMode === mode
                        ? 'bg-[#c4962c] text-[#0a1738] shadow'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {mode === 'non-residential'
                      ? tr('অনাবাসিক', 'Non-Res', 'نهاري')
                      : mode === 'day-care'
                      ? tr('ডে-কেয়ার', 'Day-Care', 'رعاية نهارية')
                      : tr('হোস্টেল', 'Hostel', 'سكن داخلي')}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-1">
              {selectedClassMeta.supportsStay && stayMode !== 'non-residential' && (
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={firstTimeStay}
                    onChange={(e) => recalculateSchedule({ firstTimeStay: e.target.checked })}
                    className="h-4 w-4 rounded accent-[#005a6e]"
                  />
                  {tr('প্রথমবার হোস্টেল/ডে-কেয়ার (+৳১৮,৫০০)', 'First-time Stay (+৳18,500)', 'أول مرة سكن (+18,500)')}
                </label>
              )}
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={transport}
                  onChange={(e) => recalculateSchedule({ transport: e.target.checked })}
                  className="h-4 w-4 rounded accent-[#005a6e]"
                />
                {tr('মাইক্রোবাস পরিবহন', 'Transport (Microbus)', 'المواصلات')}
              </label>
              {transport && (
                <input
                  type="number"
                  min={3000}
                  max={10000}
                  step={500}
                  value={transportAmount}
                  onChange={(e) =>
                    recalculateSchedule({ transportAmount: Number(e.target.value) || 5000 })
                  }
                  className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800"
                />
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                {tr('অধ্যক্ষের বিশেষ নোট / বৃত্তির কারণ', 'Principal Waiver / General Note', 'ملاحظة المدير')}
              </label>
              <input
                type="text"
                value={generalNote}
                onChange={(e) => setGeneralNote(e.target.value)}
                placeholder={tr('যেমন: হাফেজ ভ্রাতা ১০% ছাড় / মেধাবৃত্তি', 'e.g., Sibling concession / Hifz merit waiver', 'مثال: خصم الأخوة')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Summary Box */}
          <div className="rounded-xl border border-[#005a6e]/20 bg-[#005a6e]/5 p-4 dark:bg-slate-800/70">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
              <span>{tr('পার্ট A (এককালীন ভর্তি ফি)', 'Part A (One-Time Fees)', 'الجزء أ (رسوم القبول)')}</span>
              <span className="font-bold">৳{totals.subtotalA.toLocaleString('en-IN')}</span>
            </div>
            <div className="mt-1 flex justify-between text-xs text-slate-600 dark:text-slate-300">
              <span>{tr('পার্ট B (১ম মাসের ফি)', 'Part B (First Month Fees)', 'الجزء ب (رسوم الشهر الأول)')}</span>
              <span className="font-bold">৳{totals.subtotalB.toLocaleString('en-IN')}</span>
            </div>
            {totals.totalDiscount > 0 && (
              <div className="mt-1 flex justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span>{tr('মোট বিশেষ ছাড় (Waiver)', 'Total Waiver / Discount', 'إجمالي الخصم')}</span>
                <span>-৳{totals.totalDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="mt-2.5 flex justify-between border-t border-slate-200 pt-2.5 text-base font-extrabold text-[#192f64] dark:border-slate-700 dark:text-[#f0c95e]">
              <span>{tr('সর্বমোট প্রদেয় (A + B)', 'Grand Total Payable', 'الإجمالي المستحق')}</span>
              <span>৳{totals.grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleIssueToken(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#192f64] px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-[#0a1738]"
            >
              <Printer className="h-4 w-4 text-[#f0c95e]" />
              {tr('টোকেন ইস্যু ও A4 PDF প্রিন্ট', 'Issue Token & Download PDF', 'إصدار وتحميل PDF')}
            </button>
            <button
              type="button"
              onClick={() => handleIssueToken(false)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#005a6e] px-3.5 py-2.5 text-xs font-bold text-[#005a6e] hover:bg-[#005a6e]/10 dark:text-teal-300"
            >
              <Plus className="h-4 w-4" />
              {tr('শুধু সংরক্ষণ', 'Save Only', 'حفظ فقط')}
            </button>
          </div>
        </div>

        {/* Right: Exact 10-Row Editable Token Sheet */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-7">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-base font-bold text-[#192f64] dark:text-white">
              <FileText className="h-4 w-4 text-[#c4962c]" />
              {tr(
                '২. ১০-ধাপের অফিশিয়াল ফি শীট (প্রদেয় ও মন্তব্য এডিটযোগ্য)',
                '2. 10-Line Official 2027 Fee Sheet (Editable Payable & Comment)',
                '٢. جدول الرسوم الرسمي المكون من 10 بنود'
              )}
            </h3>
            <button
              type="button"
              onClick={() => recalculateSchedule({})}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {tr('রিসেট ফি', 'Reset Fixed', 'إعادة ضبط')}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#192f64] text-white">
                  <th className="rounded-tl-lg px-2.5 py-2 font-semibold">#</th>
                  <th className="px-2.5 py-2 font-semibold">
                    {tr('ফি বিবরণ (Description)', 'Fee Item Description', 'البند')}
                  </th>
                  <th className="px-2.5 py-2 text-right font-semibold">
                    {tr('নির্ধারিত', 'Fixed (৳)', 'الثابت')}
                  </th>
                  <th className="px-2.5 py-2 text-right font-semibold">
                    {tr('প্রদেয় (এডিট)', 'Payable (৳)', 'المستحق')}
                  </th>
                  <th className="rounded-tr-lg px-2.5 py-2 font-semibold">
                    {tr('মন্তব্য / ছাড়', 'Comment', 'ملاحظة')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(['A', 'B'] as const).map((part) => (
                  <React.Fragment key={part}>
                    <tr className="bg-slate-100/90 dark:bg-slate-800/80">
                      <td
                        colSpan={5}
                        className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#005a6e] dark:text-teal-300"
                      >
                        {part === 'A'
                          ? tr(
                              'পার্ট A: এককালীন ভর্তি ফি (ক্রমিক ১–৬)',
                              'PART A: ONE-TIME ADMISSION FEES (Items 1–6)',
                              'الجزء أ: رسوم القبول لمرة واحدة'
                            )
                          : tr(
                              'পার্ট B: প্রথম মাসের ফি (ক্রমিক ৭–১০)',
                              "PART B: FIRST MONTH'S FEES (Items 7–10)",
                              'الجزء ب: رسوم الشهر الأول'
                            )}
                      </td>
                    </tr>
                    {lineItems
                      .filter((r) => r.part === part)
                      .map((row) => (
                        <tr key={row.no} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-2.5 py-2 font-bold text-slate-500">{row.no}</td>
                          <td className="px-2.5 py-2 font-medium text-slate-800 dark:text-slate-200">
                            {language === 'bn' ? row.labelBn : row.labelEn}
                          </td>
                          <td className="px-2.5 py-2 text-right font-mono text-slate-500">
                            {row.fixedAmount > 0 ? row.fixedAmount.toLocaleString('en-IN') : '—'}
                          </td>
                          <td className="px-2.5 py-1.5 text-right">
                            <input
                              type="number"
                              min={0}
                              value={row.payableAmount}
                              onChange={(e) =>
                                handleRowChange(row.no, 'payableAmount', e.target.value)
                              }
                              className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right font-mono font-bold text-[#192f64] outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-[#f0c95e]"
                            />
                          </td>
                          <td className="px-2.5 py-1.5">
                            <input
                              type="text"
                              value={row.comment}
                              onChange={(e) => handleRowChange(row.no, 'comment', e.target.value)}
                              placeholder="Waiver / note..."
                              className="w-full min-w-[110px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            />
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Issued Tokens Registry */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-base font-bold text-[#192f64] dark:text-white">
          {tr('ইস্যুকৃত ২০২৭ এডমিশন টোকেন তালিকা', 'Issued 2027 Admission Tokens Registry', 'سجل رموز القبول الصادرة 2027')}
        </h3>
        {tokens.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            {tr('এখনো কোনো টোকেন ইস্যু করা হয়নি।', 'No admission tokens issued yet.', 'لا توجد رموز صادرة بعد.')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="py-2.5 pr-3">Token Code</th>
                  <th className="py-2.5 pr-3">Student & Class</th>
                  <th className="py-2.5 pr-3">Guardian Contact (Auto-Apply)</th>
                  <th className="py-2.5 pr-3 text-right">Total Payable</th>
                  <th className="py-2.5 pr-3">Status</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tokens.map((tok) => (
                  <tr key={tok.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 pr-3 font-mono font-bold text-[#192f64] dark:text-[#f0c95e]">
                      <div className="flex items-center gap-1.5">
                        {tok.tokenCode}
                        <button
                          type="button"
                          onClick={() => handleCopyCode(tok.tokenCode)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                          title="Copy Token Code"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {tok.studentName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {tok.classNameLabel} · {tok.section} · {tok.stayMode}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {tok.guardianPhone}
                      </div>
                      {tok.guardianEmail && (
                        <div className="text-[11px] text-slate-500">{tok.guardianEmail}</div>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-right">
                      <div className="font-bold text-[#192f64] dark:text-white">
                        ৳{tok.grandTotal.toLocaleString('en-IN')}
                      </div>
                      {(tok.totalDiscount ?? 0) > 0 && (
                        <div className="text-[11px] font-semibold text-emerald-600">
                          Saved ৳{(tok.totalDiscount ?? 0).toLocaleString('en-IN')}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(tok)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          tok.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : tok.status === 'Applied'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {tok.status}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => generateAdmissionToken2027Pdf(tok, state.users)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#005a6e] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#004555]"
                        >
                          <Download className="h-3.5 w-3.5" />
                          A4 PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAdmissionToken(tok.id)}
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                          title="Delete Token"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
