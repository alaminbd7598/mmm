import React, { useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Eye,
  FileText,
  Fingerprint,
  Globe,
  GraduationCap,
  Heart,
  Home,
  MapPin,
  Phone,
  Printer,
  Smartphone,
  Star,
  User,
  Users,
  X,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import { photoFileToDataUrl } from '../utils/imageResize';
import { AdmissionLead, DetailedAdmissionData } from '../types/cms';
import { findMatchingLeadByPhone, normalizePhoneNumber } from '../utils/cmsLogic';

interface AdmissionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCourseId?: string;
  initialDepartment?: string;
  initialClass?: string;
  initialCategory?: string;
  inlineMode?: boolean;
}

const STEPS = [
  { id: 1, label: 'Student', labelBn: 'শিক্ষার্থীর তথ্য', labelAr: 'بيانات الطالب', icon: User },
  { id: 2, label: 'Academic', labelBn: 'পূর্ববর্তী একাডেমিক তথ্য', labelAr: 'السجل الأكاديمي', icon: BookOpen },
  { id: 3, label: 'Parents', labelBn: 'অভিভাবকের তথ্য', labelAr: 'بيانات الوالدين', icon: Users },
  { id: 4, label: 'Family', labelBn: 'পারিবারিক পরিবেশ', labelAr: 'البيئة الأسرية', icon: Home },
  { id: 5, label: 'Behavior', labelBn: 'আচরণ ও দক্ষতা', labelAr: 'السلوك والمهارات', icon: Activity },
  { id: 6, label: 'Address', labelBn: 'ঠিকানা ও ডকুমেন্টস', labelAr: 'العنوان والمستندات', icon: MapPin },
];

const REQUIRED_DOCUMENTS = [
  'শিক্ষার্থীর পাসপোর্ট সাইজের ৪ কপি রঙিন ছবি',
  'শিক্ষার্থীর জন্ম নিবন্ধন সনদ',
  'পিতা-মাতার জাতীয় পরিচয়পত্রের ফটোকপি / পাসপোর্টের ফটোকপি',
  'মার্কশিট (প্রযোজ্য ক্ষেত্রে)',
  'ট্রান্সফার সার্টিফিকেট (প্রযোজ্য ক্ষেত্রে)',
  'চরিত্র সনদপত্র (প্রযোজ্য ক্ষেত্রে)',
];

const OCCUPATION_OPTIONS = [
  'ব্যবসায়ী (Business)',
  'বেসরকারি চাকরিজীবী (Private Service)',
  'সরকারি চাকরিজীবী (Govt. Service)',
  'শিক্ষক / অধ্যাপক (Teacher)',
  'ইঞ্জিনিয়ার (Engineer)',
  'ডাক্তার (Doctor)',
  'প্রবাসী (Expatriate)',
  'আলেম / ইমাম (Islamic Scholar)',
  'গৃহিণী (Homemaker)',
  'কৃষি (Agriculture)',
  'অন্যান্য (Other)',
];

export const AdmissionFormModal: React.FC<AdmissionFormModalProps> = ({
  isOpen,
  onClose,
  preselectedCourseId,
  initialDepartment,
  initialClass,
  initialCategory,
  inlineMode = false,
}) => {
  const { state, submitInquiry, language } = useCMS();
  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;
  const [step, setStep] = useState<number>(1);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [submittedEmailLogId, setSubmittedEmailLogId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFileName, setPhotoFileName] = useState<string>('No file chosen');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [studentEmail, setStudentEmail] = useState('applicant@maharatmadrasah.com');
  const [selectedCourseId] = useState(
    preselectedCourseId || state.courses[0]?.id || 'course-prep-2'
  );

  // Phone lookup for returning guardians with quick registration
  const [phoneLookupQuery, setPhoneLookupQuery] = useState('');
  const [matchedExistingLead, setMatchedExistingLead] = useState<AdmissionLead | null>(null);

  const handleLookupExistingRegistration = (phoneInput: string) => {
    setPhoneLookupQuery(phoneInput);
    const clean = normalizePhoneNumber(phoneInput);
    if (clean && clean.length >= 10) {
      const match = findMatchingLeadByPhone(state.leads, clean);
      setMatchedExistingLead(match || null);
    } else {
      setMatchedExistingLead(null);
    }
  };

  const handleApplyExistingLeadData = () => {
    if (!matchedExistingLead) return;
    const l = matchedExistingLead;
    setDetails((prev) => ({
      ...prev,
      studentNameBn: l.detailedData?.studentNameBn || l.name || prev.studentNameBn,
      studentNameEn: l.detailedData?.studentNameEn || l.name || prev.studentNameEn,
      fatherNameBn: l.detailedData?.fatherNameBn || l.guardianName || prev.fatherNameBn,
      fatherMobile: l.detailedData?.fatherMobile || l.phone || prev.fatherMobile,
      fatherWhatsapp: l.detailedData?.fatherWhatsapp || l.phone || prev.fatherWhatsapp,
      department: l.detailedData?.department || prev.department,
      targetClass: l.detailedData?.targetClass || prev.targetClass,
      academicCategory: l.detailedData?.academicCategory || prev.academicCategory,
      ...(l.detailedData ? l.detailedData : {}),
    }));
    if (l.email) setStudentEmail(l.email);
  };

  const [details, setDetails] = useState<DetailedAdmissionData>({
    studentPhotoUrl: '',
    studentNameBn: '',
    studentNameEn: '',
    dob: '2016-04-16',
    age: '10',
    gender: 'পুরুষ',
    department: initialDepartment || 'হিফজ বিভাগ',
    targetClass: initialClass || (initialDepartment === 'একাডেমিক বিভাগ' ? 'Pre One (Nursery)' : 'হিফয'),
    academicCategory: initialCategory || 'Non-Residential (অনাবাসিক)',
    session: '2027',
    nidOrBirthReg: '',
    bloodGroup: '',
    nationality: 'Bangladeshi',
    prevInstitute: '',
    prevClass: '',
    prevGpa: '',
    fatherNameBn: '',
    fatherNameEn: '',
    fatherOccupation: '',
    fatherEducation: '',
    fatherMobile: '',
    fatherWhatsapp: '',
    fatherWhatsappSame: false,
    motherNameBn: '',
    motherNameEn: '',
    motherOccupation: '',
    motherEducation: '',
    motherMobile: '',
    motherWhatsapp: '',
    motherWhatsappSame: false,
    guardianNameBn: '',
    guardianNameEn: '',
    guardianRelation: '',
    guardianMobile: '',
    guardianWhatsapp: '',
    guardianOccupation: '',
    guardianAddress: '',
    halalIncome: 'হ্যাঁ',
    regularPrayer: 'হ্যাঁ',
    drugAddictionInFamily: 'না',
    hasTelevision: 'না',
    quranRecitation: 'হ্যাঁ',
    purdahMaintenance: 'হ্যাঁ',
    mobileUsageHours: '',
    generalBehavior: 'অনেক ভালো',
    obeysParents: 'পুরোপুরি',
    behaviorWithElders: 'অনেক ভালো',
    behaviorWithYoungers: 'অনেক ভালো',
    liesOrStubborn: 'না',
    studyInterest: 'খুব আগ্রহী',
    religiousInterest: 'খুব আগ্রহী',
    angerControl: 'ভাল',
    permanentVillage: '',
    permanentPost: '',
    permanentPostCode: '',
    permanentThana: '',
    permanentDistrict: '',
    presentAddressSame: false,
    presentVillage: '',
    presentPost: '',
    presentPostCode: '',
    presentThana: '',
    presentDistrict: '',
    submittedDocuments: [...REQUIRED_DOCUMENTS],
    agreedToPledge: true,
  });

  if (!isOpen && !inlineMode) return null;

  const updateDetail = <K extends keyof DetailedAdmissionData>(
    key: K,
    value: DetailedAdmissionData[K]
  ) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFileName(file.name);
    // Large camera pictures are scaled down so the application is not refused for its size.
    void photoFileToDataUrl(file).then(
      (dataUrl) => updateDetail('studentPhotoUrl', dataUrl),
      () => undefined
    );
  };

  const handleDobChange = (dobValue: string) => {
    updateDetail('dob', dobValue);
    if (dobValue) {
      const birthYear = new Date(dobValue).getFullYear();
      const currentYear = new Date().getFullYear();
      if (!isNaN(birthYear) && currentYear >= birthYear) {
        updateDetail('age', String(currentYear - birthYear));
      }
    }
  };

  const handleFillSampleApplicant = () => {
    setStudentEmail('farhan.sadik@example.com');
    setPhotoFileName('student_portrait.jpg');
    setDetails({
      studentPhotoUrl: '',
      studentNameBn: 'ফারহান সাদিক',
      studentNameEn: 'Farhan Sadik',
      dob: '2015-05-12',
      age: '11',
      gender: 'পুরুষ',
      department: 'একাডেমিক বিভাগ',
      targetClass: 'Five',
      academicCategory: 'Residential (আবাসিক)',
      session: '2027',
      nidOrBirthReg: '20152541569910123',
      bloodGroup: 'B+',
      nationality: 'Bangladeshi',
      prevInstitute: 'মডেল একাডেমি স্কুল',
      prevClass: 'Class Four',
      prevGpa: '5.00',
      fatherNameBn: 'মোঃ কামরুল হাসান',
      fatherNameEn: 'Md. Kamrul Hasan',
      fatherOccupation: 'ব্যবসায়ী (Business)',
      fatherEducation: 'স্নাতকোত্তর (Masters)',
      fatherMobile: '01711998877',
      fatherWhatsapp: '01711998877',
      fatherWhatsappSame: true,
      motherNameBn: 'সুমাইয়া পারভীন',
      motherNameEn: 'Sumaiya Parvin',
      motherOccupation: 'গৃহিণী (Homemaker)',
      motherEducation: 'স্নাতক (B.A)',
      motherMobile: '01811998877',
      motherWhatsapp: '01811998877',
      motherWhatsappSame: true,
      guardianNameBn: '',
      guardianNameEn: '',
      guardianRelation: '',
      guardianMobile: '',
      guardianWhatsapp: '',
      guardianOccupation: '',
      guardianAddress: '',
      halalIncome: 'হ্যাঁ',
      regularPrayer: 'হ্যাঁ',
      drugAddictionInFamily: 'না',
      hasTelevision: 'না',
      quranRecitation: 'হ্যাঁ',
      purdahMaintenance: 'হ্যাঁ',
      mobileUsageHours: 'দৈনিক ৩০ মিনিট শিক্ষামূলক প্রোগ্রাম দেখে',
      generalBehavior: 'অনেক ভালো',
      obeysParents: 'পুরোপুরি',
      behaviorWithElders: 'অনেক ভালো',
      behaviorWithYoungers: 'অনেক ভালো',
      liesOrStubborn: 'না',
      studyInterest: 'খুব আগ্রহী',
      religiousInterest: 'খুব আগ্রহী',
      angerControl: 'ভাল',
      permanentVillage: 'হীরাঝিল আবাসিক এলাকা',
      permanentPost: 'সিদ্ধিরগঞ্জ',
      permanentPostCode: '1430',
      permanentThana: 'সিদ্ধিরগঞ্জ',
      permanentDistrict: 'নারায়ণগঞ্জ',
      presentAddressSame: true,
      presentVillage: 'হীরাঝিল আবাসিক এলাকা',
      presentPost: 'সিদ্ধিরগঞ্জ',
      presentPostCode: '1430',
      presentThana: 'সিদ্ধিরগঞ্জ',
      presentDistrict: 'নারায়ণগঞ্জ',
      submittedDocuments: [...REQUIRED_DOCUMENTS],
      agreedToPledge: true,
    });
    setErrorMsg('');
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!details.studentNameBn?.trim() && !details.studentNameEn?.trim()) {
        setErrorMsg(
          tr(
            'অনুগ্রহ করে শিক্ষার্থীর নাম (বাংলা অথবা ইংরেজি) পূরণ করুন।',
            'Please enter the student name (in Bengali or English).',
            'يرجى إدخال اسم الطالب (بالبنغالية أو الإنجليزية).'
          )
        );
        return;
      }
      if (!details.gender) {
        setErrorMsg(
          tr(
            'অনুগ্রহ করে লিঙ্গ নির্বাচন করুন।',
            'Please select the student gender.',
            'يرجى تحديد الجنس.'
          )
        );
        return;
      }
      if (!details.department || !details.targetClass) {
        setErrorMsg(
          tr(
            'অনুগ্রহ করে বিভাগ এবং যে শ্রেণিতে ভর্তি হতে আগ্রহী তা নির্বাচন করুন।',
            'Please select both the department and target class.',
            'يرجى اختيار القسم والصف الدراسي المطلوب.'
          )
        );
        return;
      }
    }
    if (step === 3) {
      if (!details.fatherNameBn?.trim() && !details.fatherNameEn?.trim()) {
        setErrorMsg(
          tr(
            'অনুগ্রহ করে পিতার নাম পূরণ করুন।',
            'Please enter the father name.',
            'يرجى إدخال اسم الأب.'
          )
        );
        return;
      }
      if (!details.fatherMobile?.trim()) {
        setErrorMsg(
          tr(
            'অনুগ্রহ করে পিতার মোবাইল নম্বর প্রদান করুন।',
            'Please enter the father mobile number.',
            'يرجى إدخال رقم هاتف الأب.'
          )
        );
        return;
      }
    }
    if (step === 6) {
      if (!details.permanentVillage?.trim() || !details.permanentThana?.trim() || !details.permanentDistrict?.trim()) {
        setErrorMsg(
          tr(
            'অনুগ্রহ করে স্থায়ী ঠিকানার গ্রাম/এলাকা, থানা এবং জেলা পূরণ করুন।',
            'Please complete the permanent address (Village/Area, Thana, and District).',
            'يرجى إكمال العنوان الدائم (القرية/المنطقة، المركز، والمحافظة).'
          )
        );
        return;
      }
      if (!details.agreedToPledge) {
        setErrorMsg(
          tr(
            'অনুগ্রহ করে অঙ্গীকারনামায় সম্মতি প্রদান করুন।',
            'Please agree to the institutional pledge before proceeding.',
            'يرجى الموافقة على التعهد المؤسسي قبل المتابعة.'
          )
        );
        return;
      }
      setErrorMsg('');
      setIsPreviewMode(true);
      return;
    }
    setErrorMsg('');
    setStep((prev) => Math.min(6, prev + 1));
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    const finalName =
      details.studentNameBn && details.studentNameEn
        ? `${details.studentNameBn} (${details.studentNameEn})`
        : details.studentNameBn || details.studentNameEn || 'New Applicant';
    const finalPhone = details.fatherMobile || details.motherMobile || '01604-858100';

    const matchedCourse =
      details.department === 'হিফজ বিভাগ'
        ? state.courses.find((c) => c.category === 'Hifzul Quran')?.id
        : state.courses.find((c) => c.category === 'Academic')?.id;

    setIsSubmitting(true);
    const result = await submitInquiry({
      name: finalName,
      phone: finalPhone,
      email: studentEmail.trim() || 'online-admission@maharatmadrasah.com',
      courseId: matchedCourse || selectedCourseId || state.courses[0]?.id || 'course-prep-2',
      message: `বিভাগ: ${details.department} | শ্রেণি: ${details.targetClass} | ক্যাটাগরি: ${details.academicCategory} | সেশন: ${details.session}`,
      source: 'Full Admission Form',
      detailedData: details,
    });

    setIsSubmitting(false);
    setIsPreviewMode(false);
    // The receipt is shown only once the server has stored the application; otherwise the form
    // returns to its last step with the reason, keeping everything that was typed.
    if (!result.ok) {
      setErrorMsg(result.error);
      return;
    }
    setErrorMsg('');
    setSubmittedEmailLogId(result.leadId);
  };

  const handlePrintAdmissionReceipt = () => {
    window.print();
  };

  const issueDateBn = new Date().toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const classOptions =
    details.department === 'হিফজ বিভাগ'
      ? ['নূরানী', 'নাযেরা', 'হিফয', 'শুনানী']
      : [
          'Pre One (Nursery)',
          'One',
          'Two',
          'Three',
          'Four (Boys)',
          'Four (Girls)',
          'Five',
          'Six',
          'Seven',
          'Eight',
        ];

  const renderChoiceGroup = (
    label: string,
    currentVal: string | undefined,
    options: string[],
    onSelect: (val: string) => void
  ) => (
    <div className="rounded-2xl bg-slate-50/90 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 p-4 sm:p-5 space-y-3">
      <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">{label}</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {options.map((opt) => {
          const active = currentVal === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onSelect(opt)}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                active
                  ? 'bg-[#7e22ce] border-[#7e22ce] text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-purple-400'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  const formContent = (
    <div className="w-full max-w-5xl mx-auto space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Banner Card */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#f3e7ff] via-[#e9d5ff] to-[#f5d0fe] dark:from-[#2e054e] dark:via-[#3b0764] dark:to-[#4c0575] border border-purple-200 dark:border-purple-700/50 shadow-xl overflow-hidden px-6 py-8 sm:px-10 sm:py-10 text-center">
        {/* Top Rainbow / Purple-Pink Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#ec4899] via-[#a855f7] to-[#6366f1]" />

        {/* Left Book Icon Box */}
        <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white dark:bg-white/10 shadow-md items-center justify-center text-[#6b21a8] dark:text-purple-200 absolute left-8 top-8">
          <BookOpen className="w-7 h-7" />
        </div>

        {/* Right Graduation Cap Icon Box */}
        <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white dark:bg-white/10 shadow-md items-center justify-center text-[#6b21a8] dark:text-purple-200 absolute right-8 bottom-6">
          <GraduationCap className="w-7 h-7" />
        </div>

        {/* Top Action Controls (Demo Auto-Fill & Close when Modal) */}
        <div className="flex items-center justify-end gap-2 mb-2 sm:mb-0">
          {!submittedEmailLogId && (
            <button
              type="button"
              onClick={handleFillSampleApplicant}
              className="px-3 py-1.5 rounded-xl bg-purple-700/15 hover:bg-purple-700/25 dark:bg-white/15 dark:hover:bg-white/25 text-purple-950 dark:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {tr('ডেমো তথ্য অটো-ফিল করুন', 'Auto-Fill Sample Applicant', 'تعبئة بيانات تجريبية')}
            </button>
          )}
          {!inlineMode && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Admission Form"
              className="p-2 rounded-xl bg-purple-900/10 hover:bg-purple-900/20 dark:bg-white/10 dark:hover:bg-white/20 text-purple-950 dark:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <h2
          id="admission-form-modal-title"
          className="text-3xl sm:text-5xl font-extrabold text-[#4c0575] dark:text-white tracking-tight"
        >
          {tr('ভর্তি ফরম', 'Online Admission Form', 'استمارة القبول الإلكترونية')}
        </h2>

        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/90 dark:bg-white/15 shadow-xs text-xs sm:text-sm font-bold text-[#581c87] dark:text-purple-100 mt-4">
          <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-300" />
          <span>
            {tr(
              'আগামীর আলোকিত ভবিষ্যতের সন্ধানে',
              'Towards an Enlightened Future — Session 2027',
              'نحو مستقبل مشرق ومتميز — العام الدراسي ٢٠٢٧'
            )}
          </span>
          <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-300" />
        </div>

        {/* Three Decorative Dots */}
        <div className="flex items-center justify-center gap-2 mt-5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#7e22ce]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#ec4899]" />
        </div>
      </div>

      {/* Main White / Dark Card Container */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {submittedEmailLogId ? (
          <div className="p-4 sm:p-8 space-y-6">
            {/* Formal Printable Official Letterhead Admission Receipt */}
            <div className="official-letterhead-a4 rounded-2xl border-[3px] border-[#2e0249] p-4 sm:p-7 bg-white text-slate-900 shadow-lg">
              <div className="border border-[#c29438]/70 rounded-xl p-4 sm:p-6 space-y-5">
                {/* 1. Official Institute Letterhead Header with Official Logo */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-4 border-b-2 border-[#2e0249]">
                  {state.settings.logoUrl ? (
                    <img
                      src={state.settings.logoUrl}
                      alt={state.settings.instituteNameBn}
                      className="h-16 sm:h-18 w-auto max-w-[240px] object-contain shrink-0"
                    />
                  ) : (
                    <div className="w-18 h-18 rounded-full border-[3px] border-amber-600 bg-[#2e0249] text-white flex flex-col items-center justify-center shrink-0 shadow-sm">
                      <GraduationCap className="w-6 h-6 text-amber-300" />
                      <span className="text-[11px] font-extrabold tracking-wider text-amber-300 leading-none mt-0.5">
                        MMM
                      </span>
                      <span className="text-[7px] font-semibold text-purple-200 tracking-widest mt-0.5">
                        EIIN 140630
                      </span>
                    </div>
                  )}
                  <div className="flex-1 text-center sm:text-left space-y-1 min-w-0">
                    <div className="inline-block px-2.5 py-0.5 rounded bg-purple-100 text-[#2e0249] text-[10px] font-extrabold uppercase tracking-wider">
                      প্রতিষ্ঠানের অফিসিয়াল প্যাড · EIIN: {state.settings.eiinNumber || '140630'} | Code: {state.settings.madrasahCode || '21023'}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-[#2e0249] leading-tight">
                      {state.settings.instituteNameBn}
                    </h3>
                    <div className="text-xs font-bold text-[#4c0575] uppercase tracking-wide">
                      {state.settings.instituteName}
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {state.settings.address} | হটলাইন: {state.settings.phonePrimary}, {state.settings.phoneSecondary}
                    </p>
                  </div>
                </div>

                {/* 2. Receipt Reference & Issue Date */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-600">
                  <span>
                    আবেদন রিসিট নং: <strong className="font-mono text-purple-900">{submittedEmailLogId}</strong>
                  </span>
                  <span>
                    তারিখ: <strong className="text-slate-900">{issueDateBn}</strong>
                  </span>
                </div>

                {/* 3. Title Banner */}
                <div className="rounded-lg bg-gradient-to-r from-[#2e0249] via-[#4c0575] to-[#2e0249] py-2 px-4 text-center text-white">
                  <div className="text-sm font-extrabold text-amber-300">
                    ভর্তি আবেদনের অফিসিয়াল প্রাপ্তিস্বীকার রিসিট (Admission Application Receipt)
                  </div>
                </div>

                {/* 4. Clearly Defined Content Block within A4 Margins */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-xs">
                  <div>
                    <span className="text-slate-500">শিক্ষার্থীর নাম (বাংলা):</span>{' '}
                    <strong className="text-slate-900">{details.studentNameBn || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Student Name (EN):</span>{' '}
                    <strong className="text-slate-900">{details.studentNameEn || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">বিভাগ ও শ্রেণি:</span>{' '}
                    <strong className="text-purple-950">
                      {details.department} — {details.targetClass}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">একাডেমিক ক্যাটাগরি ও সেশন:</span>{' '}
                    <strong className="text-slate-900">
                      {details.academicCategory} ({details.session})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">পিতার নাম ও মোবাইল:</span>{' '}
                    <strong className="text-slate-900">
                      {details.fatherNameBn || details.fatherNameEn} ({details.fatherMobile})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">বর্তমান আবেদন স্ট্যাটাস:</span>{' '}
                    <strong className="text-emerald-700">Submitted (প্রাথমিক যাচাইয়ের অপেক্ষায়)</strong>
                  </div>
                </div>

                {/* 5. Official Signatures */}
                <div className="grid grid-cols-3 gap-4 pt-6 pb-1 text-center text-[11px]">
                  <div className="border-t border-dashed border-slate-400 pt-1.5">
                    <div className="font-bold text-slate-800">অভিভাবকের স্বাক্ষর</div>
                  </div>
                  <div className="border-t border-dashed border-slate-400 pt-1.5">
                    <div className="font-bold text-slate-800">ভর্তি কর্মকর্তা</div>
                  </div>
                  <div className="border-t border-dashed border-slate-400 pt-1.5">
                    <div className="font-bold text-purple-950">অধ্যক্ষ / পরিচালক</div>
                  </div>
                </div>

                {/* 6. Styled Footer Containing Institute Address & Contact Details */}
                <div className="pt-3 border-t-2 border-[#2e0249] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10.5px] text-slate-600">
                  <div>
                    <strong>ঠিকানা:</strong> {state.settings.address} | <strong>মোবাইল:</strong>{' '}
                    {state.settings.phonePrimary}
                  </div>
                  <div>
                    <strong>ইমেইল:</strong> {state.settings.email} | <strong>ওয়েবসাইট:</strong>{' '}
                    maharatmadrasah.com
                  </div>
                </div>
              </div>
            </div>

            <div className="no-print flex flex-wrap justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrintAdmissionReceipt}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                <span>অফিসিয়াল রিসিট প্রিন্ট করুন (A4 Print)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmittedEmailLogId(null);
                  setStep(1);
                  if (!inlineMode) onClose();
                }}
                className="px-6 py-2.5 bg-[#7e22ce] hover:bg-[#6b21a8] text-white text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
              >
                নতুন আবেদন / হোমপেজে ফিরে যান
              </button>
            </div>
          </div>
        ) : isPreviewMode ? (
          /* Full All-View Preview on Official Letterhead before Final Submit */
          <div className="p-4 sm:p-8 space-y-6">
            <div className="official-letterhead-a4 rounded-2xl border-[3px] border-[#2e0249] p-4 sm:p-7 bg-white text-slate-900 shadow-lg space-y-5">
              {/* Letterhead Top Logo Placeholder & Institute Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 pb-4 border-b-2 border-[#2e0249]">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
                  {state.settings.logoUrl ? (
                    <img
                      src={state.settings.logoUrl}
                      alt={state.settings.instituteNameBn}
                      className="h-14 sm:h-16 w-auto max-w-[220px] object-contain shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full border-[3px] border-amber-600 bg-[#2e0249] text-white flex flex-col items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5 text-amber-300" />
                      <span className="text-[10px] font-extrabold text-amber-300 leading-none mt-0.5">
                        MMM
                      </span>
                    </div>
                  )}
                  <div className="text-center sm:text-left space-y-0.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-800">
                      প্রতিষ্ঠানের অফিসিয়াল প্যাড · EIIN: {state.settings.eiinNumber || '140630'} | Code: {state.settings.madrasahCode || '21023'}
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#2e0249]">
                      {state.settings.instituteNameBn}
                    </h3>
                    <p className="text-xs font-semibold text-slate-600">
                      {state.settings.address} · হটলাইন: {state.settings.phonePrimary}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(false)}
                  className="no-print px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
                >
                  &larr; তথ্য সংশোধন করুন
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-purple-900 text-sm mb-1">
                    ১. শিক্ষার্থীর তথ্য
                  </div>
                  <div>নাম (বাংলা): <strong>{details.studentNameBn || 'N/A'}</strong></div>
                  <div>Name (English): <strong>{details.studentNameEn || 'N/A'}</strong></div>
                  <div>জন্ম তারিখ ও বয়স: <strong>{details.dob} ({details.age} বছর)</strong></div>
                  <div>লিঙ্গ ও রক্তের গ্রুপ: <strong>{details.gender} · {details.bloodGroup || 'N/A'}</strong></div>
                  <div>বিভাগ ও শ্রেণি: <strong>{details.department} — {details.targetClass}</strong></div>
                  <div>একাডেমিক ক্যাটাগরি: <strong>{details.academicCategory} (সেশন: {details.session})</strong></div>
                  <div>জন্ম নিবন্ধন/NID: <strong>{details.nidOrBirthReg || 'N/A'}</strong></div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-purple-900 text-sm mb-1">
                    ২. পূর্ববর্তী একাডেমিক ও ৩. অভিভাবকের তথ্য
                  </div>
                  <div>পূর্ববর্তী প্রতিষ্ঠান: <strong>{details.prevInstitute || 'প্রযোজ্য নয়'} ({details.prevClass || '-'}, GPA: {details.prevGpa || '-'})</strong></div>
                  <div>পিতার নাম: <strong>{details.fatherNameBn} ({details.fatherNameEn})</strong></div>
                  <div>পিতার পেশা ও মোবাইল: <strong>{details.fatherOccupation} · {details.fatherMobile}</strong></div>
                  <div>মাতার নাম: <strong>{details.motherNameBn} ({details.motherNameEn})</strong></div>
                  <div>মাতার পেশা ও মোবাইল: <strong>{details.motherOccupation} · {details.motherMobile}</strong></div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-purple-900 text-sm mb-1">
                    ৪. পারিবারিক পরিবেশ ও ৫. আচরণ ও দক্ষতা
                  </div>
                  <div>হালাল উপার্জন: <strong>{details.halalIncome}</strong> · ৫ ওয়াক্ত নামাজ: <strong>{details.regularPrayer}</strong></div>
                  <div>কুরআন তিলাওয়াত: <strong>{details.quranRecitation}</strong> · পর্দা পালন: <strong>{details.purdahMaintenance}</strong></div>
                  <div>দৈনিক মোবাইল ব্যবহার: <strong>{details.mobileUsageHours || 'N/A'}</strong></div>
                  <div>স্বভাবের আচরণ: <strong>{details.generalBehavior}</strong> · পড়াশোনায় আগ্রহ: <strong>{details.studyInterest}</strong></div>
                  <div>ধর্মীয় কাজে আগ্রহ: <strong>{details.religiousInterest}</strong> · রাগ নিয়ন্ত্রণ: <strong>{details.angerControl}</strong></div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-purple-900 text-sm mb-1">
                    ৬. ঠিকানা ও অঙ্গীকারনামা
                  </div>
                  <div>স্থায়ী ঠিকানা: <strong>{details.permanentVillage}, ডাকঘর: {details.permanentPost}, থানা: {details.permanentThana}, জেলা: {details.permanentDistrict}</strong></div>
                  <div>অঙ্গীকারনামা: <strong>সম্মতি প্রদান করা হয়েছে</strong></div>
                  <div>ইমেইল নোটিফিকেশন: <strong>{studentEmail}</strong></div>
                </div>
              </div>

              {/* Styled Letterhead Footer */}
              <div className="pt-3 border-t-2 border-[#2e0249] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10.5px] text-slate-600">
                <div>
                  <strong>ক্যাম্পাস ঠিকানা:</strong> {state.settings.address} | <strong>হটলাইন:</strong>{' '}
                  {state.settings.phonePrimary}
                </div>
                <div>
                  <strong>ইমেইল:</strong> {state.settings.email} | <strong>ওয়েবসাইট:</strong>{' '}
                  maharatmadrasah.com
                </div>
              </div>
            </div>

            <div className="no-print flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPreviewMode(false)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>পেছনে</span>
              </button>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handlePrintAdmissionReceipt}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span>অফিসিয়াল প্যাডে প্রিন্ট (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-[#7e22ce] to-[#6366f1] hover:from-[#6b21a8] hover:to-[#4f46e5] text-white text-sm font-bold shadow-lg cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>চূড়ান্ত সাবমিট করুন (Confirm &amp; Submit)</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 6-Step Circular Icon Stepper */}
            <div className="px-3 sm:px-6 pt-5 sm:pt-7 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="relative flex items-center justify-between max-w-3xl mx-auto overflow-x-auto no-scrollbar py-1">
                {/* Connecting Background Line */}
                <div className="absolute top-4 sm:top-5 left-4 sm:left-8 right-4 sm:right-8 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0" />
                <div
                  className="absolute top-4 sm:top-5 left-4 sm:left-8 h-0.5 bg-[#8b2cf5] transition-all duration-300 -z-0"
                  style={{ width: `${Math.max(0, ((step - 1) / (STEPS.length - 1)) * 88)}%` }}
                />

                {STEPS.map((s) => {
                  const Icon = s.icon;
                  const isActive = step === s.id;
                  const isCompleted = step > s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setErrorMsg('');
                        setStep(s.id);
                      }}
                      className="relative z-10 flex flex-col items-center gap-1 group cursor-pointer bg-transparent shrink-0 px-1"
                    >
                      <div
                        className={`w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-[#8b2cf5] text-white shadow-md'
                            : isActive
                            ? 'bg-white dark:bg-slate-900 border-2 border-[#8b2cf5] text-[#8b2cf5] shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                        )}
                      </div>
                      <span
                        className={`text-[9px] sm:text-[11px] font-semibold whitespace-nowrap ${
                          isActive || isCompleted
                            ? 'text-[#8b2cf5] dark:text-purple-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {language === 'bn' ? s.labelBn : language === 'ar' ? s.labelAr : s.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Progress Bar */}
              <div className="mt-4 sm:mt-5 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-900 dark:bg-purple-500 transition-all duration-300"
                  style={{ width: `${(step / 6) * 100}%` }}
                />
              </div>
            </div>

            {/* Step Body Content */}
            <div className="p-6 sm:p-8 bg-[#fcfaff] dark:bg-slate-900/90 space-y-6">
              {errorMsg && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-700 dark:text-red-300"
                >
                  {errorMsg}
                </div>
              )}

              {/* STEP 1: শিক্ষার্থীর তথ্য (Student) */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-[#7e22ce] dark:text-purple-300 flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        শিক্ষার্থীর তথ্য
                      </h3>
                      <p className="text-xs text-slate-500">
                        {tr('নতুন শিক্ষার্থী অথবা পূর্বে রেজিস্ট্রেশনকৃত অভিভাবক তথ্য দিয়ে পূরণ করুন', 'New applicant or returning registered guardian', 'بيانات الطالب')}
                      </p>
                    </div>
                  </div>

                  {/* Returning Guardian Phone Quick Lookup Box */}
                  <div className="rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-950/30 p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                          <Smartphone className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                          <span>{tr('পূর্বে কি অনলাইন রেজিস্ট্রেশন করেছিলেন?', 'Already submitted quick inquiry before?', 'هل قمت بالتسجيل السريع سابقاً؟')}</span>
                        </div>
                        <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80 mt-0.5">
                          {tr(
                            'আপনার মোবাইল নম্বর লিখলে পূর্বের তথ্য অটো-ফিল হবে এবং এই ফর্ম সাবমিটেই সরাসরি ভর্তি সম্পন্ন হবে (নতুন কোনো ডুপ্লিকেট লিড হবে না)।',
                            'Enter your mobile to auto-populate basic info; submitting confirms final admission without duplicates.',
                            'أدخل رقم هاتفك لتعبئة البيانات تلقائياً وتحديث الطلب مباشرة.'
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={phoneLookupQuery}
                          onChange={(e) => handleLookupExistingRegistration(e.target.value)}
                          placeholder="017XXXXXXXX"
                          className="px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-xs font-mono focus:outline-none focus:border-purple-600"
                        />
                      </div>
                    </div>

                    {matchedExistingLead && (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>{tr('পূর্বের রেজিস্ট্রেশন রেকর্ড পাওয়া গেছে!', 'Existing Registration Record Found!', 'تم العثور على بيانات سابقة')}</span>
                          </div>
                          <div className="text-slate-600 dark:text-slate-300">
                            শিক্ষার্থী: <strong>{matchedExistingLead.name}</strong> · বিভাগ: {matchedExistingLead.courseTitle} · স্ট্যাটাস: <strong>{matchedExistingLead.status}</strong>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyExistingLeadData}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs whitespace-nowrap"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{tr('তথ্য অটো-লোড করুন', 'Auto-Load Details', 'تعبئة البيانات')}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Photo Upload Card matching admission-form-comt__2.png */}
                    <div className="lg:col-span-4 rounded-2xl bg-[#f8f4ff] dark:bg-slate-800/70 border border-purple-100 dark:border-slate-700 p-6 flex flex-col items-center text-center space-y-4">
                      <div className="w-full text-left text-xs font-bold text-slate-700 dark:text-slate-200">
                        শিক্ষার্থীর ছবি
                      </div>

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-40 h-40 rounded-full bg-[#efe7ff] dark:bg-slate-700 border-4 border-white dark:border-slate-600 shadow-md flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        {details.studentPhotoUrl ? (
                          <img
                            src={details.studentPhotoUrl}
                            alt="Student preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-purple-400">
                            <Camera className="w-12 h-12 stroke-[1.5]" />
                          </div>
                        )}
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />

                      <div className="w-full rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-slate-700 p-1.5 flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-1.5 rounded-lg bg-[#8b2cf5] hover:bg-[#7e22ce] text-white text-xs font-bold shrink-0 cursor-pointer"
                        >
                          Choose File
                        </button>
                        <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
                          {photoFileName}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        অনুমোদিত ফরম্যাট: JPG, PNG (সর্বোচ্চ ২MB)
                      </p>
                    </div>

                    {/* Right 12-Field Grid Card */}
                    <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* 1. শিক্ষার্থীর নাম (বাংলা) * */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                          শিক্ষার্থীর নাম (বাংলা) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={details.studentNameBn || ''}
                            onChange={(e) => updateDetail('studentNameBn', e.target.value)}
                            placeholder="আপনার পূর্ণ নাম লিখুন"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-purple-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* 2. Student Name (English) * */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                          Student Name (English) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={details.studentNameEn || ''}
                            onChange={(e) => updateDetail('studentNameEn', e.target.value)}
                            placeholder="Full Name in English"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-purple-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* 3. জন্ম তারিখ */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                          জন্ম তারিখ
                        </label>
                        <div className="relative">
                          <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="date"
                            value={details.dob || ''}
                            onChange={(e) => handleDobChange(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-purple-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* 4. বয়স */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                          বয়স
                        </label>
                        <div className="relative">
                          <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={details.age || ''}
                            onChange={(e) => updateDetail('age', e.target.value)}
                            placeholder="স্বয়ংক্রিয়ভাবে হিসাব হবে"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-purple-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* 5. লিঙ্গ * */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                          লিঙ্গ <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <select
                            aria-label="লিঙ্গ"
                            value={details.gender || 'পুরুষ'}
                            onChange={(e) => updateDetail('gender', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-purple-600 focus:outline-none"
                          >
                            <option value="পুরুষ">পুরুষ</option>
                            <option value="মহিলা">মহিলা</option>
                          </select>
                        </div>
                      </div>

                      {/* 6. বিভাগ * */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                          বিভাগ <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <select
                            aria-label="বিভাগ"
                            value={details.department || 'হিফজ বিভাগ'}
                            onChange={(e) => {
                              const dept = e.target.value;
                              updateDetail('department', dept);
                              updateDetail(
                                'targetClass',
                                dept === 'হিফজ বিভাগ' ? 'হিফয' : 'Pre One (Nursery)'
                              );
                            }}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-purple-600 focus:outline-none"
                          >
                            <option value="হিফজ বিভাগ">হিফজ বিভাগ</option>
                            <option value="একাডেমিক বিভাগ">একাডেমিক বিভাগ</option>
                          </select>
                        </div>
                      </div>

                      {/* 7. যে শ্রেণিতে ভর্তি হতে আগ্রহী * */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                          যে শ্রেণিতে ভর্তি হতে আগ্রহী <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <select
                            aria-label="যে শ্রেণিতে ভর্তি হতে আগ্রহী"
                            value={details.targetClass || ''}
                            onChange={(e) => updateDetail('targetClass', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-purple-600 focus:outline-none"
                          >
                            {classOptions.map((cls) => (
                              <option key={cls} value={cls}>
                                {cls}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* 8. একাডেমিক ক্যাটাগরি */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                          একাডেমিক ক্যাটাগরি
                        </label>
                        <div className="relative">
                          <Home className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <select
                            aria-label="একাডেমিক ক্যাটাগরি"
                            value={details.academicCategory || 'Non-Residential (অনাবাসিক)'}
                            onChange={(e) => updateDetail('academicCategory', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-purple-600 focus:outline-none"
                          >
                            <option value="Residential (আবাসিক)">Residential (আবাসিক)</option>
                            <option value="Non-Residential (অনাবাসিক)">
                              Non-Residential (অনাবাসিক)
                            </option>
                            <option value="Day Care (ডে কেয়ার)">Day Care (ডে কেয়ার)</option>
                            <option value="Residential No Meal">Residential No Meal</option>
                          </select>
                        </div>
                      </div>

                      {/* 9. সেশন */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                          সেশন
                        </label>
                        <div className="relative">
                          <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <select
                            aria-label="সেশন"
                            value={details.session || '2027'}
                            onChange={(e) => updateDetail('session', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-purple-600 focus:outline-none"
                          >
                            <option value="2027">2027</option>
                            <option value="2026">2026</option>
                          </select>
                        </div>
                      </div>

                      {/* 10. জাতীয় পরিচয়পত্র/জন্ম নিবন্ধন নম্বর */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                          জাতীয় পরিচয়পত্র/জন্ম নিবন্ধন নম্বর
                        </label>
                        <div className="relative">
                          <Fingerprint className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={details.nidOrBirthReg || ''}
                            onChange={(e) => updateDetail('nidOrBirthReg', e.target.value)}
                            placeholder="১৭ সংখ্যার নম্বর"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-purple-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* 11. রক্তের গ্রুপ */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                          রক্তের গ্রুপ
                        </label>
                        <div className="relative">
                          <Heart className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <select
                            aria-label="রক্তের গ্রুপ"
                            value={details.bloodGroup || ''}
                            onChange={(e) => updateDetail('bloodGroup', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-purple-600 focus:outline-none"
                          >
                            <option value="">রক্তের গ্রুপ নির্বাচন করুন</option>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                              <option key={bg} value={bg}>
                                {bg}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* 12. জাতীয়তা */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                          জাতীয়তা
                        </label>
                        <div className="relative">
                          <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={details.nationality || 'Bangladeshi'}
                            onChange={(e) => updateDetail('nationality', e.target.value)}
                            placeholder="Bangladeshi"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-purple-600 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: পূর্ববর্তী একাডেমিক তথ্য (Academic) matching admission-form-comt__1.png */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      পূর্ববর্তী একাডেমিক তথ্য
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                        পূর্ববর্তী প্রতিষ্ঠানের নাম
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={details.prevInstitute || ''}
                          onChange={(e) => updateDetail('prevInstitute', e.target.value)}
                          placeholder="পূর্ববর্তী প্রতিষ্ঠানের নাম"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3.5 py-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-purple-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                        পূর্ববর্তী অধ্যয়নকৃত শ্রেণি
                      </label>
                      <div className="relative">
                        <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={details.prevClass || ''}
                          onChange={(e) => updateDetail('prevClass', e.target.value)}
                          placeholder="পূর্ববর্তী অধ্যয়নকৃত শ্রেণি"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3.5 py-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-purple-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                        সর্বশেষ জিপিএ (GPA)
                      </label>
                      <div className="relative">
                        <Star className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={details.prevGpa || ''}
                          onChange={(e) => updateDetail('prevGpa', e.target.value)}
                          placeholder="প্রাপ্ত জিপিএ"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3.5 py-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-purple-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: অভিভাবকের তথ্য (Parents) matching 14b6cc19...pdf */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      অভিভাবকের তথ্য
                    </h3>
                  </div>

                  {/* পিতার তথ্য */}
                  <div className="rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-5 space-y-4">
                    <span className="inline-block px-3.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-extrabold">
                      পিতার তথ্য
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          পিতার নাম (বাংলা) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={details.fatherNameBn || ''}
                          onChange={(e) => updateDetail('fatherNameBn', e.target.value)}
                          placeholder="পিতার নাম (বাংলা)"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          Father&apos;s Name (English) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={details.fatherNameEn || ''}
                          onChange={(e) => updateDetail('fatherNameEn', e.target.value)}
                          placeholder="Father's Name (English)"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          পেশা
                        </label>
                        <select
                          aria-label="পিতার পেশা"
                          value={details.fatherOccupation || ''}
                          onChange={(e) => updateDetail('fatherOccupation', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm"
                        >
                          <option value="">পেশা নির্বাচন করুন</option>
                          {OCCUPATION_OPTIONS.map((occ) => (
                            <option key={occ} value={occ}>
                              {occ}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          শিক্ষাগত যোগ্যতা
                        </label>
                        <input
                          type="text"
                          value={details.fatherEducation || ''}
                          onChange={(e) => updateDetail('fatherEducation', e.target.value)}
                          placeholder="শিক্ষাগত যোগ্যতা"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          মোবাইল <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            value={details.fatherMobile || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateDetail('fatherMobile', val);
                              if (details.fatherWhatsappSame) {
                                updateDetail('fatherWhatsapp', val);
                              }
                            }}
                            placeholder="+8801XXXXXXXXX"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3.5 py-2.5 text-xs sm:text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          WhatsApp
                        </label>
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2">
                          <input
                            type="checkbox"
                            title="মোবাইল নম্বরের অনুরূপ"
                            checked={Boolean(details.fatherWhatsappSame)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateDetail('fatherWhatsappSame', checked);
                              if (checked) {
                                updateDetail('fatherWhatsapp', details.fatherMobile || '');
                              }
                            }}
                            className="rounded border-slate-300 text-purple-600"
                          />
                          <input
                            type="tel"
                            value={details.fatherWhatsapp || ''}
                            onChange={(e) => updateDetail('fatherWhatsapp', e.target.value)}
                            placeholder="+880"
                            className="w-full bg-transparent text-xs sm:text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* মাতার তথ্য */}
                  <div className="rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-5 space-y-4">
                    <span className="inline-block px-3.5 py-1 rounded-lg bg-pink-50 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 text-xs font-extrabold">
                      মাতার তথ্য
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          মাতার নাম (বাংলা) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={details.motherNameBn || ''}
                          onChange={(e) => updateDetail('motherNameBn', e.target.value)}
                          placeholder="মাতার নাম (বাংলা)"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          Mother&apos;s Name (English) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={details.motherNameEn || ''}
                          onChange={(e) => updateDetail('motherNameEn', e.target.value)}
                          placeholder="Mother's Name (English)"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          পেশা
                        </label>
                        <select
                          aria-label="মাতার পেশা"
                          value={details.motherOccupation || ''}
                          onChange={(e) => updateDetail('motherOccupation', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm"
                        >
                          <option value="">পেশা নির্বাচন করুন</option>
                          {OCCUPATION_OPTIONS.map((occ) => (
                            <option key={occ} value={occ}>
                              {occ}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          শিক্ষাগত যোগ্যতা
                        </label>
                        <input
                          type="text"
                          value={details.motherEducation || ''}
                          onChange={(e) => updateDetail('motherEducation', e.target.value)}
                          placeholder="শিক্ষাগত যোগ্যতা"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          মোবাইল
                        </label>
                        <input
                          type="tel"
                          value={details.motherMobile || ''}
                          onChange={(e) => updateDetail('motherMobile', e.target.value)}
                          placeholder="+880"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          WhatsApp
                        </label>
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2">
                          <input
                            type="checkbox"
                            checked={Boolean(details.motherWhatsappSame)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateDetail('motherWhatsappSame', checked);
                              if (checked) {
                                updateDetail('motherWhatsapp', details.motherMobile || '');
                              }
                            }}
                            className="rounded border-slate-300 text-purple-600"
                          />
                          <input
                            type="tel"
                            value={details.motherWhatsapp || ''}
                            onChange={(e) => updateDetail('motherWhatsapp', e.target.value)}
                            placeholder="+880"
                            className="w-full bg-transparent text-xs sm:text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* অভিভাবকের তথ্য (যদি পিতা-মাতা ব্যতীত অন্য কেউ) */}
                  <div className="rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-5 space-y-4">
                    <span className="inline-block px-3.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-extrabold">
                      অভিভাবকের তথ্য (যদি পিতা-মাতা ব্যতীত অন্য কেউ)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          অভিভাবকের নাম (বাংলা)
                        </label>
                        <input
                          type="text"
                          value={details.guardianNameBn || ''}
                          onChange={(e) => updateDetail('guardianNameBn', e.target.value)}
                          placeholder="অভিভাবকের নাম"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          Guardian&apos;s Name (English)
                        </label>
                        <input
                          type="text"
                          value={details.guardianNameEn || ''}
                          onChange={(e) => updateDetail('guardianNameEn', e.target.value)}
                          placeholder="Guardian's Name"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          সম্পর্ক
                        </label>
                        <input
                          type="text"
                          value={details.guardianRelation || ''}
                          onChange={(e) => updateDetail('guardianRelation', e.target.value)}
                          placeholder="যেমন: চাচা / মামা / দাদা"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          মোবাইল
                        </label>
                        <input
                          type="tel"
                          value={details.guardianMobile || ''}
                          onChange={(e) => updateDetail('guardianMobile', e.target.value)}
                          placeholder="+880"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          WhatsApp
                        </label>
                        <input
                          type="tel"
                          value={details.guardianWhatsapp || ''}
                          onChange={(e) => updateDetail('guardianWhatsapp', e.target.value)}
                          placeholder="+880"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          পেশা
                        </label>
                        <input
                          type="text"
                          value={details.guardianOccupation || ''}
                          onChange={(e) => updateDetail('guardianOccupation', e.target.value)}
                          placeholder="পেশা"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          ঠিকানা
                        </label>
                        <input
                          type="text"
                          value={details.guardianAddress || ''}
                          onChange={(e) => updateDetail('guardianAddress', e.target.value)}
                          placeholder="অভিভাবকের বর্তমান ঠিকানা"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: পারিবারিক পরিবেশ (Family) matching a56b3e45...pdf */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                      <Home className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      পারিবারিক পরিবেশ
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderChoiceGroup(
                      'আপনাদের পরিবারের উপার্জন ১০০% হালাল কি?',
                      details.halalIncome,
                      ['হ্যাঁ', 'না'],
                      (val) => updateDetail('halalIncome', val)
                    )}
                    {renderChoiceGroup(
                      'পিতা-মাতা নিয়মিত ৫ ওয়াক্ত নামাজ পড়েন কি?',
                      details.regularPrayer,
                      ['হ্যাঁ', 'না'],
                      (val) => updateDetail('regularPrayer', val)
                    )}
                    {renderChoiceGroup(
                      'পরিবারের কেউ অথবা মাদক/নেশায় আক্রান্ত?',
                      details.drugAddictionInFamily,
                      ['হ্যাঁ', 'না'],
                      (val) => updateDetail('drugAddictionInFamily', val)
                    )}
                    {renderChoiceGroup(
                      'বাসায় টেলিভিশন আছে কি?',
                      details.hasTelevision,
                      ['হ্যাঁ', 'না'],
                      (val) => updateDetail('hasTelevision', val)
                    )}
                    {renderChoiceGroup(
                      'বাসায় নিয়মিত কুরআন তিলাওয়াত করা হয়?',
                      details.quranRecitation,
                      ['হ্যাঁ', 'না', 'মাঝে মাঝে'],
                      (val) => updateDetail('quranRecitation', val)
                    )}
                    {renderChoiceGroup(
                      'পরিবারের সদস্যরা পর্দা পালন করে কি?',
                      details.purdahMaintenance,
                      ['হ্যাঁ', 'না', 'চেষ্টা করা হয়'],
                      (val) => updateDetail('purdahMaintenance', val)
                    )}
                  </div>
                </div>
              )}

              {/* STEP 5: আচরণ ও দক্ষতা (Behavior) matching 5c972505...pdf */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 flex items-center justify-center">
                      <Activity className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      আচরণ ও দক্ষতা
                    </h3>
                  </div>

                  {/* Full-width mobile usage field */}
                  <div className="rounded-2xl bg-slate-50/90 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 p-5 space-y-2">
                    <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                      দৈনিক কত সময় মোবাইল ব্যবহার করে?
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={details.mobileUsageHours || ''}
                        onChange={(e) => updateDetail('mobileUsageHours', e.target.value)}
                        placeholder="যেমন: টিভিতে কার্টুন দেখে / ২ ঘণ্টা"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* 8 Behavioral Question Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderChoiceGroup(
                      'স্বভাবের আচরণ কেমন?',
                      details.generalBehavior,
                      ['অনেক ভালো', 'মোটামুটি', 'ভাল নয়'],
                      (val) => updateDetail('generalBehavior', val)
                    )}
                    {renderChoiceGroup(
                      'পিতা-মাতার কথা শোনে?',
                      details.obeysParents,
                      ['না', 'মোটামুটি', 'পুরোপুরি'],
                      (val) => updateDetail('obeysParents', val)
                    )}
                    {renderChoiceGroup(
                      'বড়দের সাথে আচরণ?',
                      details.behaviorWithElders,
                      ['অনেক ভালো', 'মোটামুটি', 'ভাল নয়'],
                      (val) => updateDetail('behaviorWithElders', val)
                    )}
                    {renderChoiceGroup(
                      'ছোটদের সাথে আচরণ?',
                      details.behaviorWithYoungers,
                      ['অনেক ভালো', 'মোটামুটি', 'ভাল নয়'],
                      (val) => updateDetail('behaviorWithYoungers', val)
                    )}
                    {renderChoiceGroup(
                      'মিথ্যা বলে বা জেদ করে?',
                      details.liesOrStubborn,
                      ['খুব বেশি', 'মাঝে মাঝে', 'না'],
                      (val) => updateDetail('liesOrStubborn', val)
                    )}
                    {renderChoiceGroup(
                      'পড়াশোনায় আগ্রহ?',
                      details.studyInterest,
                      ['খুব আগ্রহী', 'মোটামুটি', 'কম আগ্রহী'],
                      (val) => updateDetail('studyInterest', val)
                    )}
                    {renderChoiceGroup(
                      'ধর্মীয় কাজে আগ্রহ?',
                      details.religiousInterest,
                      ['খুব আগ্রহী', 'মোটামুটি', 'কম আগ্রহী'],
                      (val) => updateDetail('religiousInterest', val)
                    )}
                    {renderChoiceGroup(
                      'রাগ নিয়ন্ত্রণ?',
                      details.angerControl,
                      ['মোটামুটি', 'ভাল', 'উন্নতি প্রয়োজন'],
                      (val) => updateDetail('angerControl', val)
                    )}
                  </div>
                </div>
              )}

              {/* STEP 6: ঠিকানা ও ডকুমেন্টস (Address & Documents) matching 0fcb484c...pdf */}
              {step === 6 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      ঠিকানা ও ডকুমেন্টস
                    </h3>
                  </div>

                  {/* স্থায়ী ঠিকানা */}
                  <div className="rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-5 space-y-4">
                    <span className="inline-block px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 text-xs font-extrabold">
                      স্থায়ী ঠিকানা
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          গ্রাম/এলাকা <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={details.permanentVillage || ''}
                          onChange={(e) => updateDetail('permanentVillage', e.target.value)}
                          placeholder="গ্রাম/এলাকা"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          ডাকঘর <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={details.permanentPost || ''}
                          onChange={(e) => updateDetail('permanentPost', e.target.value)}
                          placeholder="ডাকঘর"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          পোস্ট কোড
                        </label>
                        <input
                          type="text"
                          value={details.permanentPostCode || ''}
                          onChange={(e) => updateDetail('permanentPostCode', e.target.value)}
                          placeholder="পোস্ট কোড"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          থানা <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={details.permanentThana || ''}
                          onChange={(e) => updateDetail('permanentThana', e.target.value)}
                          placeholder="থানা"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          জেলা <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={details.permanentDistrict || ''}
                          onChange={(e) => updateDetail('permanentDistrict', e.target.value)}
                          placeholder="জেলা"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Toggle: বর্তমান ঠিকানা স্থায়ী ঠিকানার মতোই হবে */}
                  <div className="flex items-center justify-end gap-3 px-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      বর্তমান ঠিকানা স্থায়ী ঠিকানার মতোই হবে
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(details.presentAddressSame)}
                      onClick={() => {
                        const next = !details.presentAddressSame;
                        updateDetail('presentAddressSame', next);
                        if (next) {
                          updateDetail('presentVillage', details.permanentVillage);
                          updateDetail('presentPost', details.permanentPost);
                          updateDetail('presentPostCode', details.permanentPostCode);
                          updateDetail('presentThana', details.permanentThana);
                          updateDetail('presentDistrict', details.permanentDistrict);
                        }
                      }}
                      className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                        details.presentAddressSame
                          ? 'bg-[#7e22ce]'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                          details.presentAddressSame ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* বর্তমান ঠিকানা */}
                  <div className="rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-5 space-y-4">
                    <span className="inline-block px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 text-xs font-extrabold">
                      বর্তমান ঠিকানা
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          গ্রাম/এলাকা
                        </label>
                        <input
                          type="text"
                          value={
                            details.presentAddressSame
                              ? details.permanentVillage || ''
                              : details.presentVillage || ''
                          }
                          onChange={(e) => updateDetail('presentVillage', e.target.value)}
                          disabled={Boolean(details.presentAddressSame)}
                          placeholder="গ্রাম/এলাকা"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          ডাকঘর
                        </label>
                        <input
                          type="text"
                          value={
                            details.presentAddressSame
                              ? details.permanentPost || ''
                              : details.presentPost || ''
                          }
                          onChange={(e) => updateDetail('presentPost', e.target.value)}
                          disabled={Boolean(details.presentAddressSame)}
                          placeholder="ডাকঘর"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          পোস্ট কোড
                        </label>
                        <input
                          type="text"
                          value={
                            details.presentAddressSame
                              ? details.permanentPostCode || ''
                              : details.presentPostCode || ''
                          }
                          onChange={(e) => updateDetail('presentPostCode', e.target.value)}
                          disabled={Boolean(details.presentAddressSame)}
                          placeholder="পোস্ট কোড"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          থানা
                        </label>
                        <input
                          type="text"
                          value={
                            details.presentAddressSame
                              ? details.permanentThana || ''
                              : details.presentThana || ''
                          }
                          onChange={(e) => updateDetail('presentThana', e.target.value)}
                          disabled={Boolean(details.presentAddressSame)}
                          placeholder="থানা"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          জেলা
                        </label>
                        <input
                          type="text"
                          value={
                            details.presentAddressSame
                              ? details.permanentDistrict || ''
                              : details.presentDistrict || ''
                          }
                          onChange={(e) => updateDetail('presentDistrict', e.target.value)}
                          disabled={Boolean(details.presentAddressSame)}
                          placeholder="জেলা"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* প্রদত্ত ডকুমেন্টসমূহ Card matching 0fcb484c...pdf */}
                  <div className="rounded-2xl bg-[#fff8f8] dark:bg-slate-800/70 border border-red-100 dark:border-slate-700 p-5 sm:p-6 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-red-600" />
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                          প্রদত্ত ডকুমেন্টসমূহ
                        </h4>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-red-600" />
                        <span>অফিসে জমাদান আবশ্যক</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {REQUIRED_DOCUMENTS.map((doc) => (
                        <div
                          key={doc}
                          className="rounded-2xl bg-white dark:bg-slate-900 border border-red-200/80 dark:border-slate-700 p-4 flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                              {doc}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold shrink-0">
                            আবশ্যক
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-4 py-2.5 flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-200">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>প্রদত্ত ডকুমেন্টসমূহ অবশ্যই অফিসে জমাদান বাধ্যতামূলক</span>
                    </div>
                  </div>

                  {/* অঙ্গীকার নামা Card */}
                  <div className="rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-5 flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                        অঙ্গীকার নামা: <span className="text-red-500">*</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        আমি <strong>{details.studentNameBn || details.fatherNameBn || '......'}</strong> এই মর্মে অঙ্গীকার করছি যে, অত্র প্রতিষ্ঠানের সকল নিয়মকানুন আন্তরিকভাবে মেনে চলব। যদি প্রতিষ্ঠানের আইন পরিপন্থী কোনো কিছু আমার দ্বারা পরিলক্ষিত হয়, তবে কর্তৃপক্ষের যে কোনো সিদ্ধান্ত মেনে নিতে বাধ্য থাকব।
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-label="অঙ্গীকার নামা সম্মতি"
                      aria-checked={Boolean(details.agreedToPledge)}
                      onClick={() => updateDetail('agreedToPledge', !details.agreedToPledge)}
                      className={`w-12 h-6 rounded-full transition-colors p-0.5 shrink-0 cursor-pointer ${
                        details.agreedToPledge
                          ? 'bg-[#7e22ce]'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                          details.agreedToPledge ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Navigation Footer matching reference screenshots */}
              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (step > 1) {
                      setErrorMsg('');
                      setStep((prev) => prev - 1);
                    } else if (!inlineMode) {
                      onClose();
                    }
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{tr('পেছনে', 'Previous', 'السابق')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#8b2cf5] to-[#6366f1] hover:from-[#7e22ce] hover:to-[#4f46e5] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
                >
                  {step < 6 ? (
                    <>
                      <span>{tr('পরবর্তী', 'Next Step', 'التالي')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>{tr('প্রিভিউ', 'Preview Application', 'معاينة الطلب')}</span>
                      <Eye className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Check Note Banner matching reference screenshots */}
      <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 py-3 px-4 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2 shadow-xs">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        <span>
          {tr(
            'সাবমিট করার পূর্বে তথ্যগুলো পুনরায় চেক করুন।',
            'Please review all fields carefully before final submission.',
            'يرجى مراجعة جميع البيانات بعناية قبل الإرسال النهائي.'
          )}
        </span>
      </div>
    </div>
  );

  if (inlineMode) {
    return formContent;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admission-form-modal-title"
    >
      <div className="my-auto w-full max-w-5xl">{formContent}</div>
    </div>
  );
};
