import React, { useState } from 'react';
import {
  Calendar,
  GraduationCap,
  Mail,
  Phone,
  Printer,
  Send,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import { isValidEmail, isValidPhone } from '../utils/contactValidation';
import { localizeDynamicText } from '../utils/i18nContent';

interface RegistrationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  inlineMode?: boolean;
}

const REG_COPY = {
  bn: {
    errStudentName: 'অনুগ্রহ করে শিক্ষার্থীর পূর্ণ নাম লিখুন।',
    errGuardianName: 'অভিভাবকের নাম উল্লেখ করুন।',
    errPhone: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)।',
    errEmail: 'সঠিক ইমেইল ঠিকানা দিন যাতে আমরা আপনাকে নিশ্চিতকরণ বার্তা পাঠাতে পারি।',
    letterheadBadge: 'প্রতিষ্ঠানের অফিসিয়াল প্যাড · Official Registration Receipt',
    statusConfirmed: 'স্ট্যাটাস: রেজিস্ট্রেশন সম্পন্ন (Confirmed)',
    studentNameLabel: 'শিক্ষার্থীর নাম:',
    guardianRelLabel: 'অভিভাবকের নাম ও সম্পর্ক:',
    phoneEmailLabel: 'মোবাইল ও ইমেইল:',
    deptClassAccLabel: 'বিভাগ, শ্রেণি ও আবাসন:',
    campusAddrLabel: 'ক্যাম্পাস ঠিকানা:',
    hotlineLabel: 'হটলাইন:',
    emailLabel: 'ইমেইল:',
    websiteLabel: 'ওয়েবসাইট:',
    printReceiptBtn: 'অফিসিয়াল রিসিট প্রিন্ট করুন (A4)',
    anotherRegBtn: 'আরেকটি রেজিস্ট্রেশন করুন',
    closeModalBtn: 'পর্দা বন্ধ করুন',
    sec1Title: '১. শিক্ষার্থীর তথ্য (Student Details)',
    studentNameInputLabel: 'শিক্ষার্থীর নাম (পূর্ণ নাম) *',
    studentNamePlaceholder: 'যেমন: মুহাম্মদ আব্দুল্লাহ',
    deptSelectLabel: 'বিভাগ নির্বাচন করুন *',
    deptAcademicBtn: 'একাডেমিক বিভাগ',
    deptHifzBtn: 'হিফজুল কুরআন বিভাগ',
    targetClassLabel: 'কাঙ্ক্ষিত শ্রেণি বা শাখা *',
    accommodationLabel: 'পছন্দের আবাসন ব্যবস্থা *',
    sec2Title: '২. অভিভাবকের তথ্য ও যোগাযোগ (Guardian Information)',
    guardianNameLabel: 'অভিভাবকের পূর্ণ নাম *',
    guardianNamePlaceholder: 'যেমন: মো. রফিকুল ইসলাম',
    relationLabel: 'সম্পর্ক *',
    phoneInputLabel: 'মোবাইল নম্বর (Phone / WhatsApp) *',
    emailInputLabel: 'ইমেইল ঠিকানা (Email) *',
    sec3Title: '৩. ক্যাম্পাস পরিদর্শন ও জিজ্ঞাসা (Campus Visit & Notes)',
    visitDateLabel: 'ক্যাম্পাস পরিদর্শনের সম্ভাব্য তারিখ',
    visitHoursNote: 'ক্যাম্পাস খোলা: প্রতিদিন সকাল ৮:০০টা হতে বিকাল ৫:০০টা পর্যন্ত',
    notesLabel: 'কোনো বিশেষ জিজ্ঞাসা বা নোট',
    notesPlaceholder: 'ভর্তি ফি, বৃত্তি বা স্পেশাল নিড সংক্রান্ত কোনো মন্তব্য থাকলে লিখুন...',
    leadNote: '* তথ্য সাবমিট করার সাথে সাথে প্রতিষ্ঠানের অ্যাডমিন ড্যাশবোর্ডে লিড সংযুক্ত হবে।',
    submitBtn: 'অনলাইন রেজিস্ট্রেশন সাবমিট করুন',
    academicClasses: [
      { value: 'প্রি-ওয়ান (নার্সারি)', label: 'প্রি-ওয়ান (নার্সারি)' },
      { value: 'প্রথম শ্রেণি', label: 'প্রথম শ্রেণি (Class 1)' },
      { value: 'দ্বিতীয় শ্রেণি', label: 'দ্বিতীয় শ্রেণি (Class 2)' },
      { value: 'তৃতীয় শ্রেণি', label: 'তৃতীয় শ্রেণি (Class 3)' },
      { value: 'চতুর্থ শ্রেণি', label: 'চতুর্থ শ্রেণি (Class 4)' },
      { value: 'পঞ্চম শ্রেণি', label: 'পঞ্চম শ্রেণি (Class 5)' },
      { value: 'ষষ্ঠ শ্রেণি', label: 'ষষ্ঠ শ্রেণি (Class 6)' },
      { value: 'সপ্তম শ্রেণি', label: 'সপ্তম শ্রেণি (Class 7)' },
      { value: 'অষ্টম শ্রেণি', label: 'অষ্টম শ্রেণি (Class 8)' },
    ],
    hifzClasses: [
      { value: 'নূরানী ও মাখরাজ', label: 'নূরানী ও মাখরাজ বিভাগ' },
      { value: 'নাযেরা কুরআন', label: 'নাযেরা কুরআন বিভাগ' },
      { value: 'হিফজুল কুরআন', label: 'হিফজুল কুরআন পূর্ণাঙ্গ বিভাগ' },
      { value: 'শুনানী বিভাগ', label: 'শুনানী ও ইয়াদ বিভাগ' },
    ],
    accommodations: [
      { value: 'অনাবাসিক' as const, label: 'অনাবাসিক (Non-Residential)' },
      { value: 'আবাসিক' as const, label: 'আবাসিক ব্যবস্থা - ৩ বেলা খাবার ও সার্বক্ষণিক যত্ন সহ' },
      { value: 'ডে-কেয়ার' as const, label: 'ডে-কেয়ার সুবিধা (সকাল ৮টা থেকে রাত ৮টা)' },
    ],
    relations: [
      { value: 'পিতা', label: 'পিতা' },
      { value: 'মাতা', label: 'মাতা' },
      { value: 'বড় ভাই', label: 'বড় ভাই' },
      { value: 'চাচা / মামা', label: 'চাচা / মামা' },
      { value: 'আইনগত অভিভাবক', label: 'আইনগত অভিভাবক' },
    ],
  },
  en: {
    errStudentName: "Please enter the student's full name.",
    errGuardianName: "Please enter the guardian's name.",
    errPhone: 'Please enter a valid 11-digit mobile number (e.g., 01XXXXXXXXX).',
    errEmail: 'Please provide a valid email address for confirmation.',
    letterheadBadge: 'Official Institute Letterhead · Registration Receipt',
    statusConfirmed: 'Status: Registration Confirmed',
    studentNameLabel: 'Student Name:',
    guardianRelLabel: 'Guardian & Relation:',
    phoneEmailLabel: 'Mobile & Email:',
    deptClassAccLabel: 'Department, Grade & Care:',
    campusAddrLabel: 'Campus Address:',
    hotlineLabel: 'Hotline:',
    emailLabel: 'Email:',
    websiteLabel: 'Website:',
    printReceiptBtn: 'Print Official Receipt (A4)',
    anotherRegBtn: 'Submit Another Registration',
    closeModalBtn: 'Close Window',
    sec1Title: '1. Student Information',
    studentNameInputLabel: 'Student Full Name *',
    studentNamePlaceholder: 'e.g., Muhammad Abdullah',
    deptSelectLabel: 'Select Department *',
    deptAcademicBtn: 'Academic Department',
    deptHifzBtn: 'Hifzul Quran Department',
    targetClassLabel: 'Preferred Grade / Track *',
    accommodationLabel: 'Preferred Care Mode *',
    sec2Title: '2. Guardian & Contact Information',
    guardianNameLabel: 'Guardian Full Name *',
    guardianNamePlaceholder: 'e.g., Md. Rafiqul Islam',
    relationLabel: 'Relation *',
    phoneInputLabel: 'Mobile Number (Phone / WhatsApp) *',
    emailInputLabel: 'Email Address *',
    sec3Title: '3. Campus Visit & Special Notes',
    visitDateLabel: 'Preferred Campus Visit Date',
    visitHoursNote: 'Campus Visiting Hours: Daily 8:00 AM to 5:00 PM',
    notesLabel: 'Special Inquiry or Notes',
    notesPlaceholder: 'Write any questions regarding tuition fees, scholarships, or student care...',
    leadNote: '* Upon submission, your inquiry is immediately logged in the Institute Admin Dashboard.',
    submitBtn: 'Submit Online Registration',
    academicClasses: [
      { value: 'প্রি-ওয়ান (নার্সারি)', label: 'Pre-One (Nursery)' },
      { value: 'প্রথম শ্রেণি', label: 'Class 1 (Grade 1)' },
      { value: 'দ্বিতীয় শ্রেণি', label: 'Class 2 (Grade 2)' },
      { value: 'তৃতীয় শ্রেণি', label: 'Class 3 (Grade 3)' },
      { value: 'চতুর্থ শ্রেণি', label: 'Class 4 (Grade 4)' },
      { value: 'পঞ্চম শ্রেণি', label: 'Class 5 (Grade 5)' },
      { value: 'ষষ্ঠ শ্রেণি', label: 'Class 6 (Grade 6)' },
      { value: 'সপ্তম শ্রেণি', label: 'Class 7 (Grade 7)' },
      { value: 'অষ্টম শ্রেণি', label: 'Class 8 (Grade 8)' },
    ],
    hifzClasses: [
      { value: 'নূরানী ও মাখরাজ', label: 'Noorani & Makhraj Track' },
      { value: 'নাযেরা কুরআন', label: 'Nazera Quran Track' },
      { value: 'হিফজুল কুরআন', label: 'Full Hifzul Quran Track' },
      { value: 'শুনানী বিভাগ', label: 'Shunani & Revision Track' },
    ],
    accommodations: [
      { value: 'অনাবাসিক' as const, label: 'Non-Residential (Day Scholar)' },
      { value: 'আবাসিক' as const, label: 'Residential — Full Board & 24/7 Care' },
      { value: 'ডে-কেয়ার' as const, label: 'Full-Day Care (8:00 AM – 8:00 PM)' },
    ],
    relations: [
      { value: 'পিতা', label: 'Father' },
      { value: 'মাতা', label: 'Mother' },
      { value: 'বড় ভাই', label: 'Elder Brother' },
      { value: 'চাচা / মামা', label: 'Uncle' },
      { value: 'আইনগত অভিভাবক', label: 'Legal Guardian' },
    ],
  },
  ar: {
    errStudentName: 'يرجى إدخال الاسم الكامل للطالب.',
    errGuardianName: 'يرجى إدخال اسم ولي الأمر.',
    errPhone: 'يرجى إدخال رقم هاتف صحيح مكون من ١١ رقماً.',
    errEmail: 'يرجى إدخال بريد إلكتروني صحيح لإرسال التأكيد.',
    letterheadBadge: 'الورق الرسمي للمعهد · إيصال التسجيل المبدئي',
    statusConfirmed: 'الحالة: تم تأكيد التسجيل بنجاح',
    studentNameLabel: 'اسم الطالب:',
    guardianRelLabel: 'ولي الأمر وصلة القرابة:',
    phoneEmailLabel: 'الهاتف والبريد الإلكتروني:',
    deptClassAccLabel: 'القسم والصف ونوع الإقامة:',
    campusAddrLabel: 'عنوان المعهد:',
    hotlineLabel: 'الخط الساخن:',
    emailLabel: 'البريد الإلكتروني:',
    websiteLabel: 'الموقع الرسمي:',
    printReceiptBtn: 'طباعة الإيصال الرسمي (A4)',
    anotherRegBtn: 'إرسال طلب تسجيل آخر',
    closeModalBtn: 'إغلاق النافذة',
    sec1Title: '١. بيانات الطالب الأساسية',
    studentNameInputLabel: 'الاسم الكامل للطالب *',
    studentNamePlaceholder: 'مثال: محمد عبد الله',
    deptSelectLabel: 'اختر القسم *',
    deptAcademicBtn: 'القسم الأكاديمي',
    deptHifzBtn: 'قسم تحفيظ القرآن الكريم',
    targetClassLabel: 'الصف أو المرحلة المطلوبة *',
    accommodationLabel: 'نظام الإقامة المفضل *',
    sec2Title: '٢. بيانات ولي الأمر والتواصل',
    guardianNameLabel: 'الاسم الكامل لولي الأمر *',
    guardianNamePlaceholder: 'مثال: محمد رفيق الإسلام',
    relationLabel: 'صلة القرابة *',
    phoneInputLabel: 'رقم الهاتف / واتساب *',
    emailInputLabel: 'البريد الإلكتروني *',
    sec3Title: '٣. موعد زيارة المعهد والملاحظات',
    visitDateLabel: 'التاريخ المقترح لزيارة المعهد',
    visitHoursNote: 'مواعيد الزيارة: يومياً من الساعة ٨:٠٠ صباحاً حتى ٥:٠٠ مساءً',
    notesLabel: 'استفسارات أو ملاحظات خاصة',
    notesPlaceholder: 'اكتب أي استفسار حول الرسوم أو المنح أو الرعاية الخاصة...',
    leadNote: '* يتم تسجيل طلبك فوراً في لوحة تحكم الإدارة للتواصل السريع.',
    submitBtn: 'إرسال طلب التسجيل الإلكتروني',
    academicClasses: [
      { value: 'প্রি-ওয়ান (নার্সারি)', label: 'الروضة والتمهيدي (Pre-One)' },
      { value: 'প্রথম শ্রেণি', label: 'الصف الأول (Class 1)' },
      { value: 'দ্বিতীয় শ্রেণি', label: 'الصف الثاني (Class 2)' },
      { value: 'তৃতীয় শ্রেণি', label: 'الصف الثالث (Class 3)' },
      { value: 'চতুর্থ শ্রেণি', label: 'الصف الرابع (Class 4)' },
      { value: 'পঞ্চম শ্রেণি', label: 'الصف الخامس (Class 5)' },
      { value: 'ষষ্ঠ শ্রেণি', label: 'الصف السادس (Class 6)' },
      { value: 'সপ্তম শ্রেণি', label: 'الصف السابع (Class 7)' },
      { value: 'অষ্টম শ্রেণি', label: 'الصف الثامن (Class 8)' },
    ],
    hifzClasses: [
      { value: 'নূরানী ও মাখরাজ', label: 'القاعدة النورانية وتصحيح المخارج' },
      { value: 'নাযেরা কুরআন', label: 'مرحلة الناظرة والتلاوة' },
      { value: 'হিফজুল কুরআন', label: 'مرحلة تحفيظ القرآن الكريم كاملاً' },
      { value: 'শুনানী বিভাগ', label: 'مرحلة التسميع والإتقان' },
    ],
    accommodations: [
      { value: 'অনাবাসিক' as const, label: 'غير مقيم (دوام نهاري)' },
      { value: 'আবাসিক' as const, label: 'سكن داخلي كامل مع الوجبات والرعاية' },
      { value: 'ডে-কেয়ার' as const, label: 'رعاية نهارية شاملة (٨:٠٠ ص – ٨:٠٠ م)' },
    ],
    relations: [
      { value: 'পিতা', label: 'الأب' },
      { value: 'মাতা', label: 'الأم' },
      { value: 'বড় ভাই', label: 'الأخ الأكبر' },
      { value: 'চাচা / মামা', label: 'العم / الخال' },
      { value: 'আইনগত অভিভাবক', label: 'الوصي القانوني' },
    ],
  },
} as const;

export const RegistrationFormModal: React.FC<RegistrationFormModalProps> = ({
  isOpen,
  onClose,
  inlineMode = false,
}) => {
  const { state, submitInquiry, language, t } = useCMS();
  const rc = REG_COPY[language];

  const [studentName, setStudentName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('পিতা');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState<'Academic' | 'Hifzul Quran'>('Academic');
  const [targetClass, setTargetClass] = useState('প্রি-ওয়ান (নার্সারি)');
  const [accommodation, setAccommodation] = useState<'অনাবাসিক' | 'আবাসিক' | 'ডে-কেয়ার'>(
    'অনাবাসিক'
  );
  const [campusVisitDate, setCampusVisitDate] = useState('');
  const [message, setMessage] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedLeadId, setSubmittedLeadId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen && !inlineMode) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!studentName.trim()) {
      setErrorMsg(rc.errStudentName);
      return;
    }
    if (!guardianName.trim()) {
      setErrorMsg(rc.errGuardianName);
      return;
    }
    if (!isValidPhone(phone)) {
      setErrorMsg(rc.errPhone);
      return;
    }
    if (!isValidEmail(email.trim())) {
      setErrorMsg(rc.errEmail);
      return;
    }

    setErrorMsg('');

    setIsSubmitting(true);
    const result = await submitInquiry({
      name: studentName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      courseId: department === 'Academic' ? 'course-prep-2' : 'course-hifz',
      message:
        message.trim() ||
        `রেজিস্ট্রেশন ফরম — অভিভাবক: ${guardianName} (${guardianRelation}), আবাসন: ${accommodation}`,
      source: 'Registration Form',
      guardianName: guardianName.trim(),
      guardianRelation,
      preferredDepartment: department,
      targetClass,
      preferredAccommodation: accommodation,
      campusVisitDate: campusVisitDate || 'আলোচনা সাপেক্ষে নির্ধারিত হবে',
      detailedData: {
        studentNameBn: studentName.trim(),
        studentNameEn: studentName.trim(),
        department,
        targetClass,
        academicCategory: accommodation,
        fatherNameBn: guardianRelation === 'পিতা' ? guardianName.trim() : undefined,
        motherNameBn: guardianRelation === 'মাতা' ? guardianName.trim() : undefined,
        guardianNameBn: guardianName.trim(),
        guardianRelation,
        guardianMobile: phone.trim(),
        fatherMobile: phone.trim(),
      },
    });

    setIsSubmitting(false);
    // The confirmation is shown only once the server has stored the registration.
    if (!result.ok) {
      setErrorMsg(result.error);
      return;
    }
    setSubmittedLeadId(result.leadId);
    setIsSuccess(true);
  };

  const handleResetForm = () => {
    setStudentName('');
    setGuardianName('');
    setPhone('');
    setEmail('');
    setMessage('');
    setCampusVisitDate('');
    setIsSuccess(false);
  };

  const modalBody = (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-purple-100 dark:border-purple-900/60 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.regSectionBadge}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {t.regSectionTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            {t.regSectionSubtitle}
          </p>
        </div>

        {!inlineMode && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Registration Modal"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isSuccess ? (
        <div className="space-y-5">
          <div className="official-letterhead-a4 rounded-2xl border-[3px] border-[#2e0249] p-4 sm:p-7 bg-white text-slate-900 shadow-lg">
            <div className="border border-[#c29438]/70 rounded-xl p-4 sm:p-6 space-y-5">
              {/* 1. Top Official Logo & Letterhead Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-4 border-b-2 border-[#2e0249]">
                {state.settings.logoUrl ? (
                  <img
                    src={state.settings.logoUrl}
                    alt={state.settings.instituteNameBn}
                    className="h-14 sm:h-16 w-auto max-w-[220px] object-contain shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full border-[3px] border-amber-600 bg-[#2e0249] text-white flex flex-col items-center justify-center shrink-0 shadow-sm">
                    <GraduationCap className="w-5 h-5 text-amber-300" />
                    <span className="text-[10px] font-extrabold tracking-wider text-amber-300 leading-none mt-0.5">
                      MMM
                    </span>
                  </div>
                )}
                <div className="flex-1 text-center sm:text-left rtl:sm:text-right space-y-1">
                  <div className="inline-block px-2.5 py-0.5 rounded bg-purple-100 text-[#2e0249] text-[10px] font-extrabold uppercase tracking-wider">
                    {rc.letterheadBadge} · EIIN: {state.settings.eiinNumber || '140630'} | Code: {state.settings.madrasahCode || '21023'}
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#2e0249]">
                    {language === 'bn' ? state.settings.instituteNameBn : t.instituteName}
                  </h3>
                  <div className="text-xs font-bold text-[#4c0575] uppercase">
                    {state.settings.instituteName}
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {localizeDynamicText(state.settings.address, language)} | {rc.hotlineLabel}{' '}
                    {localizeDynamicText(state.settings.phonePrimary, language)}
                  </p>
                </div>
              </div>

              {/* 2. Reference ID & Status */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-600">
                <span>
                  Registration Reference ID:{' '}
                  <strong className="font-mono text-purple-900">{submittedLeadId}</strong>
                </span>
                <span className="text-emerald-700 font-bold">{rc.statusConfirmed}</span>
              </div>

              {/* 3. Content Block within A4 Margins */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-xs">
                <div>
                  <span className="text-slate-500">{rc.studentNameLabel}</span>{' '}
                  <strong className="text-slate-900">{studentName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">{rc.guardianRelLabel}</span>{' '}
                  <strong className="text-slate-900">
                    {guardianName} ({guardianRelation})
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">{rc.phoneEmailLabel}</span>{' '}
                  <strong className="text-slate-900">
                    {phone} · {email}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">{rc.deptClassAccLabel}</span>{' '}
                  <strong className="text-purple-950">
                    {department} — {targetClass} ({accommodation})
                  </strong>
                </div>
              </div>

              {/* 4. Styled Footer Containing Institute Address and Contact Details */}
              <div className="pt-3 border-t-2 border-[#2e0249] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10.5px] text-slate-600">
                <div>
                  <strong>{rc.campusAddrLabel}</strong>{' '}
                  {localizeDynamicText(state.settings.address, language)} |{' '}
                  <strong>{rc.hotlineLabel}</strong>{' '}
                  {localizeDynamicText(state.settings.phonePrimary, language)}
                </div>
                <div>
                  <strong>{rc.emailLabel}</strong> {state.settings.email} |{' '}
                  <strong>{rc.websiteLabel}</strong> maharatmadrasah.com
                </div>
              </div>
            </div>
          </div>

          <div className="no-print pt-2 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>{rc.printReceiptBtn}</span>
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs cursor-pointer shadow-sm"
            >
              {rc.anotherRegBtn}
            </button>
            {!inlineMode && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs cursor-pointer"
              >
                {rc.closeModalBtn}
              </button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          {/* Section 1: Student Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider">
              <User className="w-4 h-4 text-purple-600" />
              <span>{rc.sec1Title}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {rc.studentNameInputLabel}
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder={rc.studentNamePlaceholder}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {rc.deptSelectLabel}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDepartment('Academic');
                      setTargetClass('প্রি-ওয়ান (নার্সারি)');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                      department === 'Academic'
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {rc.deptAcademicBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDepartment('Hifzul Quran');
                      setTargetClass('নূরানী ও মাখরাজ');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                      department === 'Hifzul Quran'
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {rc.deptHifzBtn}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {rc.targetClassLabel}
                </label>
                <select
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                >
                  {(department === 'Academic' ? rc.academicClasses : rc.hifzClasses).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {rc.accommodationLabel}
                </label>
                <select
                  value={accommodation}
                  onChange={(e) =>
                    setAccommodation(e.target.value as 'অনাবাসিক' | 'আবাসিক' | 'ডে-কেয়ার')
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                >
                  {rc.accommodations.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Guardian Information */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider">
              <Users className="w-4 h-4 text-purple-600" />
              <span>{rc.sec2Title}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {rc.guardianNameLabel}
                </label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder={rc.guardianNamePlaceholder}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {rc.relationLabel}
                </label>
                <select
                  value={guardianRelation}
                  onChange={(e) => setGuardianRelation(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                >
                  {rc.relations.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {rc.phoneInputLabel}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full pl-10 rtl:pl-3.5 rtl:pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {rc.emailInputLabel}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full pl-10 rtl:pl-3.5 rtl:pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Campus Visit Preference & Special Message */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>{rc.sec3Title}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {rc.visitDateLabel}
                </label>
                <input
                  type="date"
                  value={campusVisitDate}
                  onChange={(e) => setCampusVisitDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                  {rc.visitHoursNote}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {rc.notesLabel}
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={rc.notesPlaceholder}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">{rc.leadNote}</div>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-700 via-fuchsia-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{rc.submitBtn}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );

  if (inlineMode) {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 p-6 sm:p-8 shadow-xl">
        {modalBody}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-purple-200 dark:border-purple-800 overflow-hidden my-auto p-6 sm:p-8">
        {modalBody}
      </div>
    </div>
  );
};
