import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronDown,
  FileText,
  Gift,
  GraduationCap,
  Headphones,
  Layers,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Quote,
  Send,
  ShieldCheck,
  Sparkles,
  Ticket,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import {
  AdmissionTokenMatch,
  MIN_TOKEN_MATCH_PHONE_DIGITS,
  applyAdmissionToken,
  countDigits,
  matchAdmissionToken,
} from '../lib/api/admission-token';
import {
  filterHomeFaqByCategory,
  GENERAL_CLASS_OPTIONS,
  HOME_FAQ_CATEGORIES,
  HOME_FAQ_ITEMS,
  HomeFaqCategoryId,
  TAHFIZ_CLASS_OPTIONS,
  validateQuickHomeRegistration,
} from '../utils/homeConversionLogic';

const TOKEN_MATCH_DEBOUNCE_MS = 400;

interface HomeRegistrationSplitSectionProps {
  onOpenFullAdmission: () => void;
}

export const HomeRegistrationSplitSection: React.FC<HomeRegistrationSplitSectionProps> = ({
  onOpenFullAdmission,
}) => {
  const { language, submitInquiry, state } = useCMS();
  const [studentName, setStudentName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [mobile, setMobile] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [sameAsMobile, setSameAsMobile] = useState(true);
  const [department, setDepartment] = useState<'General' | 'Tahfiz'>('General');
  const [targetClass, setTargetClass] = useState('');
  const [accommodation, setAccommodation] = useState<'Non-Residential' | 'Residential' | 'Day-Care'>(
    'Residential'
  );
  const [address, setAddress] = useState('');
  const [formError, setFormError] = useState('');
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const [tokenMatch, setTokenMatch] = useState<AdmissionTokenMatch | null>(null);

  // The guardian's own 2027 token is looked up on the server once the mobile number is complete.
  useEffect(() => {
    if (countDigits(mobile) < MIN_TOKEN_MATCH_PHONE_DIGITS) {
      setTokenMatch(null);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void matchAdmissionToken(
        { phone: mobile.trim(), email: guardianEmail.trim() || undefined },
        controller.signal
      ).then((res) => {
        if (!controller.signal.aborted) setTokenMatch(res.ok ? res.data.match : null);
      });
    }, TOKEN_MATCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [mobile, guardianEmail]);

  const matchedToken = tokenMatch
    ? {
        id: tokenMatch.id,
        tokenCode: tokenMatch.tokenCode,
        studentName: tokenMatch.studentName,
        classNameLabel: tokenMatch.classNameLabel,
        ...tokenMatch.totals,
      }
    : null;

  const classOptions =
    department === 'General' ? GENERAL_CLASS_OPTIONS[language] : TAHFIZ_CLASS_OPTIONS[language];

  const copy = {
    bn: {
      scarcity: 'আর মাত্র কিছু সংখ্যক সিট বাকি',
      headlineTop: 'প্রি-প্লে থেকে ৯ম শ্রেণি এবং',
      headlineAccent: 'নূরানী, নাজেরা, হিফজ বিভাগে ভর্তি চলছে।',
      offerTitle: 'প্রত্যেক শ্রেণির প্রথম ৫ জনের জন্য বিশেষ ছাড়!',
      offerSub: 'আবাসিক, অনাবাসিক ও ডে-কেয়ার — সীমিত আসন',
      hotlineLabel: 'সরাসরি কথা বলতে ফোন করুন:',
      campusGirls: 'প্রধান অফিস ও গার্লস ক্যাম্পাস: বাড়ি-৭, রোড-১৭/এ, সেক্টর-১২, উত্তরা, ঢাকা-১২৩০',
      campusBoys: 'বয়েজ ক্যাম্পাস: বাড়ি-১১, রোড-১৯, সেক্টর-১২, উত্তরা, ঢাকা-১২৩০',
      fullFormBtn: 'পূর্ণাঙ্গ ভর্তি ফরম পূরণ করুন',
      formTitle: 'এখনই রেজিস্ট্রেশন করুন',
      formSub: 'তথ্যগুলো দিয়ে মাত্র ১ মিনিটে আবেদন সম্পন্ন করুন',
      studentName: 'শিক্ষার্থীর নাম *',
      studentPh: 'শিক্ষার্থীর পূর্ণ নাম লিখুন',
      guardianName: 'পিতা / অভিভাবকের নাম *',
      guardianPh: 'পিতা বা অভিভাবকের নাম',
      mobile: 'মোবাইল নম্বর *',
      mobilePh: '01XXXXXXXXX',
      whatsapp: 'হোয়াটসঅ্যাপ নম্বর',
      sameAsMobile: 'মোবাইল নম্বরের মতই',
      deptLabel: 'বিভাগ',
      deptGeneral: 'মাহারাত জেনারেল সেকশন (আরবি ও ইংলিশ ভার্সন)',
      deptTahfiz: 'মাহারাত তাহফিজুল কুরআন (+৪টি মৌলিক বিষয়)',
      classLabel: 'শ্রেণি *',
      classPlaceholder: 'নির্বাচন করুন',
      accLabel: 'আবাসিক / অনাবাসিক / ডে-কেয়ার',
      accRes: 'আবাসিক',
      accNonRes: 'অনাবাসিক',
      accDayCare: 'ডে-কেয়ার',
      addressLabel: 'ঠিকানা',
      addressPh: 'গ্রাম/মহল্লা, থানা, জেলা',
      submitBtn: 'এখনই ভর্তি আবেদন সম্পন্ন করুন',
      privacyNote: 'আপনার তথ্যের শতভাগ গোপনীয়তা রক্ষা করা হবে।',
      successTitle: 'রেজিস্ট্রেশন সফলভাবে গৃহীত হয়েছে!',
      successSub:
        'আপনার আবেদনটি মাহারাত মডেল মাদ্রাসার ভর্তি ডেস্কে সংরক্ষিত হয়েছে। শীঘ্রই আমাদের প্রতিনিধি আপনার মোবাইল/হোয়াটসঅ্যাপে যোগাযোগ করবেন।',
      newRegBtn: 'আরেকজন শিক্ষার্থীর রেজিস্ট্রেশন করুন',
    },
    en: {
      scarcity: 'Limited Seats Remaining',
      headlineTop: 'Pre-Play to Class 9 &',
      headlineAccent: 'Noorani, Nazera, Hifz Admissions Open.',
      offerTitle: 'Special Discount for First 5 Students per Class!',
      offerSub: 'Residential, Non-Residential & Day-Care — Apply Early',
      hotlineLabel: 'Call Admission Helpline Directly:',
      campusGirls: 'Main Office & Girls Campus: House-7, Road-17/A, Sector-12, Uttara, Dhaka-1230',
      campusBoys: 'Boys Campus: House-11, Road-19, Sector-12, Uttara, Dhaka-1230',
      fullFormBtn: 'Open Full Admission Form',
      formTitle: 'Register Now',
      formSub: 'Complete your admission registration in just 1 minute',
      studentName: 'Student Name *',
      studentPh: 'Enter student full name',
      guardianName: 'Father / Guardian Name *',
      guardianPh: 'Father or guardian name',
      mobile: 'Mobile Number *',
      mobilePh: '01XXXXXXXXX',
      whatsapp: 'WhatsApp Number',
      sameAsMobile: 'Same as mobile',
      deptLabel: 'Department',
      deptGeneral: 'Maharat General Section (Arabic & English Version)',
      deptTahfiz: 'Maharat Tahfizul Quran (+4 Core Subjects)',
      classLabel: 'Class *',
      classPlaceholder: 'Select class',
      accLabel: 'Accommodation Type',
      accRes: 'Residential',
      accNonRes: 'Non-Residential',
      accDayCare: 'Day-Care',
      addressLabel: 'Address',
      addressPh: 'Area, Thana, District',
      submitBtn: 'Complete Admission Application',
      privacyNote: '100% confidentiality of your information is guaranteed.',
      successTitle: 'Registration Received Successfully!',
      successSub:
        'Your inquiry has been logged with our admission desk. A coordinator will contact you shortly via phone or WhatsApp.',
      newRegBtn: 'Register Another Student',
    },
    ar: {
      scarcity: 'مقاعد محدودة متبقية',
      headlineTop: 'القبول مفتوح من التمهيدي إلى الصف التاسع',
      headlineAccent: 'وقسم النورانية والناظرة وتحفيظ القرآن.',
      offerTitle: 'خصم خاص لأول ٥ طلاب في كل صف!',
      offerSub: 'سكن داخلي، غير مقيم، ورعاية نهارية',
      hotlineLabel: 'للتواصل المباشر مع مكتب القبول:',
      campusGirls: 'المكتب الرئيسي وحرم البنات: منزل ٧، طريق ١٧/أ، قطاع ١٢، أوتارا',
      campusBoys: 'حرم البنين: منزل ١١، طريق ١٩، قطاع ١٢، أوتارا',
      fullFormBtn: 'افتح استمارة القبول الكاملة',
      formTitle: 'سجّل الآن',
      formSub: 'أكمل طلب التسجيل خلال دقيقة واحدة فقط',
      studentName: 'اسم الطالب *',
      studentPh: 'أدخل اسم الطالب الكامل',
      guardianName: 'اسم الأب / ولي الأمر *',
      guardianPh: 'اسم ولي الأمر',
      mobile: 'رقم الهاتف *',
      mobilePh: '01XXXXXXXXX',
      whatsapp: 'رقم الواتساب',
      sameAsMobile: 'نفس رقم الهاتف',
      deptLabel: 'القسم',
      deptGeneral: 'القسم العام (النسخة العربية والإنجليزية)',
      deptTahfiz: 'قسم تحفيظ القرآن الكريم (+٤ مواد أساسية)',
      classLabel: 'الصف *',
      classPlaceholder: 'اختر الصف',
      accLabel: 'نظام الإقامة',
      accRes: 'سكن داخلي',
      accNonRes: 'غير مقيم',
      accDayCare: 'رعاية نهارية',
      addressLabel: 'العنوان',
      addressPh: 'المنطقة، الحي، المدينة',
      submitBtn: 'إتمام طلب التسجيل الآن',
      privacyNote: 'نضمن سرية بياناتكم بنسبة ١٠٠٪.',
      successTitle: 'تم استلام طلب التسجيل بنجاح!',
      successSub: 'سيتواصل معك مسؤول القبول قريباً عبر الهاتف أو الواتساب.',
      newRegBtn: 'تسجيل طالب آخر',
    },
  }[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateQuickHomeRegistration(
      {
        studentName,
        guardianName,
        mobile,
        whatsapp,
        sameAsMobile,
        department,
        targetClass,
        accommodation,
        address,
      },
      language
    );

    if (!validation.valid) {
      setFormError(validation.error || '');
      return;
    }

    setFormError('');
    const matchedCourse =
      state.courses.find((c) =>
        department === 'Tahfiz' ? c.category === 'Hifzul Quran' : c.category === 'Academic'
      ) || state.courses[0];

    const summaryNote = [
      `[1-Min Home Registration]`,
      `Student: ${studentName.trim()}`,
      `Guardian: ${guardianName.trim()}`,
      `Department: ${department}`,
      `Target Class: ${targetClass}`,
      `Accommodation: ${accommodation}`,
      `WhatsApp: ${validation.resolvedWhatsapp || mobile.trim()}`,
      matchedToken
        ? `Auto-Applied 2027 Token: ${matchedToken.tokenCode} (Payable ৳${matchedToken.grandTotal.toLocaleString('en-IN')}, Waiver ৳${(matchedToken.totalDiscount ?? 0).toLocaleString('en-IN')})`
        : '',
      address.trim() ? `Address: ${address.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    submitInquiry({
      name: `${studentName.trim()} (অভিভাবক: ${guardianName.trim()})`,
      phone: mobile.trim(),
      email: guardianEmail.trim() || 'online-registration@maharatmadrasah.com',
      courseId: matchedCourse?.id || 'course-general-1',
      message: summaryNote,
      source: 'Registration Form',
      guardianName: guardianName.trim(),
      preferredDepartment: department,
      targetClass,
      preferredAccommodation: accommodation,
    });

    if (matchedToken) {
      void applyAdmissionToken(matchedToken.id, mobile.trim());
    }

    const refId = matchedToken
      ? `${matchedToken.tokenCode}`
      : `MMM-${String(Math.floor(100000 + Math.random() * 900000))}`;
    setSubmittedRef(refId);
  };

  const resetForm = () => {
    setStudentName('');
    setGuardianName('');
    setMobile('');
    setWhatsapp('');
    setSameAsMobile(true);
    setTargetClass('');
    setAddress('');
    setSubmittedRef(null);
    setFormError('');
  };

  return (
    <section
      id="quick-registration"
      className="py-10 sm:py-14 bg-gradient-to-br from-[#071129] via-[#132654] to-[#003e4d] relative overflow-hidden"
    >
      {/* Subtle Maharat Navy-Teal-Gold grid & glow */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(229,185,76,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(14,165,183,0.35) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }}
      />
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#0ea5b7]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#c4962c]/15 blur-3xl pointer-events-none" />

      <div className="cii-container-section max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl overflow-hidden shadow-[0_24px_70px_-20px_rgba(7,17,41,0.65)] border border-[#e5b94c]/25 grid lg:grid-cols-12 bg-white dark:bg-slate-900"
        >
          {/* Left Panel: Official Maharat Royal Navy-Teal Executive Info Panel */}
          <div className="lg:col-span-4 bg-gradient-to-b from-[#071129] via-[#132654] to-[#003e4d] text-white p-5 sm:p-6 flex flex-col justify-between gap-5 relative">
            <div className="space-y-6">
              {/* Scarcity Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e5b94c]/15 border border-[#e5b94c]/40 text-[#f7dc84] text-xs sm:text-sm font-bold">
                <Zap className="w-3.5 h-3.5 text-[#f0c95e] shrink-0" />
                <span>{copy.scarcity}</span>
              </div>

              {/* Bold Headline with Official Maharat Gold-Teal Accent */}
              <h2 className="text-2xl sm:text-[29px] font-extrabold leading-[1.3] tracking-tight">
                <span className="block text-white">{copy.headlineTop}</span>
                <span className="block mt-1 bg-gradient-to-r from-[#f0c95e] via-[#fde68a] to-[#5eead4] bg-clip-text text-transparent">
                  {copy.headlineAccent}
                </span>
              </h2>

              {/* Dashed Special Discount Box */}
              <div className="rounded-2xl border border-dashed border-[#e5b94c]/60 bg-[#071129]/45 p-4 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#d4a843] to-[#9c7a32] flex items-center justify-center shrink-0 shadow-lg shadow-[#9c7a32]/30">
                  <Gift className="w-5 h-5 text-[#071129]" />
                </div>
                <div>
                  <p className="text-sm sm:text-[15px] font-extrabold text-white leading-snug">
                    {copy.offerTitle}
                  </p>
                  <p className="text-xs text-teal-100/85 mt-0.5">{copy.offerSub}</p>
                </div>
              </div>
            </div>

            {/* Bottom Hotlines & Dual Uttara Campus Info */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-teal-100/80 flex items-center gap-2">
                  <Headphones className="w-3.5 h-3.5 text-[#5eead4]" />
                  <span>{copy.hotlineLabel}</span>
                </p>
                <div className="space-y-1.5">
                  <a
                    href="tel:01886340308"
                    className="flex items-center gap-2.5 text-lg sm:text-xl font-extrabold text-[#f0c95e] hover:text-amber-200 transition-colors tabular-nums"
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>01886-340308</span>
                  </a>
                  <a
                    href="tel:01901631641"
                    className="flex items-center gap-2.5 text-lg sm:text-xl font-extrabold text-[#f0c95e] hover:text-amber-200 transition-colors tabular-nums"
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>01901-631641</span>
                  </a>
                </div>
              </div>

              <div className="space-y-2 text-xs sm:text-[13px] text-slate-200/90 leading-relaxed">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#5eead4] shrink-0 mt-0.5" />
                  <span>{copy.campusGirls}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#f0c95e] shrink-0 mt-0.5" />
                  <span>{copy.campusBoys}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenFullAdmission}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-[#e5b94c]/30 text-white text-xs sm:text-sm font-bold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#f0c95e]" />
                <span>{copy.fullFormBtn}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Panel: Crisp Compact 1-Minute Registration Card */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 sm:p-6 lg:p-7">
            {submittedRef ? (
              <div className="py-10 text-center space-y-3" data-testid="home-reg-success">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {copy.successTitle}
                </h3>
                <p className="text-xs font-mono font-bold text-[#005a6e] dark:text-[#f0c95e]">
                  REF: {submittedRef}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                  {copy.successSub}
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-2 rounded-full bg-gradient-to-r from-[#192f64] to-[#005a6e] hover:opacity-95 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    {copy.newRegBtn}
                  </button>
                  <button
                    type="button"
                    onClick={onOpenFullAdmission}
                    className="px-5 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    {copy.fullFormBtn}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                <div className="pb-2.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-[#0a1738] dark:text-white tracking-tight">
                      {copy.formTitle}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      {copy.formSub}
                    </p>
                  </div>
                </div>

                {/* Auto-Applied 2027 Admission Token Live Banner */}
                {matchedToken && (
                  <div
                    data-testid="auto-applied-token-banner"
                    className="rounded-xl border border-emerald-300 bg-emerald-50/90 dark:border-emerald-700 dark:bg-emerald-950/40 p-3 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-emerald-700 dark:text-emerald-300 shrink-0" />
                      <div className="text-xs">
                        <div className="font-extrabold text-emerald-900 dark:text-emerald-200">
                          {language === 'bn'
                            ? `২০২৭ এডমিশন টোকেন (${matchedToken.tokenCode}) অটো-অ্যাপ্লাই হয়েছে!`
                            : `2027 Admission Token (${matchedToken.tokenCode}) Auto-Applied!`}
                        </div>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                          {matchedToken.studentName} · {matchedToken.classNameLabel} · Part A ৳
                          {matchedToken.subtotalA.toLocaleString('en-IN')} + Part B ৳
                          {matchedToken.subtotalB.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-[#192f64] dark:text-[#f0c95e]">
                        ৳{matchedToken.grandTotal.toLocaleString('en-IN')}
                      </div>
                      {(matchedToken.totalDiscount ?? 0) > 0 && (
                        <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                          Waiver -৳{(matchedToken.totalDiscount ?? 0).toLocaleString('en-IN')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Row 1: Student Name & Guardian Name */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label
                      htmlFor="home-reg-student"
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      <User className="w-3.5 h-3.5 text-[#005a6e] dark:text-[#5eead4]" />
                      <span>{copy.studentName}</span>
                    </label>
                    <input
                      id="home-reg-student"
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder={copy.studentPh}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005a6e]/35 focus:border-[#005a6e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="home-reg-guardian"
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      <Users className="w-3.5 h-3.5 text-[#005a6e] dark:text-[#5eead4]" />
                      <span>{copy.guardianName}</span>
                    </label>
                    <input
                      id="home-reg-guardian"
                      type="text"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      placeholder={copy.guardianPh}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005a6e]/35 focus:border-[#005a6e]"
                    />
                  </div>
                </div>

                {/* Row 2: Mobile, Email (for Token Auto-Apply) & WhatsApp */}
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label
                      htmlFor="home-reg-mobile"
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#005a6e] dark:text-[#5eead4]" />
                      <span>{copy.mobile}</span>
                    </label>
                    <input
                      id="home-reg-mobile"
                      type="tel"
                      value={mobile}
                      onChange={(e) => {
                        setMobile(e.target.value);
                        if (sameAsMobile) setWhatsapp(e.target.value);
                      }}
                      placeholder={copy.mobilePh}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005a6e]/35 focus:border-[#005a6e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="home-reg-email"
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#005a6e] dark:text-[#5eead4]" />
                      <span>{language === 'bn' ? 'ইমেইল (টোকেন)' : 'Email (Token)'}</span>
                    </label>
                    <input
                      id="home-reg-email"
                      type="email"
                      value={guardianEmail}
                      onChange={(e) => setGuardianEmail(e.target.value)}
                      placeholder="guardian@email.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005a6e]/35 focus:border-[#005a6e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <label
                        htmlFor="home-reg-whatsapp"
                        className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#005a6e] dark:text-[#5eead4]" />
                        <span>{copy.whatsapp}</span>
                      </label>
                      <label className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#005a6e] dark:text-[#f0c95e] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={sameAsMobile}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSameAsMobile(checked);
                            if (checked) setWhatsapp(mobile);
                          }}
                          className="rounded border-slate-300 text-[#005a6e]"
                        />
                        <span>Same</span>
                      </label>
                    </div>
                    <input
                      id="home-reg-whatsapp"
                      type="tel"
                      value={sameAsMobile ? mobile : whatsapp}
                      disabled={sameAsMobile}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder={copy.mobilePh}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 disabled:opacity-65 focus:outline-none focus:ring-2 focus:ring-[#005a6e]/35 focus:border-[#005a6e]"
                    />
                  </div>
                </div>

                {/* Row 3: Department & Class Dropdowns */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="home-reg-dept"
                      className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200"
                    >
                      <Layers className="w-4 h-4 text-[#005a6e] dark:text-[#5eead4]" />
                      <span>{copy.deptLabel}</span>
                    </label>
                    <select
                      id="home-reg-dept"
                      value={department}
                      onChange={(e) => {
                        setDepartment(e.target.value as 'General' | 'Tahfiz');
                        setTargetClass('');
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-base text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005a6e]/35 focus:border-[#005a6e] transition-colors"
                    >
                      <option value="General">{copy.deptGeneral}</option>
                      <option value="Tahfiz">{copy.deptTahfiz}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="home-reg-class"
                      className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200"
                    >
                      <GraduationCap className="w-4 h-4 text-[#005a6e] dark:text-[#5eead4]" />
                      <span>{copy.classLabel}</span>
                    </label>
                    <select
                      id="home-reg-class"
                      value={targetClass}
                      onChange={(e) => setTargetClass(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-base text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005a6e]/35 focus:border-[#005a6e] transition-colors"
                    >
                      <option value="">{copy.classPlaceholder}</option>
                      {classOptions.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 4: Accommodation Mode Buttons */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
                    <Building2 className="w-4 h-4 text-[#005a6e] dark:text-[#5eead4]" />
                    <span>{copy.accLabel}</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(
                      [
                        { id: 'Residential', label: copy.accRes },
                        { id: 'Non-Residential', label: copy.accNonRes },
                        { id: 'Day-Care', label: copy.accDayCare },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAccommodation(opt.id)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                          accommodation === opt.id
                            ? 'bg-[#005a6e]/10 dark:bg-[#005a6e]/35 border-[#005a6e] text-[#0a1738] dark:text-[#f0c95e] shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#007c91]/50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 5: Address Textarea */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="home-reg-address"
                    className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    <MapPin className="w-4 h-4 text-[#005a6e] dark:text-[#5eead4]" />
                    <span>{copy.addressLabel}</span>
                  </label>
                  <textarea
                    id="home-reg-address"
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={copy.addressPh}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005a6e]/35 focus:border-[#005a6e] transition-colors resize-none"
                  />
                </div>

                {formError && (
                  <p
                    role="alert"
                    className="text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl px-4 py-2.5"
                  >
                    {formError}
                  </p>
                )}

                {/* Full-width Official Maharat Navy-Teal-Gold Submit CTA */}
                <button
                  type="submit"
                  data-testid="home-reg-submit"
                  className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-[#192f64] via-[#005a6e] to-[#007c91] hover:from-[#132654] hover:to-[#006a80] text-white font-extrabold text-base sm:text-lg shadow-xl shadow-[#192f64]/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-[#e5b94c]/35"
                >
                  <Send className="w-4 h-4 text-[#f0c95e]" />
                  <span>{copy.submitBtn}</span>
                </button>

                <p className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{copy.privacyNote}</span>
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

interface HomeContextAndPrincipalSectionProps {
  onNavigateToContext: () => void;
}

export const HomeContextAndPrincipalSection: React.FC<HomeContextAndPrincipalSectionProps> = ({
  onNavigateToContext,
}) => {
  const { state, language } = useCMS();
  const ctx = state.madrasahContextConfig;
  const [expandedPrincipal, setExpandedPrincipal] = useState(false);

  if (!ctx?.enabled) return null;

  const principalMsg = ctx.principalMessageBn || '';
  const isLongPrincipal = principalMsg.length > 340;
  const shownPrincipalMsg =
    expandedPrincipal || !isLongPrincipal ? principalMsg : `${principalMsg.slice(0, 340).trim()}...`;

  return (
    <section
      id="home-context-principal"
      className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-slate-950 border-t border-slate-200/70 dark:border-slate-800/80"
    >
      <div className="cii-container-section space-y-12">
        {/* Top Header + Madrasah Context Card */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-5 space-y-4">
            <p className="text-xs sm:text-sm font-bold text-[#005a6e] dark:text-[#f0c95e] flex items-center gap-2">
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>
                {language === 'en'
                  ? 'INSTITUTIONAL CONTEXT & LEADERSHIP'
                  : language === 'ar'
                    ? 'خلفية التأسيس وكلمة القيادة'
                    : 'মাদ্রাসা প্রতিষ্ঠার প্রেক্ষাপট ও নেতৃত্বের বাণী'}
              </span>
            </p>
            <h2 className="cii-section-title font-extrabold text-[#192f64] dark:text-white tracking-tight">
              {language === 'en'
                ? 'Why Maharat Model Madrasah?'
                : language === 'ar'
                  ? 'رؤية وتأسيس مدرسة المهارات النموذجية'
                  : ctx.headingBn}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {ctx.paragraphsBn[0]}
            </p>
            {ctx.paragraphsBn[1] && (
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {ctx.paragraphsBn[1]}
              </p>
            )}
            <div className="pt-2">
              <button
                type="button"
                onClick={onNavigateToContext}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#192f64] via-[#005a6e] to-[#007c91] hover:opacity-95 text-white text-sm font-bold shadow-md transition-all cursor-pointer"
              >
                <span>
                  {language === 'en'
                    ? 'Read Full Institutional Profile & Uniform Guide'
                    : language === 'ar'
                      ? 'اقرأ الملف التعريفي الكامل ودليل الزي'
                      : 'পূর্ণাঙ্গ প্রেক্ষাপট, লক্ষ্য ও ইউনিফর্ম গাইড দেখুন'}
                </span>
                <ArrowRight className="w-4 h-4 text-[#f0c95e]" />
              </button>
            </div>
          </div>

          {/* Right: Chairman FIRST (Larger Portrait + 3D Perspective Hover) -> Principal BELOW */}
          <div className="lg:col-span-7 grid md:grid-cols-2 gap-6 leadership-3d-stage">
            {/* 1. Chairman's Message Card (TOP PRIMARY SPOTLIGHT — প্রতিষ্ঠানের চেয়ারম্যান সবার আগে) */}
            <article className="leadership-3d-card md:col-span-2 rounded-3xl bg-gradient-to-br from-[#0a1738] via-[#192f64] to-[#005a6e] text-white p-6 sm:p-8 shadow-xl border border-[#c4962c]/45 relative overflow-hidden">
              <Quote className="w-16 h-16 text-[#f0c95e]/15 absolute top-5 right-6 pointer-events-none" />
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-5 relative z-10">
                <div className="leadership-3d-portrait relative shrink-0">
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-[#c4962c] via-[#f0c95e] to-[#007c91] opacity-70 blur-xs" />
                  <img
                    src={ctx.chairmanImageUrl || '/assets/maharat/chairman-dr-nurullah.jpg'}
                    alt={ctx.chairmanNameBn}
                    className="relative w-28 h-32 sm:w-36 sm:h-40 rounded-2xl object-cover border-2 border-[#f0c95e] shadow-2xl"
                  />
                </div>
                <div>
                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-md bg-[#f0c95e]/20 text-[#f0c95e] border border-[#f0c95e]/35 mb-2">
                    {language === 'en'
                      ? "Chairman's Message"
                      : language === 'ar'
                        ? 'كلمة رئيس مجلس الإدارة'
                        : 'চেয়ারম্যানের বাণী'}
                  </span>
                  <h3 className="text-lg sm:text-2xl font-extrabold text-white leading-snug">
                    {ctx.chairmanNameBn}
                  </h3>
                </div>
              </div>
              <p className="text-sm sm:text-[15.5px] text-sky-100/95 leading-[1.85] relative z-10">
                {ctx.chairmanMessageBn}
              </p>
            </article>

            {/* 2. Principal's Message Card (BELOW CHAIRMAN — Larger Portrait + 3D Perspective Hover) */}
            <article className="leadership-3d-card md:col-span-2 rounded-3xl bg-[#f4f8fb] dark:bg-[#0d1936] border border-[#192f64]/20 dark:border-[#007c91]/35 p-6 sm:p-7 flex flex-col sm:flex-row gap-5 items-start shadow-md">
              <div className="leadership-3d-portrait relative shrink-0">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-[#192f64] to-[#007c91] opacity-35 blur-xs" />
                <img
                  src={ctx.principalImageUrl || '/assets/maharat/principal-munkadir-sadi.jpg'}
                  alt={ctx.principalNameBn}
                  className="relative w-28 h-32 sm:w-36 sm:h-40 rounded-2xl object-cover border-2 border-[#005a6e]/60 dark:border-[#f0c95e]/60 shadow-xl"
                />
              </div>
              <div className="space-y-2 flex-1">
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-md bg-[#005a6e]/12 dark:bg-[#005a6e]/40 text-[#005a6e] dark:text-[#f0c95e]">
                  {language === 'en'
                    ? "Principal's Message"
                    : language === 'ar'
                      ? 'كلمة مدير المدرسة'
                      : 'অধ্যক্ষের বাণী (ভারপ্রাপ্ত)'}
                </span>
                <h3 className="text-base sm:text-xl font-extrabold text-[#192f64] dark:text-white leading-snug">
                  {ctx.principalNameBn}
                </h3>
                <p className="text-sm sm:text-[15px] text-slate-600 dark:text-slate-300 leading-[1.8]">
                  {shownPrincipalMsg}
                </p>
                {isLongPrincipal && (
                  <button
                    type="button"
                    onClick={() => setExpandedPrincipal((v) => !v)}
                    className="mt-1 text-xs sm:text-sm font-bold text-[#005a6e] dark:text-[#f0c95e] hover:underline underline-offset-4 cursor-pointer"
                  >
                    {expandedPrincipal
                      ? language === 'en'
                        ? 'Show less'
                        : 'সংক্ষিপ্ত করুন'
                      : language === 'en'
                        ? 'Read full message →'
                        : 'সম্পূর্ণ বাণী পড়ুন →'}
                  </button>
                )}
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
};

export const HomeCategorizedFaqSection: React.FC = () => {
  const { language } = useCMS();
  const [activeCategory, setActiveCategory] = useState<HomeFaqCategoryId>('admission');
  const [openFaqId, setOpenFaqId] = useState<string>('faq-adm-1');

  const visibleFaqs = filterHomeFaqByCategory(HOME_FAQ_ITEMS, activeCategory);

  const handleSelectCategory = (catId: HomeFaqCategoryId) => {
    setActiveCategory(catId);
    const nextList = filterHomeFaqByCategory(HOME_FAQ_ITEMS, catId);
    setOpenFaqId(nextList[0]?.id || '');
  };

  const copy = {
    bn: {
      eyebrow: 'সাধারণ জিজ্ঞাসা',
      title: 'অভিভাবকদের সচরাচর জিজ্ঞাসিত প্রশ্নাবলী',
      subtitle:
        'ভর্তি, কারিকুলাম, আবাসন, ফি কাঠামো ও পরিবহন সংক্রান্ত প্রয়োজনীয় সকল উত্তর এক নজরে।',
      moreTitle: 'আরও কোনো প্রশ্ন আছে?',
      moreSub: 'সরাসরি আমাদের ভর্তি টিমের সাথে হোয়াটসঅ্যাপে কথা বলুন',
      waBtn: 'হোয়াটসঅ্যাপে কথা বলুন',
    },
    en: {
      eyebrow: 'FREQUENTLY ASKED QUESTIONS',
      title: 'Answers to Common Parent Questions',
      subtitle:
        'Quick, clear answers covering admission, academic tracks, residential care, tuition fees, and school transport.',
      moreTitle: 'Still have a question?',
      moreSub: 'Chat directly with our admission team on WhatsApp',
      waBtn: 'Chat on WhatsApp',
    },
    ar: {
      eyebrow: 'الأسئلة الشائعة',
      title: 'إجابات على استفسارات أولياء الأمور',
      subtitle: 'إجابات واضحة حول القبول، المناهج، السكن الداخلي، الرسوم، والنقل المدرسي.',
      moreTitle: 'هل لديك استفسار آخر؟',
      moreSub: 'تواصل مباشرة مع فريق القبول عبر الواتساب',
      waBtn: 'تحدث عبر الواتساب',
    },
  }[language];

  return (
    <section
      id="home-faq"
      className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-slate-950 border-t border-slate-200/70 dark:border-slate-800/80"
    >
      <div className="cii-container-section max-w-4xl mx-auto">
        <div className="text-center space-y-3 mb-10">
          <p
            className={`text-xs sm:text-sm font-bold text-[#005a6e] dark:text-[#f0c95e] ${
              language === 'en' ? 'tracking-[0.16em] uppercase' : 'tracking-normal'
            }`}
          >
            {copy.eyebrow}
          </p>
          <h2 className="cii-section-title font-extrabold text-[#192f64] dark:text-white">
            {copy.title}
          </h2>
          <p className="text-base sm:text-[17px] text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {copy.subtitle}
          </p>
        </div>

        {/* 5 Clean Category Tabs */}
        <div
          role="tablist"
          aria-label="FAQ categories"
          className="flex flex-wrap items-center justify-center gap-2 mb-8"
        >
          {HOME_FAQ_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                data-testid={`faq-tab-${cat.id}`}
                onClick={() => handleSelectCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full text-sm sm:text-[15px] font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#192f64] to-[#005a6e] text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800'
                }`}
              >
                {cat.label[language]}
              </button>
            );
          })}
        </div>

        {/* Clean Accordion List */}
        <div className="divide-y divide-slate-200 dark:divide-slate-800 border-y border-slate-200 dark:border-slate-800">
          {visibleFaqs.map((item) => {
            const isOpen = openFaqId === item.id;
            return (
              <div key={item.id} className="py-1">
                <button
                  type="button"
                  onClick={() => setOpenFaqId(isOpen ? '' : item.id)}
                  aria-expanded={isOpen}
                  className="w-full py-5 text-left flex items-center justify-between gap-4 group cursor-pointer"
                >
                  <span className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white group-hover:text-purple-800 dark:group-hover:text-amber-300 transition-colors leading-snug">
                    {item.q[language]}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-purple-700 dark:text-amber-300' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="pb-5 pr-8 text-[15px] sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.a[language]}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Direct WhatsApp Help Strip */}
        <div className="mt-10 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {copy.moreTitle}
            </p>
            <p className="text-sm sm:text-[15px] text-slate-600 dark:text-slate-400">
              {copy.moreSub}
            </p>
          </div>
          <a
            href="https://wa.me/8801886340308?text=%E0%A6%86%E0%A6%B8%E0%A6%B8%E0%A6%BE%E0%A6%B2%E0%A6%BE%E0%A6%AE%E0%A7%81%20%E0%A6%86%E0%A6%B2%E0%A6%BE%E0%A6%87%E0%A6%95%E0%A7%81%E0%A6%AE%2C%20%E0%A6%AE%E0%A6%BE%E0%A6%B9%E0%A6%BE%E0%A6%B0%E0%A6%BE%E0%A6%A4%20%E0%A6%AE%E0%A6%A1%E0%A7%87%E0%A6%B2%20%E0%A6%AE%E0%A6%BE%E0%A6%A6%E0%A7%8D%E0%A6%B0%E0%A6%BE%E0%A6%B8%E0%A6%BE%E0%A6%B0%20%E0%A6%AD%E0%A6%B0%E0%A7%8D%E0%A6%A4%E0%A6%BF%20%E0%A6%B8%E0%A6%AE%E0%A7%8D%E0%A6%AA%E0%A6%B0%E0%A7%8D%E0%A6%95%E0%A7%87%20%E0%A6%9C%E0%A6%BE%E0%A6%A8%E0%A6%A4%E0%A7%87%20%E0%A6%9A%E0%A6%BE%E0%A6%87%E0%A5%A4"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm sm:text-[15px] inline-flex items-center gap-2 transition-colors shrink-0 shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{copy.waBtn}</span>
          </a>
        </div>
      </div>
    </section>
  );
};
