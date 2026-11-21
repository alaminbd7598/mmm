import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  BedDouble,
  BookOpen,
  Bus,
  CheckCircle2,
  CloudSun,
  Compass,
  FileCheck2,
  FileDown,
  Gamepad2,
  GraduationCap,
  Home,
  MapPin,
  MessageSquareWarning,
  Moon,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Sunrise,
  TrainFront,
  Users,
  Utensils,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import { isValidPhone } from '../utils/contactValidation';
import {
  calculateTransportFeeByDistance,
  computeStageBalanceWidths,
} from '../utils/cmsLogic';
import {
  formatCurrencyByLang,
  localizeDigits,
  localizeDynamicText,
} from '../utils/i18nContent';
import { GuardianComplaintItem, RoutineActivityItem } from '../types/cms';

export type InfographicsDisplayMode =
  | 'all'
  | 'education-method'
  | 'ten-year-plan'
  | 'daycare-routine'
  | 'transport'
  | 'admission-extra'
  | 'about-context'
  | 'feedback'
  | 'curriculum-only'
  | 'transport-only'
  | 'about-only'
  | 'admission-extra-only';

interface MadrasahInfographicsSectionProps {
  onNavigateToSection?: (sectionId: string) => void;
  mode?: InfographicsDisplayMode;
}

const renderRoutineActivityIcon = (iconType: RoutineActivityItem['iconType']) => {
  switch (iconType) {
    case 'book':
      return <BookOpen className="w-4 h-4" />;
    case 'food':
      return <Utensils className="w-4 h-4" />;
    case 'class':
      return <GraduationCap className="w-4 h-4" />;
    case 'bed':
      return <BedDouble className="w-4 h-4" />;
    case 'play':
      return <Gamepad2 className="w-4 h-4" />;
    case 'prayer':
      return <Moon className="w-4 h-4" />;
    case 'home':
      return <Home className="w-4 h-4" />;
    default:
      return <BookOpen className="w-4 h-4" />;
  }
};

const renderPeriodHeaderIcon = (iconType: 'morning' | 'noon' | 'afternoon' | 'night') => {
  switch (iconType) {
    case 'morning':
      return <Sunrise className="w-6 h-6 text-purple-700 dark:text-amber-300" />;
    case 'noon':
      return <Sun className="w-6 h-6 text-amber-500 dark:text-amber-300" />;
    case 'afternoon':
      return <CloudSun className="w-6 h-6 text-fuchsia-600 dark:text-fuchsia-300" />;
    case 'night':
      return <Moon className="w-6 h-6 text-indigo-700 dark:text-purple-300" />;
  }
};

/**
 * Normalizes any legacy brown track colors in stored content to the Royal Purple, Fuchsia and Gold
 * brand palette.
 */
function resolveBrandTrackStyles(trackId: string, rawBg: string, rawText: string, rawDot: string) {
  if (trackId === 'track-quran' || rawBg === '#4E2A14') {
    return {
      dotColor: '#6b21a8',
      className:
        'bg-gradient-to-r from-[#2e0249] via-[#4c0575] to-[#6b21a8] text-white border border-purple-400/30',
    };
  }
  if (trackId === 'track-arabic' || rawBg === '#98501D') {
    return {
      dotColor: '#d946ef',
      className:
        'bg-gradient-to-r from-purple-700 via-fuchsia-600 to-purple-600 text-white border border-fuchsia-400/30',
    };
  }
  if (trackId === 'track-islam' || rawBg === '#DFCFAF') {
    return {
      dotColor: '#f59e0b',
      className:
        'bg-gradient-to-r from-amber-100 via-amber-200/90 to-amber-100 dark:from-amber-500/25 dark:via-amber-500/20 dark:to-amber-400/20 text-purple-950 dark:text-amber-200 border border-amber-300 dark:border-amber-400/40',
    };
  }
  if (trackId === 'track-general' || rawBg === '#FBF9F5') {
    return {
      dotColor: '#7e22ce',
      className:
        'bg-purple-50/90 dark:bg-purple-950/60 text-purple-950 dark:text-purple-100 border border-purple-300 dark:border-purple-500/50',
    };
  }
  return {
    dotColor: rawDot || '#6b21a8',
    className: 'bg-purple-800 text-white',
    customStyle: { backgroundColor: rawBg, color: rawText },
  };
}

export const MadrasahInfographicsSection: React.FC<MadrasahInfographicsSectionProps> = ({
  onNavigateToSection,
  mode = 'all',
}) => {
  const { state, submitGuardianComplaint, language } = useCMS();
  const {
    educationMethodConfig,
    tenYearPlanConfig,
    dayCareRoutineConfig,
    transportConfig,
    admissionExtraConfig,
    uniformConfig,
    madrasahContextConfig,
  } = state;

  // Interactive Stage selector for Screenshot 1
  const [selectedStageId, setSelectedStageId] = useState<string>(
    educationMethodConfig.stages[0]?.id || 'stage-pre-hifz'
  );

  // Interactive Transport Route & Custom Distance checker for Screenshot 4
  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    transportConfig.routes[0]?.id || ''
  );
  const [customDistanceKm, setCustomDistanceKm] = useState<number>(3.5);

  // Guardian Complaint / Suggestion Form state
  const [complaintForm, setComplaintForm] = useState<{
    guardianName: string;
    studentName: string;
    studentClass: string;
    phone: string;
    category: GuardianComplaintItem['category'];
    message: string;
  }>({
    guardianName: '',
    studentName: '',
    studentClass: '',
    phone: '',
    category: 'পরামর্শ (Suggestion)',
    message: '',
  });
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);
  const [complaintError, setComplaintError] = useState('');
  const complaintBusyRef = useRef(false);

  const activeStage =
    educationMethodConfig.stages.find((s) => s.id === selectedStageId) ||
    educationMethodConfig.stages[0];

  const balanceWidths = activeStage
    ? computeStageBalanceWidths(activeStage)
    : { quranWidth: 25, arabicWidth: 25, generalWidth: 50 };

  const selectedRoute = transportConfig.routes.find((r) => r.id === selectedRouteId);
  const estimatedCustomFare = calculateTransportFeeByDistance(
    customDistanceKm,
    transportConfig.perKmRate
  );

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (complaintBusyRef.current) return;
    if (
      !complaintForm.guardianName.trim() ||
      !complaintForm.phone.trim() ||
      !complaintForm.message.trim()
    ) {
      return;
    }
    if (!isValidPhone(complaintForm.phone)) {
      setComplaintError(
        language === 'bn'
          ? 'অনুগ্রহ করে একটি সঠিক মোবাইল নম্বর লিখুন।'
          : language === 'ar'
            ? 'يرجى إدخال رقم هاتف صحيح.'
            : 'Please enter a valid phone number.'
      );
      return;
    }
    complaintBusyRef.current = true;
    const result = await submitGuardianComplaint(complaintForm);
    complaintBusyRef.current = false;
    // The thank-you note is shown only once the server has stored the message; otherwise the
    // form keeps what was typed and explains what to correct.
    if (!result.ok) {
      setComplaintError(result.error);
      return;
    }
    setComplaintError('');
    setComplaintSubmitted(true);
    setComplaintForm({
      guardianName: '',
      studentName: '',
      studentClass: '',
      phone: '',
      category: 'পরামর্শ (Suggestion)',
      message: '',
    });
    setTimeout(() => setComplaintSubmitted(false), 6000);
  };

  const showEducationMethod =
    mode === 'all' || mode === 'curriculum-only' || mode === 'education-method';
  const showTenYearPlan =
    mode === 'all' || mode === 'curriculum-only' || mode === 'ten-year-plan';
  const showDayCareRoutine =
    mode === 'all' || mode === 'curriculum-only' || mode === 'daycare-routine';
  const showTransport =
    mode === 'all' || mode === 'transport-only' || mode === 'transport';
  const showAdmissionExtra =
    mode === 'all' || mode === 'admission-extra-only' || mode === 'admission-extra';
  const showAboutContext =
    mode === 'all' || mode === 'about-only' || mode === 'about-context';
  const showFeedbackBox =
    mode === 'all' || mode === 'about-only' || mode === 'feedback';

  const labels = {
    bn: {
      balancedBadge: 'সমন্বিত দ্বীনি ও জেনারেল কারিকুলাম',
      madrasahTiming: 'মাদরাসার সময়:',
      quranLegend: 'কুরআন',
      arabicLegend: 'আরবি',
      generalLegend: 'সাধারণ',
      postDakhil: 'দাখিলের পর:',
      perMonth: '/মাস',
      distanceApprox: 'দূরত্ব: প্রায়',
      km: 'কি.মি.',
      fareCalcTitle: 'পরিবহন রুট ও দূরত্ব অনুযায়ী মাসিক ভাড়া হিসাব',
      fareCalcSub:
        'নির্ধারিত রুট নির্বাচন করুন অথবা আপনার বাসা থেকে ক্যাম্পাসের দূরত্ব (কি.মি.) দিয়ে সম্ভাব্য মাসিক পরিবহন ফি দেখুন:',
      selectRouteLabel: 'নির্ধারিত পরিবহন রুট নির্বাচন করুন',
      customDistanceLabel: 'অথবা কাস্টম দূরত্ব',
      perKmRateLabel: 'প্রতি কি.মি.',
      selectedRouteResult: 'নির্বাচিত রুট',
      distanceCalcResult: 'দূরত্ব অনুযায়ী হিসাব',
      distancePrefix: 'দূরত্ব:',
      feeComparisonBadge: 'ভর্তি, বয়সসীমা ও ফি তুলনামূলক বিবরণী',
      colParticulars: 'বিবরণ',
      colRegular: 'নন-ডে-কেয়ার (নিয়মিত)',
      colDayCare: 'হিফজ ও ডে-কেয়ার (পূর্ণ দিন)',
      familyConcession: 'পরিবার ও সহোদর সুবিধা',
      admissionDiscountBadge: 'ভর্তি ফিতে',
      tuitionDiscountBadge: 'টিউশন ফিতে',
      offText: 'ছাড়',
      eProspectus: 'ই-প্রসপেক্টাস (PDF)',
      feedbackBadge: 'অভিভাবক সেবা ও সরাসরি যোগাযোগ',
      feedbackTitle: 'অভিভাবক অভিযোগ ও পরামর্শ বক্স',
      feedbackSub:
        'সন্তানের পড়াশোনা, ক্লাসরুম, পরিবহন বা সার্বিক ব্যবস্থাপনা বিষয়ে আপনার যেকোনো মূল্যবান পরামর্শ বা অভিযোগ সরাসরি প্রশাসনের কাছে পাঠান।',
      feedbackSuccess:
        'জাযাকাল্লাহু খাইরান! আপনার মতামতটি সরাসরি অ্যাডমিন ড্যাশবোর্ডে সংরক্ষিত হয়েছে।',
      guardianName: 'অভিভাবকের নাম *',
      guardianNamePh: 'আপনার নাম লিখুন',
      mobileNo: 'মোবাইল নম্বর *',
      studentName: 'শিক্ষার্থীর নাম (ঐচ্ছিক)',
      studentNamePh: 'সন্তানের নাম',
      studentClass: 'শ্রেণি / বিভাগ (ঐচ্ছিক)',
      studentClassPh: 'যেমন: হিফজ / ৩য় শ্রেণি',
      topicType: 'বিষয়ের ধরন',
      msgLabel: 'বিস্তারিত পরামর্শ বা অভিযোগ *',
      msgPh: 'আপনার মতামত বিস্তারিত লিখুন...',
      submitFeedbackBtn: 'অভিযোগ বা পরামর্শ জমা দিন',
    },
    en: {
      balancedBadge: 'Balanced Islamic & Modern Academic Curriculum',
      madrasahTiming: 'Campus Hours:',
      quranLegend: 'Quran',
      arabicLegend: 'Arabic',
      generalLegend: 'General',
      postDakhil: 'Post-Dakhil Pathways:',
      perMonth: '/month',
      distanceApprox: 'Distance: ~',
      km: 'km',
      fareCalcTitle: 'Monthly Transport Fare & Route Calculator',
      fareCalcSub:
        'Select an official transport route or enter your custom distance (km) from campus to estimate monthly fare:',
      selectRouteLabel: 'Select Official Transport Route',
      customDistanceLabel: 'Or Custom Distance (km)',
      perKmRateLabel: 'Per km',
      selectedRouteResult: 'Selected Route',
      distanceCalcResult: 'Distance Estimate',
      distancePrefix: 'Distance:',
      feeComparisonBadge: 'Admission, Age Eligibility & Fee Comparison',
      colParticulars: 'Particulars',
      colRegular: 'Regular (Non-Daycare)',
      colDayCare: 'Full-Day Hifz & Day-Care',
      familyConcession: 'Family & Sibling Benefit',
      admissionDiscountBadge: 'Admission Fee',
      tuitionDiscountBadge: 'Monthly Tuition',
      offText: 'OFF',
      eProspectus: 'e-Prospectus (PDF)',
      feedbackBadge: 'Parent Care & Direct Administration Desk',
      feedbackTitle: 'Guardian Feedback & Suggestion Box',
      feedbackSub:
        'Share your valuable suggestions, observations, or concerns regarding academics, transport, or campus care directly with our administration.',
      feedbackSuccess:
        'Thank you! Your feedback has been securely recorded in the Administration Portal.',
      guardianName: 'Guardian Name *',
      guardianNamePh: 'Enter your full name',
      mobileNo: 'Mobile Number *',
      studentName: 'Student Name (Optional)',
      studentNamePh: 'Enter student name',
      studentClass: 'Grade / Department (Optional)',
      studentClassPh: 'e.g. Hifz / Grade 3',
      topicType: 'Feedback Category',
      msgLabel: 'Detailed Suggestion or Feedback *',
      msgPh: 'Write your message or suggestion in detail...',
      submitFeedbackBtn: 'Submit Feedback to Administration',
    },
    ar: {
      balancedBadge: 'منهج متوازن يجمع بين العلوم الشرعية والأكاديمية',
      madrasahTiming: 'ساعات الدوام:',
      quranLegend: 'القرآن',
      arabicLegend: 'العربية',
      generalLegend: 'العلوم العامة',
      postDakhil: 'مسارات ما بعد الداخل:',
      perMonth: '/شهرياً',
      distanceApprox: 'المسافة التقريبية:',
      km: 'كم',
      fareCalcTitle: 'حاسبة رسوم النقل المدرسي حسب المسار والمسافة',
      fareCalcSub:
        'اختر مسار الحافلة المحدد أو أدخل المسافة بالكيلومتر من منزلك إلى الحرم التعليمي لمعرفة الرسوم الشهرية:',
      selectRouteLabel: 'اختر مسار النقل الرسمي',
      customDistanceLabel: 'أو أدخل المسافة المخصصة (كم)',
      perKmRateLabel: 'لكل كم',
      selectedRouteResult: 'المسار المختار',
      distanceCalcResult: 'التكلفة حسب المسافة',
      distancePrefix: 'المسافة:',
      feeComparisonBadge: 'مقارنة الرسوم وشروط العمر والوثائق',
      colParticulars: 'البند',
      colRegular: 'الدوام الاعتيادي (بدون رعاية)',
      colDayCare: 'تحفيظ ورعاية نهارية كاملة',
      familyConcession: 'مزايا الأسرة والأشقاء',
      admissionDiscountBadge: 'رسوم القبول',
      tuitionDiscountBadge: 'الرسوم الشهرية',
      offText: 'خصم',
      eProspectus: 'الدليل التعريفي (PDF)',
      feedbackBadge: 'خدمة أولياء الأمور والتواصل المباشر',
      feedbackTitle: 'صندوق مقترحاتوملاحظات أولياء الأمور',
      feedbackSub:
        'شاركونا مقترحاتكم أو ملاحظاتكم القيمة حول الدراسة أو النقل أو الرعاية الطلابية مباشرة مع إدارة المعهد.',
      feedbackSuccess: 'جزاكم الله خيراً! تم إرسال رسالتكم وحفظها في لوحة الإدارة بنجاح.',
      guardianName: 'اسم ولي الأمر *',
      guardianNamePh: 'أدخل اسمك الكامل',
      mobileNo: 'رقم الجوال *',
      studentName: 'اسم الطالب (اختياري)',
      studentNamePh: 'اسم الطالب',
      studentClass: 'الصف / القسم (اختياري)',
      studentClassPh: 'مثال: قسم الحفظ / الصف الثالث',
      topicType: 'نوع الرسالة',
      msgLabel: 'تفاصيل المقترح أو الملاحظة *',
      msgPh: 'اكتب رسالتك أو مقترحك بالتفصيل...',
      submitFeedbackBtn: 'إرسال المقترح للإدارة',
    },
  }[language];

  const localizeParagraphs = (paragraphsBn: string[]) => {
    if (language === 'bn') return paragraphsBn;
    if (language === 'ar') {
      return [
        'تأسس معهدنا بهدف تقديم نموذج تعليمي رائد يجمع بين أصالة العلوم الشرعية وإتقان القرآن الكريم وبين التفوق في العلوم الحديثة والمهارات التقنية.',
        'نحرص على تنشئة جيل متوازن يعتز بهويته الإسلامية ويمتلك الكفاءة اللغوية والعلمية للمنافسة عالمياً في كافة المجالات الأكاديمية والمهنية.',
      ];
    }
    return [
      'Our institution was founded to pioneer an integrated educational model that harmonizes authentic Quranic scholarship and Sunnah lifestyle with modern scientific, linguistic, and technological excellence.',
      'We nurture morally grounded, intellectually curious students who are equally prepared to lead as Huffaz, scholars, scientists, engineers, and ethical entrepreneurs.',
    ];
  };

  const localizeObjectives = (objectivesBn: string[]) => {
    if (language === 'bn') return objectivesBn;
    if (language === 'ar') {
      return [
        'تحفيظ القرآن الكريم بالتجويد المتقن مع الفهم والتدبر.',
        'إتقان اللغات الثلاث: العربية الفصحى، الإنجليزية بطلاقة، والبنغالية المعيارية.',
        'التفوق في المنهج الأكاديمي الوطني (NCTB) والعلوم والرياضيات والحاسوب.',
        'غرس القيم الإسلامية والآداب النبوية والمهارات القيادية في شخصية الطالب.',
        'توفير بيئة تربوية آمنة ورعاية نهارية متكاملة تغني عن الدروس الخصوصية.',
      ];
    }
    return [
      'Mastery of the Holy Quran with authentic Tajweed, recitation, and comprehension.',
      'Fluency across 3 languages: Classical & Spoken Arabic, English, and Standard Bengali.',
      'Academic excellence in NCTB General Subjects (Mathematics, Science, ICT & Humanities).',
      'Instilling Prophetic character (Adab), daily Sunnah habits, and leadership skills.',
      'Providing a safe, tutor-free learning environment where all daily lessons are mastered in class.',
    ];
  };

  return (
    <div className="space-y-0" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* =====================================================================
          SCREENSHOT 1: শিক্ষা পদ্ধতি ৫০/৫০ ও স্তরভেদে বিষয়ের ভারসাম্য
          (Styled in Royal Purple, Fuchsia & Gold)
         ===================================================================== */}
      {showEducationMethod && educationMethodConfig.enabled && (
        <section
          id="education-method"
          className="scroll-mt-20 py-14 lg:py-20 bg-gradient-to-br from-[#f8f4ff] via-[#f3e8ff] to-[#fae8ff] dark:from-[#120024] dark:via-[#21023a] dark:to-[#320454] text-slate-900 dark:text-white border-y border-purple-200/80 dark:border-purple-800/50 transition-colors"
        >
          <div className="cii-container-section">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: শিক্ষা পদ্ধতি ৫০/৫০ */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-purple-800 dark:text-amber-300">
                  <Sparkles className="w-4 h-4 text-fuchsia-600 dark:text-amber-300" />
                  <span>{labels.balancedBadge}</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-[#2e0249] dark:text-white">
                  {localizeDynamicText(educationMethodConfig.sectionTitleBn, language)}
                </h2>

                {/* Giant ৫০/৫০ Graphic in Royal Purple & Gold */}
                <div
                  className="flex items-baseline select-none leading-none py-2"
                  aria-label={`${localizeDigits(educationMethodConfig.ratioLeftBn, language)}/${localizeDigits(educationMethodConfig.ratioRightBn, language)}`}
                >
                  <span className="text-[84px] sm:text-[116px] xl:text-[136px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#2e0249] via-[#581c87] to-[#a21caf] dark:from-white dark:via-purple-200 dark:to-amber-300">
                    {localizeDigits(educationMethodConfig.ratioLeftBn, language)}
                  </span>
                  <span className="text-[72px] sm:text-[96px] xl:text-[112px] font-light text-fuchsia-600 dark:text-amber-400 mx-2 sm:mx-3 transform -rotate-6">
                    /
                  </span>
                  <span
                    className="text-[84px] sm:text-[116px] xl:text-[136px] font-black tracking-tighter dark:hidden"
                    style={{
                      color: 'transparent',
                      WebkitTextStroke: '2.5px #4c0575',
                    }}
                  >
                    {localizeDigits(educationMethodConfig.ratioRightBn, language)}
                  </span>
                  <span
                    className="hidden dark:inline text-[84px] sm:text-[116px] xl:text-[136px] font-black tracking-tighter"
                    style={{
                      color: 'transparent',
                      WebkitTextStroke: '2.5px #fcd34d',
                    }}
                  >
                    {localizeDigits(educationMethodConfig.ratioRightBn, language)}
                  </span>
                </div>

                {/* Horizontal Divider */}
                <div className="h-[2px] w-full bg-gradient-to-r from-purple-700 via-fuchsia-500 to-amber-400 opacity-60" />

                {/* Two Sub-Columns: ইসলামি শিক্ষা & সাধারণ শিক্ষা */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
                  <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#1e0338]/90 border border-purple-200/80 dark:border-purple-500/35 shadow-xs">
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#2e0249] dark:text-amber-300 mb-1">
                      {localizeDynamicText(educationMethodConfig.islamicTitleBn, language)}
                    </h3>
                    <p className="text-sm sm:text-base text-slate-700 dark:text-purple-100 font-medium leading-relaxed">
                      {localizeDynamicText(educationMethodConfig.islamicSubjectsBn, language)}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#1e0338]/90 border border-purple-200/80 dark:border-purple-500/35 shadow-xs">
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#2e0249] dark:text-fuchsia-300 mb-1">
                      {localizeDynamicText(educationMethodConfig.generalTitleBn, language)}
                    </h3>
                    <p className="text-sm sm:text-base text-slate-700 dark:text-purple-100 font-medium leading-relaxed">
                      {localizeDynamicText(educationMethodConfig.generalSubjectsBn, language)}
                    </p>
                  </div>
                </div>

                {/* Bottom Explanatory Paragraph */}
                <p className="text-base sm:text-lg text-slate-700 dark:text-purple-100/90 leading-relaxed font-medium pt-1 max-w-xl">
                  {localizeDynamicText(educationMethodConfig.descriptionBn, language)}
                </p>
              </div>

              {/* Right Column: স্তরভেদে বিষয়ের ভারসাম্য (Interactive Royal Purple Gradient Card) */}
              <div className="lg:col-span-6">
                <div className="bg-gradient-to-br from-[#2e0249] via-[#3b0764] to-[#4c0575] text-white rounded-[28px] p-6 sm:p-8 lg:p-9 shadow-2xl border border-purple-400/30">
                  <p className="text-sm sm:text-base font-bold text-amber-300 mb-4">
                    {localizeDynamicText(educationMethodConfig.balanceCardTitleBn, language)}
                  </p>

                  {/* 3 Interactive Stage Tabs: প্রি-হিফজ | হিফজ | আফটার হিফজ */}
                  <div
                    className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-6"
                    role="tablist"
                    aria-label={localizeDynamicText(educationMethodConfig.balanceCardTitleBn, language)}
                  >
                    {educationMethodConfig.stages.map((stage) => {
                      const isActive = stage.id === activeStage?.id;
                      return (
                        <button
                          key={stage.id}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          data-testid={`stage-balance-tab-${stage.id}`}
                          onClick={() => setSelectedStageId(stage.id)}
                          className={`py-2.5 sm:py-3 px-3 rounded-full text-xs sm:text-base font-extrabold transition-all cursor-pointer border ${
                            isActive
                              ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 border-amber-300 shadow-lg'
                              : 'bg-white/10 text-purple-100 border-white/20 hover:bg-white/20 hover:border-amber-300/60'
                          }`}
                        >
                          {localizeDynamicText(stage.stageNameBn, language)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Class Range & Madrasah Timing Row */}
                  {activeStage && (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm mb-4 pb-1">
                        <span className="font-extrabold text-white text-sm sm:text-base">
                          {localizeDynamicText(activeStage.classRangeBn, language)}
                        </span>
                        <span className="text-purple-200">
                          {labels.madrasahTiming}{' '}
                          <strong className="text-amber-300 font-bold">
                            {localizeDynamicText(activeStage.timingBn, language)}
                          </strong>
                        </span>
                      </div>

                      {/* Proportional Visual Blocks in Brand Colors (Gold, Fuchsia-Purple, Lavender-White) */}
                      <div className="flex items-stretch gap-2.5 sm:gap-3 h-52 sm:h-64 w-full">
                        {/* Block 1: কুরআন (Warm Gold/Amber Gradient) */}
                        <div
                          style={{ width: `${balanceWidths.quranWidth}%` }}
                          className="bg-gradient-to-t from-amber-500 via-amber-400 to-amber-300 text-slate-950 rounded-2xl p-3 sm:p-4 flex flex-col justify-between transition-all duration-500 overflow-hidden shadow-md"
                        >
                          <span className="text-xs font-extrabold uppercase tracking-wider opacity-85 truncate">
                            {labels.quranLegend}
                          </span>
                          <span className="text-2xl sm:text-4xl lg:text-[42px] font-black leading-none tracking-tight">
                            {localizeDigits(activeStage.quranPercent, language)}%
                          </span>
                        </div>

                        {/* Block 2: আরবি (Vibrant Fuchsia-Purple Gradient) */}
                        <div
                          style={{ width: `${balanceWidths.arabicWidth}%` }}
                          className="bg-gradient-to-t from-fuchsia-700 via-fuchsia-600 to-purple-500 text-white rounded-2xl p-3 sm:p-4 flex flex-col justify-between transition-all duration-500 overflow-hidden shadow-md"
                        >
                          <span className="text-xs font-extrabold uppercase tracking-wider text-purple-100 truncate">
                            {labels.arabicLegend}
                          </span>
                          <span className="text-2xl sm:text-4xl lg:text-[42px] font-black leading-none tracking-tight">
                            {localizeDigits(activeStage.arabicPercent, language)}%
                          </span>
                        </div>

                        {/* Block 3: সাধারণ (Crisp Lavender-White Surface) */}
                        <div
                          style={{ width: `${balanceWidths.generalWidth}%` }}
                          className="bg-gradient-to-t from-purple-100 via-white to-white text-[#2e0249] rounded-2xl p-3 sm:p-5 flex flex-col justify-between transition-all duration-500 overflow-hidden shadow-md"
                        >
                          <span className="text-xs font-extrabold uppercase tracking-wider text-purple-800 truncate">
                            {labels.generalLegend}
                          </span>
                          <span className="text-3xl sm:text-5xl lg:text-[54px] font-black leading-none tracking-tight">
                            {localizeDigits(activeStage.generalPercent, language)}%
                          </span>
                        </div>
                      </div>

                      {/* Legend Row at Bottom of Card */}
                      <div className="flex flex-wrap items-center gap-5 sm:gap-6 mt-5 pt-1 text-xs sm:text-sm font-bold text-purple-100">
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-[4px] bg-amber-400 inline-block" />
                          <span>
                            {labels.quranLegend} {localizeDigits(activeStage.quranPercent, language)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-[4px] bg-fuchsia-500 inline-block" />
                          <span>
                            {labels.arabicLegend} {localizeDigits(activeStage.arabicPercent, language)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-[4px] bg-white inline-block" />
                          <span>
                            {labels.generalLegend} {localizeDigits(activeStage.generalPercent, language)}%
                          </span>
                        </div>
                      </div>

                      {activeStage.noteBn && (
                        <p className="mt-3 text-xs text-purple-200/95 border-t border-white/15 pt-2.5">
                          {localizeDynamicText(activeStage.noteBn, language)}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          SCREENSHOT 2: নার্সারি থেকে একাদশ, তিন স্তরে (১০ বছরের পাঠ পরিকল্পনা)
          (Styled in Royal Purple, Fuchsia & Gold)
         ===================================================================== */}
      {showTenYearPlan && tenYearPlanConfig.enabled && (
        <section
          id="ten-year-plan"
          className="scroll-mt-20 py-14 lg:py-20 bg-gradient-to-br from-[#1b0230] via-[#2e0249] to-[#4c0575] text-white transition-colors"
        >
          <div className="cii-container-section">
            {/* Section Header */}
            <div className="max-w-3xl mb-8 lg:mb-10">
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-white tracking-tight mb-3">
                {localizeDynamicText(tenYearPlanConfig.headingBn, language)}
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-purple-200 leading-relaxed">
                {localizeDynamicText(tenYearPlanConfig.subheadingBn, language)}
              </p>
            </div>

            {/* Inner Roadmap Matrix Card in Clean Lavender-White / Dark Slate */}
            <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-[28px] p-5 sm:p-8 lg:p-10 shadow-2xl border border-purple-300/40 dark:border-purple-500/30">
              <div className="mb-6">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2e0249] dark:text-white">
                  {localizeDynamicText(tenYearPlanConfig.cardTitleBn, language)}
                </h3>
                <p className="text-xs sm:text-sm text-purple-800 dark:text-amber-300 font-semibold mt-1">
                  {localizeDynamicText(tenYearPlanConfig.cardSubtitleBn, language)}
                </p>
              </div>

              {/* Scrollable wrapper on mobile, full matrix on laptop/desktop */}
              <div className="overflow-x-auto pb-2 -mx-2 px-2">
                <div className="min-w-[920px]">
                  {/* Row 1: 3 Stage Banners aligned over the 13 class columns */}
                  <div className="grid grid-cols-[110px_repeat(13,minmax(0,1fr))] gap-1.5 mb-3">
                    <div />
                    {tenYearPlanConfig.stageBanners.map((banner) => (
                      <div
                        key={banner.id}
                        style={{ gridColumn: `span ${banner.colSpan} / span ${banner.colSpan}` }}
                        className="bg-gradient-to-r from-[#2e0249] via-[#4c0575] to-[#6b21a8] text-white rounded-xl px-3.5 py-2.5 border border-purple-400/30 shadow-xs"
                      >
                        <div className="font-extrabold text-sm sm:text-base text-amber-300">
                          {localizeDynamicText(banner.titleBn, language)}
                        </div>
                        <div className="text-[11px] sm:text-xs text-purple-100">
                          {localizeDynamicText(banner.timingBn, language)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Row 2: 13 Class Columns (নার্সারি ৫+ বছর to একাদশ) */}
                  <div className="grid grid-cols-[110px_repeat(13,minmax(0,1fr))] gap-1.5 mb-3 items-end">
                    <div />
                    {tenYearPlanConfig.classColumns.map((col) => (
                      <div
                        key={col.id}
                        className="text-center py-1.5 rounded-lg bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/40"
                      >
                        <div className="font-extrabold text-xs sm:text-sm text-[#2e0249] dark:text-white">
                          {localizeDynamicText(col.classNameBn, language)}
                        </div>
                        {col.ageLabelBn && (
                          <div className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold">
                            {localizeDynamicText(col.ageLabelBn, language)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Rows 3-6: Left Track Labels + 10 Class Columns of Subject Tracks + 2 Cols Dakhil + 1 Col Mutawassitah */}
                  <div className="grid grid-cols-[110px_repeat(13,minmax(0,1fr))] gap-1.5 items-stretch">
                    {/* Left 11 Columns (Track label + 10 classes Nursery to 8th) */}
                    <div className="col-span-11 space-y-2">
                      {tenYearPlanConfig.tracks.map((track) => {
                        const brandStyle = resolveBrandTrackStyles(
                          track.id,
                          track.bgColor,
                          track.textColor,
                          track.dotColor
                        );
                        return (
                          <div
                            key={track.id}
                            className="grid grid-cols-[110px_repeat(10,minmax(0,1fr))] gap-1.5 items-center"
                          >
                            {/* Track Label (কুরআন, আরবি, ইসলাম, সাধারণ) */}
                            <div className="flex items-center gap-2 pr-2 py-2">
                              <span
                                className="w-3.5 h-3.5 rounded-[4px] shrink-0 border border-purple-500/30"
                                style={{ backgroundColor: brandStyle.dotColor }}
                              />
                              <span className="font-extrabold text-xs sm:text-sm text-[#2e0249] dark:text-white">
                                {localizeDynamicText(track.trackNameBn, language)}
                              </span>
                            </div>

                            {/* Track Blocks across the first 10 columns */}
                            {track.blocks.map((block) => (
                              <div
                                key={block.id}
                                style={{
                                  gridColumn: `span ${block.colSpan} / span ${block.colSpan}`,
                                  ...(brandStyle.customStyle || {}),
                                }}
                                className={`h-11 sm:h-12 rounded-xl px-2.5 flex items-center justify-center sm:justify-start font-bold text-xs sm:text-sm shadow-xs ${brandStyle.className}`}
                              >
                                <span className="truncate">
                                  {localizeDynamicText(block.labelBn, language)}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>

                    {/* Columns 12-13 (9th & 10th Grade): দাখিল (বোর্ডের সিলেবাস) vertical block */}
                    <div className="col-span-2 bg-gradient-to-b from-[#2e0249] via-[#4c0575] to-[#6b21a8] text-white rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-lg border border-purple-400/30">
                      <span className="font-extrabold text-base sm:text-lg text-amber-300">
                        {localizeDynamicText(tenYearPlanConfig.dakhilTitleBn, language)}
                      </span>
                      <span className="text-xs text-purple-100 mt-1">
                        {localizeDynamicText(tenYearPlanConfig.dakhilSubtitleBn, language)}
                      </span>
                    </div>

                    {/* Column 14 (11th Grade): মুতাওয়াসসিতা (দাখিলের পর এক বছর) vertical block */}
                    <div className="col-span-1 bg-gradient-to-b from-fuchsia-700 via-purple-800 to-[#2e0249] text-white rounded-2xl p-2.5 flex flex-col items-center justify-center text-center shadow-lg border border-fuchsia-400/30">
                      <span className="font-extrabold text-sm sm:text-base leading-snug text-amber-300">
                        {localizeDynamicText(tenYearPlanConfig.mutawassitahTitleBn, language)}
                      </span>
                      <span className="text-[11px] text-purple-100 mt-1 leading-tight">
                        {localizeDynamicText(tenYearPlanConfig.mutawassitahSubtitleBn, language)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Post-Dakhil Options Row */}
              <div className="mt-6 pt-5 border-t border-purple-200 dark:border-purple-800/60 flex flex-wrap items-center gap-3">
                <span className="text-xs sm:text-sm text-purple-800 dark:text-amber-300 font-bold">
                  {labels.postDakhil}
                </span>
                {tenYearPlanConfig.postDakhilOptionsBn.map((opt, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-1.5 rounded-full border border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-950/70 text-xs sm:text-sm font-extrabold text-[#2e0249] dark:text-white"
                  >
                    {localizeDynamicText(opt, language)}
                  </span>
                ))}
              </div>

              {/* Bottom Footer Note & Action Link */}
              <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-purple-200 font-medium">
                  {localizeDynamicText(tenYearPlanConfig.footerNoteBn, language)}
                </p>
                <button
                  type="button"
                  onClick={() => onNavigateToSection?.('courses')}
                  className="inline-flex items-center gap-2 text-sm sm:text-base font-extrabold text-fuchsia-700 dark:text-amber-300 hover:text-purple-950 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <span>{localizeDynamicText(tenYearPlanConfig.syllabusLinkTextBn, language)}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          SCREENSHOT 3: হিফজ ডে-কেয়ারের একটি দিন ও ধাপভেদে মাদরাসার সময়
          (Styled in Royal Purple, Fuchsia & Gold)
         ===================================================================== */}
      {showDayCareRoutine && dayCareRoutineConfig.enabled && (
        <section
          id="daycare-routine"
          className="scroll-mt-20 py-14 lg:py-20 bg-slate-50 dark:bg-[#0d0118] text-slate-900 dark:text-white border-b border-purple-200/70 dark:border-purple-900/50 transition-colors"
        >
          <div className="cii-container-section">
            {/* Heading */}
            <div className="max-w-3xl mb-10">
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#2e0249] dark:text-white tracking-tight mb-3">
                {localizeDynamicText(dayCareRoutineConfig.headingBn, language)}
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-purple-200 leading-relaxed font-medium">
                {localizeDynamicText(dayCareRoutineConfig.subheadingBn, language)}
              </p>
            </div>

            {/* 4 Period Columns: সকাল | দুপুর | বিকাল | সন্ধ্যা ও রাত */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
              {dayCareRoutineConfig.periods.map((period) => (
                <div
                  key={period.id}
                  className="bg-white dark:bg-[#1c0333]/90 border border-purple-200/80 dark:border-purple-500/35 rounded-[24px] p-5 sm:p-6 shadow-sm hover:shadow-lg transition-all flex flex-col"
                >
                  {/* Period Header */}
                  <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-purple-100 dark:border-purple-800/50">
                    {renderPeriodHeaderIcon(period.iconType)}
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#2e0249] dark:text-white">
                      {localizeDynamicText(period.periodNameBn, language)}
                    </h3>
                  </div>

                  {/* Vertical Timeline Items */}
                  <div className="space-y-6 relative before:absolute before:left-[17px] rtl:before:left-auto rtl:before:right-[17px] before:top-4 before:bottom-4 before:w-[2px] before:bg-purple-200 dark:before:bg-purple-800/60">
                    {period.items.map((item) => {
                      const isSoftBadge = item.iconType === 'food' || item.iconType === 'bed';
                      const isAccentBadge = item.iconType === 'play' || item.iconType === 'class';
                      return (
                        <div key={item.id} className="relative flex items-start gap-3.5">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 shadow-xs ${
                              isSoftBadge
                                ? 'bg-amber-100 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-300/60'
                                : isAccentBadge
                                  ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white'
                                  : 'bg-[#2e0249] dark:bg-purple-700 text-white'
                            }`}
                          >
                            {renderRoutineActivityIcon(item.iconType)}
                          </div>
                          <div className="pt-0.5">
                            <div className="text-xs font-extrabold text-fuchsia-700 dark:text-amber-300">
                              {localizeDynamicText(item.timeBn, language)}
                            </div>
                            <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug mt-0.5">
                              {localizeDynamicText(item.titleBn, language)}
                            </div>
                            {item.subtitleBn && (
                              <p className="text-xs text-slate-600 dark:text-purple-200 mt-1 leading-relaxed">
                                {localizeDynamicText(item.subtitleBn, language)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Row: Seasonal Note on Left + ধাপভেদে মাদরাসার সময় Gantt Bars on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start pt-4 border-t border-purple-200/60 dark:border-purple-800/40">
              <div className="lg:col-span-5">
                <div className="p-5 rounded-2xl bg-purple-50/80 dark:bg-white/5 border border-purple-200/80 dark:border-purple-500/25">
                  <p className="text-sm sm:text-base text-slate-700 dark:text-purple-100 leading-relaxed font-medium">
                    {localizeDynamicText(dayCareRoutineConfig.seasonalNoteBn, language)}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-base sm:text-lg font-extrabold text-[#2e0249] dark:text-amber-300">
                  {localizeDynamicText(dayCareRoutineConfig.durationHeadingBn, language)}
                </h3>

                <div className="space-y-3.5">
                  {dayCareRoutineConfig.durationBars.map((bar) => (
                    <div
                      key={bar.id}
                      className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 sm:gap-4 items-center"
                    >
                      <div>
                        <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {localizeDynamicText(bar.stageNameBn, language)}
                        </div>
                        <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                          {localizeDynamicText(bar.timingLabelBn, language)}
                        </div>
                      </div>

                      {/* Horizontal Bar Track */}
                      <div className="h-4 w-full rounded-full bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800/60 relative overflow-hidden">
                        <div
                          style={{
                            left: `${Math.max(0, Math.min(95, bar.startPercent))}%`,
                            width: `${Math.max(5, Math.min(100, bar.widthPercent))}%`,
                          }}
                          className={`absolute top-0 bottom-0 rounded-full transition-all duration-500 ${
                            bar.isFullDay
                              ? 'bg-gradient-to-r from-fuchsia-600 via-purple-600 to-amber-500'
                              : 'bg-gradient-to-r from-purple-500 to-fuchsia-500'
                          }`}
                        />
                      </div>
                    </div>
                  ))}

                  {/* Timeline Axis Labels (সকাল ৭টা | দুপুর ১টা | রাত ৮:৩০) */}
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 sm:gap-4 pt-1">
                    <div className="hidden sm:block" />
                    <div className="flex items-center justify-between text-xs font-bold text-purple-800 dark:text-purple-200">
                      <span>
                        {localizeDynamicText(dayCareRoutineConfig.timelineLabelsBn[0], language)}
                      </span>
                      <span>
                        {localizeDynamicText(dayCareRoutineConfig.timelineLabelsBn[1], language)}
                      </span>
                      <span>
                        {localizeDynamicText(dayCareRoutineConfig.timelineLabelsBn[2], language)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          SCREENSHOT 4: নিজস্ব পরিবহন (রুট ম্যাপ, দূরত্ব, ভাড়া ও মেট্রোরেল ল্যান্ডমার্ক)
          (Styled in Royal Purple, Fuchsia & Gold)
         ===================================================================== */}
      {showTransport && transportConfig.enabled && (
        <section
          id="transport"
          className="scroll-mt-20 py-14 lg:py-20 bg-gradient-to-br from-[#f8f4ff] via-white to-[#fae8ff] dark:from-[#120024] dark:via-[#1b0230] dark:to-[#2b0347] text-slate-900 dark:text-white border-b border-purple-200/80 dark:border-purple-800/50 transition-colors"
        >
          <div className="cii-container-section space-y-12">
            {/* Top Grid: Left Vehicle Photo, Right Route Steppers */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Column: Vehicle Image + Caption */}
              <div className="lg:col-span-5">
                <div className="rounded-[24px] overflow-hidden shadow-2xl border-2 border-purple-300 dark:border-purple-500/40 bg-white dark:bg-slate-900">
                  <img
                    src={transportConfig.vehicleImageUrl || '/assets/maharat/transport-van.png'}
                    alt={localizeDynamicText(transportConfig.vehicleCaptionBn, language)}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.endsWith('/assets/maharat/transport-van.png')) {
                        target.src = '/assets/maharat/transport-van.png';
                      }
                    }}
                    className="w-full h-[360px] sm:h-[460px] object-cover"
                  />
                </div>
                <p className="text-xs sm:text-sm text-purple-800 dark:text-purple-200 font-semibold mt-2.5">
                  {localizeDynamicText(transportConfig.vehicleCaptionBn, language)}
                </p>
              </div>

              {/* Right Column: নিজস্ব পরিবহন Heading + Vertical Route Steppers */}
              <div className="lg:col-span-7 space-y-8">
                <div>
                  <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#2e0249] dark:text-white tracking-tight mb-2">
                    {localizeDynamicText(transportConfig.headingBn, language)}
                  </h2>
                  <p className="text-base sm:text-lg text-purple-800 dark:text-purple-200 font-medium">
                    {localizeDynamicText(transportConfig.subheadingBn, language)}
                  </p>
                </div>

                {/* Route Steppers Grid (3 columns on desktop, matching Screenshot 4) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-10">
                  {transportConfig.routes.map((route) => (
                    <div
                      key={route.id}
                      className="flex flex-col p-4 rounded-2xl bg-white/90 dark:bg-[#1e0338]/90 border border-purple-200/70 dark:border-purple-500/35 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2 mb-3.5 pb-2 border-b border-purple-100 dark:border-purple-800/50">
                        <h3 className="text-base sm:text-lg font-extrabold text-[#2e0249] dark:text-white">
                          {localizeDynamicText(route.routeNameBn, language)}
                        </h3>
                        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/80 text-purple-900 dark:text-amber-300 border border-purple-300/60 dark:border-purple-500/40">
                          {formatCurrencyByLang(route.monthlyFee, language)}
                          {labels.perMonth}
                        </span>
                      </div>

                      {/* Vertical Route Stepper in Brand Royal Purple & Fuchsia */}
                      <div className="relative pl-1 space-y-0">
                        {route.stopsBn.map((stop, idx) => (
                          <div key={idx} className="relative flex items-start gap-3.5 pb-4">
                            {/* Connecting Vertical Line */}
                            <div className="absolute left-[9px] rtl:left-auto rtl:right-[9px] top-4 bottom-0 w-[3px] bg-gradient-to-b from-purple-600 to-fuchsia-600 dark:from-purple-400 dark:to-fuchsia-400" />
                            {/* Hollow Purple Circle Node */}
                            <div className="w-[21px] h-[21px] rounded-full border-[3.5px] border-purple-700 dark:border-amber-400 bg-white dark:bg-[#1b0230] shrink-0 z-10 mt-0.5" />
                            <span className="text-sm sm:text-[15px] text-slate-800 dark:text-purple-100 font-medium leading-snug">
                              {localizeDynamicText(stop, language)}
                            </span>
                          </div>
                        ))}

                        {/* Final Destination Node (Solid Fuchsia-Purple Circle + Bold Name) */}
                        <div className="relative flex items-start gap-3.5 pt-0.5">
                          <div className="w-[21px] h-[21px] rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-700 dark:from-amber-400 dark:to-amber-500 shrink-0 z-10 mt-0.5 shadow-sm" />
                          <div>
                            <span className="text-sm sm:text-[15px] font-extrabold text-[#2e0249] dark:text-amber-300 leading-snug block">
                              {localizeDynamicText(route.destinationBn, language)}
                            </span>
                            <span className="text-[11px] text-purple-700 dark:text-purple-200 font-medium">
                              {labels.distanceApprox} {localizeDigits(route.distanceKm, language)}{' '}
                              {labels.km} ({localizeDynamicText(route.vehicleTypeBn, language)})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Interactive Bar: Route & Distance Cost Calculator + Metro Rail Landmark Distances */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
              {/* Interactive Route & Distance Cost Calculator */}
              <div className="lg:col-span-6 bg-white dark:bg-[#1e0338]/90 border border-purple-200 dark:border-purple-500/35 rounded-2xl p-5 sm:p-6 shadow-md">
                <div className="flex items-center gap-2.5 mb-3">
                  <Bus className="w-5 h-5 text-fuchsia-600 dark:text-amber-300" />
                  <h3 className="text-lg font-extrabold text-[#2e0249] dark:text-white">
                    {labels.fareCalcTitle}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-purple-200 mb-4">
                  {labels.fareCalcSub}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-purple-900 dark:text-purple-200 mb-1.5">
                      {labels.selectRouteLabel}
                    </label>
                    <select
                      value={selectedRouteId}
                      onChange={(e) => setSelectedRouteId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-purple-300 dark:border-purple-500/40 bg-purple-50/60 dark:bg-[#130726] text-sm font-bold text-slate-900 dark:text-white"
                    >
                      {transportConfig.routes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {localizeDynamicText(r.routeNameBn, language)} (
                          {localizeDigits(r.distanceKm, language)} {labels.km})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-900 dark:text-purple-200 mb-1.5">
                      {labels.customDistanceLabel} ({labels.perKmRateLabel}{' '}
                      {formatCurrencyByLang(transportConfig.perKmRate, language)})
                    </label>
                    <input
                      type="number"
                      min={0.5}
                      max={30}
                      step={0.5}
                      value={customDistanceKm}
                      onChange={(e) => setCustomDistanceKm(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-500/40 bg-purple-50/60 dark:bg-[#130726] text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-purple-50/90 dark:bg-[#17062c] p-3.5 rounded-xl border border-purple-200 dark:border-purple-500/30">
                  <div>
                    <span className="text-xs text-slate-600 dark:text-purple-200 block">
                      {labels.selectedRouteResult} (
                      {localizeDynamicText(selectedRoute?.routeNameBn, language)}):
                    </span>
                    <span className="text-lg font-extrabold text-[#2e0249] dark:text-white">
                      {selectedRoute
                        ? formatCurrencyByLang(selectedRoute.monthlyFee, language)
                        : '—'}{' '}
                      {labels.perMonth}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-600 dark:text-purple-200 block">
                      {labels.distanceCalcResult} ({localizeDigits(customDistanceKm, language)}{' '}
                      {labels.km}):
                    </span>
                    <span className="text-lg font-extrabold text-fuchsia-700 dark:text-amber-300">
                      {formatCurrencyByLang(estimatedCustomFare, language)} {labels.perMonth}
                    </span>
                  </div>
                </div>
              </div>

              {/* Metro Rail & Landmark Distance Card */}
              <div className="lg:col-span-6 bg-gradient-to-br from-[#2e0249] via-[#4c0575] to-[#6b21a8] text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-purple-400/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-extrabold uppercase tracking-wider mb-1.5">
                    <TrainFront className="w-4 h-4" />
                    <span>{localizeDynamicText(transportConfig.landmarkHeadingBn, language)}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white mb-4">
                    {localizeDynamicText(transportConfig.primaryLandmarkBannerBn, language)}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {transportConfig.landmarks.map((lm) => (
                      <div
                        key={lm.id}
                        className="bg-white/10 border border-white/15 rounded-xl p-3 flex items-start gap-2.5 backdrop-blur-xs"
                      >
                        <MapPin className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white">
                            {localizeDynamicText(lm.landmarkNameBn, language)}
                          </div>
                          <div className="text-xs text-purple-200 font-semibold mt-0.5">
                            {labels.distancePrefix}{' '}
                            {localizeDynamicText(lm.distanceTextBn, language)}{' '}
                            {lm.directionBn
                              ? `(${localizeDynamicText(lm.directionBn, language)})`
                              : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          ADDITIONAL COMPONENT 1: ডে-কেয়ার বনাম নন-ডে-কেয়ার ফি তুলনা, ভাইবোন ছাড় ও বয়সসীমা
          (Styled in Royal Purple, Fuchsia & Gold)
         ===================================================================== */}
      {showAdmissionExtra && admissionExtraConfig.enabled && (
        <section
          id="admission-comparison"
          className="py-14 lg:py-20 bg-slate-50 dark:bg-[#0d0118] text-slate-900 dark:text-white border-b border-purple-200/70 dark:border-purple-900/50 transition-colors"
        >
          <div className="cii-container-section space-y-10">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-fuchsia-700 dark:text-amber-300 mb-2">
                <Sparkles className="w-4 h-4" />
                <span>{labels.feeComparisonBadge}</span>
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2e0249] dark:text-white">
                {localizeDynamicText(admissionExtraConfig.comparisonHeadingBn, language)}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-purple-200 mt-1.5">
                {localizeDynamicText(admissionExtraConfig.comparisonSubtitleBn, language)}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left 7 Cols: Comparison Table + Sibling Discount Banner */}
              <div className="lg:col-span-7 space-y-5">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-200 dark:border-purple-800/70 overflow-hidden shadow-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-[#2e0249] to-[#4c0575] text-white text-xs sm:text-sm">
                          <th className="py-3.5 px-4 font-extrabold">{labels.colParticulars}</th>
                          <th className="py-3.5 px-4 font-extrabold">{labels.colRegular}</th>
                          <th className="py-3.5 px-4 font-extrabold bg-fuchsia-700/80 text-amber-200">
                            {labels.colDayCare}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-100 dark:divide-purple-900/40 text-xs sm:text-sm">
                        {admissionExtraConfig.feeComparisonRows.map((row) => (
                          <tr
                            key={row.id}
                            className="hover:bg-purple-50/50 dark:hover:bg-purple-950/30"
                          >
                            <td className="py-3 px-4 font-bold text-[#2e0249] dark:text-white">
                              {localizeDynamicText(row.labelBn, language)}
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-purple-200 font-medium">
                              {localizeDynamicText(row.nonDayCareValueBn, language)}
                            </td>
                            <td className="py-3 px-4 font-bold text-purple-900 dark:text-amber-300 bg-purple-50/60 dark:bg-purple-950/40">
                              {localizeDynamicText(row.dayCareValueBn, language)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sibling Discount Highlight Banner */}
                <div className="bg-gradient-to-r from-[#2e0249] via-[#4c0575] to-[#6b21a8] text-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-purple-400/30 shadow-lg">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 text-xs font-extrabold text-amber-300">
                      <Users className="w-4 h-4" />
                      <span>{labels.familyConcession}</span>
                    </div>
                    <h3 className="text-lg font-extrabold text-white">
                      {localizeDynamicText(admissionExtraConfig.siblingDiscountTitleBn, language)}
                    </h3>
                    <p className="text-xs sm:text-sm text-purple-100">
                      {localizeDynamicText(
                        admissionExtraConfig.siblingDiscountDescriptionBn,
                        language
                      )}
                    </p>
                  </div>
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <span className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs sm:text-sm text-center">
                      {labels.admissionDiscountBadge}{' '}
                      {localizeDigits(
                        admissionExtraConfig.siblingAdmissionDiscountPercent,
                        language
                      )}
                      % {labels.offText}
                    </span>
                    <span className="px-3.5 py-1.5 rounded-xl bg-fuchsia-600 text-white font-black text-xs sm:text-sm text-center">
                      {labels.tuitionDiscountBadge}{' '}
                      {localizeDigits(
                        admissionExtraConfig.siblingTuitionDiscountPercent,
                        language
                      )}
                      % {labels.offText}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Age Eligibility Chart + Required Documents Checklist */}
              <div className="lg:col-span-5 space-y-5">
                {/* Age Chart */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-200 dark:border-purple-800/70 p-5 shadow-sm">
                  <h3 className="text-base sm:text-lg font-extrabold text-[#2e0249] dark:text-white mb-3">
                    {localizeDynamicText(admissionExtraConfig.ageChartHeadingBn, language)}
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {admissionExtraConfig.ageEligibilityList.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-800/60 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs sm:text-sm font-extrabold text-[#2e0249] dark:text-white">
                            {localizeDynamicText(item.classNameBn, language)}
                          </div>
                          <div className="text-[11px] text-fuchsia-700 dark:text-amber-300 font-semibold">
                            {localizeDynamicText(item.stageBn, language)}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-[#2e0249] dark:bg-purple-700 text-white text-xs font-bold">
                          {localizeDynamicText(item.minAgeBn, language)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Required Documents */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-200 dark:border-purple-800/70 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <FileCheck2 className="w-5 h-5 text-fuchsia-600 dark:text-amber-300" />
                    <h3 className="text-base sm:text-lg font-extrabold text-[#2e0249] dark:text-white">
                      {localizeDynamicText(admissionExtraConfig.documentsHeadingBn, language)}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {admissionExtraConfig.requiredDocumentsBn.map((doc, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-purple-100 font-medium"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{localizeDynamicText(doc, language)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          ADDITIONAL COMPONENT 2: মাদ্রাসা প্রতিষ্ঠার প্রেক্ষাপট, লক্ষ্য-উদ্দেশ্য ও ইউনিফর্ম গাইড
          (Styled in Royal Purple, Fuchsia & Gold)
         ===================================================================== */}
      {showAboutContext && madrasahContextConfig.enabled && (
        <section
          id="madrasah-context"
          className="py-14 lg:py-20 bg-gradient-to-br from-[#f8f4ff] via-white to-[#f3e8ff] dark:from-[#120024] dark:via-[#1b0230] dark:to-[#2b0347] text-slate-900 dark:text-white border-b border-purple-200/80 dark:border-purple-800/50 transition-colors"
        >
          <div className="cii-container-section space-y-12">
            {/* Context & Philosophy Header */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/70 text-purple-900 dark:text-amber-300 text-xs font-extrabold border border-purple-200 dark:border-purple-600/40">
                  <Compass className="w-3.5 h-3.5 text-fuchsia-600 dark:text-amber-300" />
                  <span>{localizeDynamicText(madrasahContextConfig.badgeBn, language)}</span>
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2e0249] dark:text-white">
                  {localizeDynamicText(madrasahContextConfig.headingBn, language)}
                </h2>
                <div className="space-y-3 text-sm sm:text-base text-slate-700 dark:text-purple-100 leading-relaxed font-medium">
                  {localizeParagraphs(madrasahContextConfig.paragraphsBn).map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>

                {/* Approach Card + e-Prospectus Button */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-white/5 border border-purple-200 dark:border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 shadow-sm">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-purple-800 dark:text-amber-300">
                      {localizeDynamicText(madrasahContextConfig.approachTitleBn, language)}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-purple-200 mt-1">
                      {language === 'bn'
                        ? madrasahContextConfig.approachSummaryBn
                        : language === 'ar'
                          ? 'التعليم التفاعلي داخل الفصل مع المتابعة اليومية للواجبات والتربية الأخلاقية المستمرة.'
                          : 'Interactive in-class mastery with daily lesson completion and continuous moral Tarbiyah.'}
                    </p>
                  </div>
                  <a
                    href={madrasahContextConfig.prospectusUrl || '/assets/maharat/maharat-prospectus-2026.pdf'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2e0249] to-[#6b21a8] text-white hover:from-[#3b0764] hover:to-[#7e22ce] text-xs sm:text-sm font-bold shrink-0 transition-all shadow-md"
                  >
                    <FileDown className="w-4 h-4 text-amber-300" />
                    <span>{labels.eProspectus}</span>
                  </a>
                </div>

                {/* Official Approach Infographic Image if present */}
                {madrasahContextConfig.approachImageUrl && (
                  <div className="rounded-2xl overflow-hidden border border-purple-200 dark:border-purple-500/30 bg-white dark:bg-slate-900 p-3 shadow-xs">
                    <img
                      src={madrasahContextConfig.approachImageUrl}
                      alt={localizeDynamicText(madrasahContextConfig.approachTitleBn, language)}
                      loading="lazy"
                      className="w-full max-h-72 object-contain mx-auto rounded-xl"
                    />
                  </div>
                )}
              </div>

              {/* Mission & Objectives Box */}
              <div className="lg:col-span-5 bg-gradient-to-br from-[#2e0249] via-[#3b0764] to-[#4c0575] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-purple-400/30 space-y-4">
                <div className="flex items-center gap-2.5 text-amber-300">
                  <ShieldCheck className="w-6 h-6" />
                  <h3 className="text-lg sm:text-xl font-extrabold text-white">
                    {localizeDynamicText(madrasahContextConfig.objectivesTitleBn || madrasahContextConfig.missionTitleBn || '', language)}
                  </h3>
                </div>
                <ul className="space-y-3">
                  {localizeObjectives(madrasahContextConfig.objectivesListBn || madrasahContextConfig.missionPointsBn || []).map((obj, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-purple-100 leading-relaxed"
                    >
                      <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Honorable Chairman & Acting Principal Messages from maharatmadrasah.com */}
            {(madrasahContextConfig.chairmanNameBn || madrasahContextConfig.principalNameBn) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {madrasahContextConfig.chairmanNameBn && (
                  <div className="rounded-3xl bg-white dark:bg-white/5 border border-purple-200 dark:border-purple-500/30 p-6 sm:p-7 shadow-md flex flex-col justify-between gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 border-b border-purple-100 dark:border-purple-800/50 pb-4">
                        {madrasahContextConfig.chairmanImageUrl ? (
                          <img
                            src={madrasahContextConfig.chairmanImageUrl}
                            alt={madrasahContextConfig.chairmanNameBn}
                            loading="lazy"
                            className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-purple-500 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-purple-700 text-white flex items-center justify-center font-extrabold text-xl shrink-0">
                            C
                          </div>
                        )}
                        <div>
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/70 text-purple-900 dark:text-amber-300 text-[11px] font-extrabold mb-1">
                            {language === 'bn'
                              ? 'চেয়ারম্যানের বাণী'
                              : language === 'ar'
                                ? 'كلمة رئيس المؤسسة'
                                : 'Message from the Chairman'}
                          </span>
                          <h3 className="text-lg sm:text-xl font-extrabold text-[#2e0249] dark:text-white">
                            {localizeDynamicText(madrasahContextConfig.chairmanNameBn, language)}
                          </h3>
                          <p className="text-xs font-semibold text-fuchsia-700 dark:text-purple-200">
                            {localizeDynamicText(madrasahContextConfig.chairmanRoleBn || '', language)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-purple-100 leading-relaxed whitespace-pre-line">
                        {madrasahContextConfig.chairmanMessageBn}
                      </p>
                    </div>
                  </div>
                )}

                {madrasahContextConfig.principalNameBn && (
                  <div className="rounded-3xl bg-white dark:bg-white/5 border border-purple-200 dark:border-purple-500/30 p-6 sm:p-7 shadow-md flex flex-col justify-between gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 border-b border-purple-100 dark:border-purple-800/50 pb-4">
                        {madrasahContextConfig.principalImageUrl ? (
                          <img
                            src={madrasahContextConfig.principalImageUrl}
                            alt={madrasahContextConfig.principalNameBn}
                            loading="lazy"
                            className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-fuchsia-500 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-fuchsia-700 text-white flex items-center justify-center font-extrabold text-xl shrink-0">
                            P
                          </div>
                        )}
                        <div>
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/70 text-fuchsia-900 dark:text-amber-300 text-[11px] font-extrabold mb-1">
                            {language === 'bn'
                              ? 'ভারপ্রাপ্ত প্রিন্সিপালের বাণী'
                              : language === 'ar'
                                ? 'كلمة المدير بالإنابة'
                                : 'Message from the Acting Principal'}
                          </span>
                          <h3 className="text-lg sm:text-xl font-extrabold text-[#2e0249] dark:text-white">
                            {localizeDynamicText(madrasahContextConfig.principalNameBn, language)}
                          </h3>
                          <p className="text-xs font-semibold text-purple-700 dark:text-purple-200">
                            {localizeDynamicText(madrasahContextConfig.principalRoleBn || '', language)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-purple-100 leading-relaxed whitespace-pre-line">
                        {madrasahContextConfig.principalMessageBn}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Uniform Guide Section */}
            {uniformConfig.enabled && (
              <div className="bg-white dark:bg-white/5 border border-purple-200 dark:border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="max-w-2xl">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#2e0249] dark:text-white">
                    {localizeDynamicText(uniformConfig.headingBn, language)}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-purple-200 mt-1">
                    {localizeDynamicText(uniformConfig.subheadingBn, language)}
                  </p>
                </div>

                {uniformConfig.uniformImageUrl && (
                  <div className="rounded-2xl overflow-hidden border border-purple-200 dark:border-purple-700/50 bg-purple-50/40 dark:bg-slate-900/60 p-3">
                    <img
                      src={uniformConfig.uniformImageUrl}
                      alt={localizeDynamicText(uniformConfig.headingBn, language)}
                      loading="lazy"
                      className="w-full max-h-80 object-contain mx-auto rounded-xl"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Boys Uniform */}
                  <div className="p-5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60">
                    <h4 className="text-base font-extrabold text-[#2e0249] dark:text-amber-300 mb-3">
                      {localizeDynamicText(uniformConfig.boysTitleBn, language)}
                    </h4>
                    <ul className="space-y-2">
                      {uniformConfig.boysItemsBn.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-purple-100 font-medium"
                        >
                          <CheckCircle2 className="w-4 h-4 text-purple-700 dark:text-amber-300 shrink-0 mt-0.5" />
                          <span>{localizeDynamicText(item, language)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Girls Uniform */}
                  <div className="p-5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60">
                    <h4 className="text-base font-extrabold text-[#2e0249] dark:text-amber-300 mb-3">
                      {localizeDynamicText(uniformConfig.girlsTitleBn, language)}
                    </h4>
                    <ul className="space-y-2">
                      {uniformConfig.girlsItemsBn.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-purple-100 font-medium"
                        >
                          <CheckCircle2 className="w-4 h-4 text-fuchsia-600 dark:text-amber-300 shrink-0 mt-0.5" />
                          <span>{localizeDynamicText(item, language)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =====================================================================
          ADDITIONAL COMPONENT 3: অভিভাবক অভিযোগ ও পরামর্শ বক্স (Complain / Suggestion Box)
         ===================================================================== */}
      {showFeedbackBox && (
        <section
          id="guardian-feedback"
          className="py-14 lg:py-18 bg-slate-50 dark:bg-[#0d0118] text-slate-900 dark:text-white border-b border-purple-200/70 dark:border-purple-900/50 transition-colors"
        >
          <div className="cii-container-section">
            <div className="bg-gradient-to-br from-[#2e0249] via-[#3b0764] to-[#4c0575] text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-purple-400/30">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-5 space-y-3">
                  <div className="inline-flex items-center gap-2 text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                    <MessageSquareWarning className="w-4 h-4" />
                    <span>{labels.feedbackBadge}</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {labels.feedbackTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-purple-100 leading-relaxed">
                    {labels.feedbackSub}
                  </p>
                  {complaintSubmitted && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm font-bold">
                      {labels.feedbackSuccess}
                    </div>
                  )}
                  {complaintError && (
                    <div role="alert" className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-400/60 text-rose-100 text-xs sm:text-sm font-bold">
                      {complaintError}
                    </div>
                  )}
                </div>

                <form
                  onSubmit={handleComplaintSubmit}
                  className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5"
                >
                  <div>
                    <label className="block text-xs font-bold text-purple-200 mb-1">
                      {labels.guardianName}
                    </label>
                    <input
                      type="text"
                      required
                      value={complaintForm.guardianName}
                      onChange={(e) =>
                        setComplaintForm({ ...complaintForm, guardianName: e.target.value })
                      }
                      placeholder={labels.guardianNamePh}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-200/50 text-xs sm:text-sm focus:outline-none focus:border-amber-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-purple-200 mb-1">
                      {labels.mobileNo}
                    </label>
                    <input
                      type="tel"
                      required
                      value={complaintForm.phone}
                      onChange={(e) =>
                        setComplaintForm({ ...complaintForm, phone: e.target.value })
                      }
                      placeholder="01XXXXXXXXX"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-200/50 text-xs sm:text-sm focus:outline-none focus:border-amber-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-purple-200 mb-1">
                      {labels.studentName}
                    </label>
                    <input
                      type="text"
                      value={complaintForm.studentName}
                      onChange={(e) =>
                        setComplaintForm({ ...complaintForm, studentName: e.target.value })
                      }
                      placeholder={labels.studentNamePh}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-200/50 text-xs sm:text-sm focus:outline-none focus:border-amber-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-purple-200 mb-1">
                      {labels.studentClass}
                    </label>
                    <input
                      type="text"
                      value={complaintForm.studentClass}
                      onChange={(e) =>
                        setComplaintForm({ ...complaintForm, studentClass: e.target.value })
                      }
                      placeholder={labels.studentClassPh}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-200/50 text-xs sm:text-sm focus:outline-none focus:border-amber-300"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-purple-200 mb-1">
                      {labels.topicType}
                    </label>
                    <select
                      value={complaintForm.category}
                      onChange={(e) =>
                        setComplaintForm({
                          ...complaintForm,
                          category: e.target.value as GuardianComplaintItem['category'],
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#24023d] border border-white/20 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-300"
                    >
                      <option value="পরামর্শ (Suggestion)">
                        {language === 'ar'
                          ? 'اقتراح وتطوير (Suggestion)'
                          : language === 'en'
                            ? 'Suggestion & Feedback'
                            : 'পরামর্শ (Suggestion)'}
                      </option>
                      <option value="একাডেমিক (Academic)">
                        {language === 'ar'
                          ? 'الشؤون الأكاديمية (Academic)'
                          : language === 'en'
                            ? 'Academic Affairs'
                            : 'একাডেমিক (Academic)'}
                      </option>
                      <option value="পরিবহন (Transport)">
                        {language === 'ar'
                          ? 'النقل المدرسي (Transport)'
                          : language === 'en'
                            ? 'School Transport'
                            : 'পরিবহন (Transport)'}
                      </option>
                      <option value="ডে-কেয়ার ও খাবার (Day-Care & Food)">
                        {language === 'ar'
                          ? 'الرعاية النهارية والوجبات (Day-Care & Food)'
                          : language === 'en'
                            ? 'Day-Care & Meals'
                            : 'ডে-কেয়ার ও খাবার (Day-Care & Food)'}
                      </option>
                      <option value="অন্যান্য (Other)">
                        {language === 'ar'
                          ? 'أخرى (Other)'
                          : language === 'en'
                            ? 'Other'
                            : 'অন্যান্য (Other)'}
                      </option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-purple-200 mb-1">
                      {labels.msgLabel}
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={complaintForm.message}
                      onChange={(e) =>
                        setComplaintForm({ ...complaintForm, message: e.target.value })
                      }
                      placeholder={labels.msgPh}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-200/50 text-xs sm:text-sm focus:outline-none focus:border-amber-300"
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-extrabold text-xs sm:text-sm cursor-pointer transition-all shadow-lg"
                    >
                      <Send className="w-4 h-4" />
                      <span>{labels.submitFeedbackBtn}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
