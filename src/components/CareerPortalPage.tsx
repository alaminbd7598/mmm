import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  GraduationCap,
  HeartHandshake,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Phone,
  QrCode,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import { CareerApplicationItem, CareerJobCircular } from '../types/cms';
import {
  ApplicationStatusEntry,
  CandidateProfile,
  fetchCandidateMe,
  loginCandidate,
  logoutCandidate,
  lookupApplicationStatus,
  registerCandidate,
} from '../lib/api/career';
import {
  validateCandidateRegistration,
  validateCareerApplication,
} from '../utils/careerAndMapsLogic';
import { MIN_PASSWORD_LENGTH } from '../server/contracts';

interface CareerPortalPageProps {
  onNavigateContact: () => void;
}

export const CareerPortalPage: React.FC<CareerPortalPageProps> = ({ onNavigateContact }) => {
  const { state, language, submitCareerApplication } = useCMS();
  const activeJobs = (state.careerJobs || []).filter((j) => j.active);

  // Optional Candidate Account session (server cookie; guest apply works without login)
  const [signedInCandidate, setSignedInCandidate] = useState<CandidateProfile | null>(null);
  const [candidateApplications, setCandidateApplications] = useState<CareerApplicationItem[]>([]);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(null);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // No-Login Application Status Tracker
  const [statusQuery, setStatusQuery] = useState('');
  const [statusSearched, setStatusSearched] = useState(false);
  const [trackedApplications, setTrackedApplications] = useState<ApplicationStatusEntry[]>([]);
  const [statusLookupFailed, setStatusLookupFailed] = useState<'rate-limited' | 'error' | null>(null);
  const [isStatusSearching, setIsStatusSearching] = useState(false);

  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  // Restore an existing candidate session and load the candidate's own applications.
  useEffect(() => {
    let active = true;
    void fetchCandidateMe().then((res) => {
      if (!active || !res.ok) return;
      setSignedInCandidate(res.data.candidate);
      setCandidateApplications(res.data.applications);
    });
    return () => {
      active = false;
    };
  }, []);

  // Applications are private data, so the lookup runs on the server and returns status fields only.
  const searchApplicationStatus = async () => {
    const query = statusQuery.trim();
    if (!query || isStatusSearching) return;
    setIsStatusSearching(true);
    const res = await lookupApplicationStatus(query);
    setIsStatusSearching(false);
    setTrackedApplications(res.ok ? res.data.applications : []);
    setStatusLookupFailed(res.ok ? null : res.code === 'RATE_LIMITED' ? 'rate-limited' : 'error');
    setStatusSearched(true);
  };

  // Job Details & Application Modals
  const [viewingJob, setViewingJob] = useState<CareerJobCircular | null>(null);
  const [applyingJob, setApplyingJob] = useState<{ id: string; titleBn: string; applicationFeeBDT?: number } | null>(null);
  const [appName, setAppName] = useState('');
  const [appPhone, setAppPhone] = useState('');
  const [appWhatsapp, setAppWhatsapp] = useState('');
  const [appEmail, setAppEmail] = useState('');
  const [appEducation, setAppEducation] = useState('');
  const [appExperience, setAppExperience] = useState('');
  const [appSalary, setAppSalary] = useState('');
  const [appTrxId, setAppTrxId] = useState('');
  const [appCvLink, setAppCvLink] = useState('');
  const [appCvFileDataUrl, setAppCvFileDataUrl] = useState('');
  const [appCvFileName, setAppCvFileName] = useState('');
  const [appCoverLetter, setAppCoverLetter] = useState('');
  const [appError, setAppError] = useState('');
  const [appSuccessId, setAppSuccessId] = useState<string | null>(null);
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);

  const openApplyModal = (job: { id: string; titleBn: string; applicationFeeBDT?: number }) => {
    setViewingJob(null);
    setApplyingJob(job);
    setAppName(signedInCandidate?.fullName || '');
    setAppPhone(signedInCandidate?.phone || '');
    setAppWhatsapp(signedInCandidate?.phone || '');
    setAppEmail(signedInCandidate?.email || '');
    setAppEducation('');
    setAppExperience('');
    setAppSalary('');
    setAppTrxId('');
    setAppCvLink('');
    setAppCvFileDataUrl('');
    setAppCvFileName('');
    setAppCoverLetter('');
    setAppError('');
    setAppSuccessId(null);
  };

  const handleCvFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setAppError(
        tr(
          'সিভি ফাইলের আকার ২ এমবি (2MB)-এর মধ্যে হতে হবে।',
          'CV file must be 2MB or smaller.',
          'يجب أن يكون حجم ملف السيرة الذاتية أقل من ٢ ميجابايت.'
        )
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      setAppCvFileDataUrl(dataUrl);
      setAppCvFileName(file.name);
      setAppCvLink(`Uploaded File: ${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`);
      setAppError('');
    };
    reader.readAsDataURL(file);
  };

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingJob || isSubmittingApp) return;

    const validation = validateCareerApplication(
      {
        jobId: applyingJob.id,
        jobTitleBn: applyingJob.titleBn,
        applicantName: appName,
        phone: appPhone,
        email: appEmail,
        educationBn: appEducation,
        experienceYearsBn: appExperience || 'ফ্রেশার / আলোচনা সাপেক্ষে',
        expectedSalaryBn: appSalary,
        cvLinkOrFileName: appCvLink,
        coverLetterBn: appCoverLetter,
      },
      language
    );

    if (!validation.valid) {
      setAppError(validation.error || 'অনুগ্রহ করে সকল প্রয়োজনীয় তথ্য সঠিকভাবে পূরণ করুন।');
      return;
    }

    setIsSubmittingApp(true);
    const result = await submitCareerApplication({
      jobId: applyingJob.id,
      jobTitleBn: applyingJob.titleBn,
      applicantName: appName.trim(),
      phone: appPhone.trim(),
      whatsapp: appWhatsapp.trim() || undefined,
      email: appEmail.trim(),
      educationBn: appEducation.trim(),
      experienceYearsBn: appExperience.trim() || 'ফ্রেশার / আলোচনা সাপেক্ষে',
      expectedSalaryBn: appSalary.trim() || undefined,
      paymentTrxId: appTrxId.trim() || undefined,
      cvLinkOrFileName: appCvLink.trim() || appCvFileName || 'Direct Profile Submission',
      cvFileDataUrl: appCvFileDataUrl || undefined,
      cvFileName: appCvFileName || undefined,
      coverLetterBn: appCoverLetter.trim() || undefined,
      applicantAccountEmail: signedInCandidate?.email,
      isGuestApplication: !signedInCandidate,
    });

    setIsSubmittingApp(false);
    // The confirmation (with the stored Application ID) is shown only once the server accepted it.
    if (!result.ok) {
      setAppError(result.error);
      return;
    }
    const created = result.application;
    setAppError('');
    setAppSuccessId(created.id);
    if (signedInCandidate) {
      setCandidateApplications((prev) => [created, ...prev.filter((a) => a.id !== created.id)]);
    }
  };

  const candidateAuthErrorMessage = (code: string, status: number): string => {
    switch (code) {
      case 'INVALID_CREDENTIALS':
        return 'ইমেইল বা পাসওয়ার্ড সঠিক নয়। নতুন হলে রেজিস্ট্রেশন করুন অথবা সরাসরি গেস্ট হিসেবে আবেদন করুন।';
      case 'EMAIL_TAKEN':
      case 'CONFLICT':
        return 'এই ইমেইল দিয়ে ইতিপূর্বেই অ্যাকাউন্ট তৈরি করা হয়েছে। অনুগ্রহ করে লগইন করুন।';
      case 'TOO_SHORT':
        return `পাসওয়ার্ড কমপক্ষে ${MIN_PASSWORD_LENGTH} অক্ষরের হতে হবে।`;
      case 'NEEDS_LETTER_AND_DIGIT':
        return 'পাসওয়ার্ডে অক্ষর ও সংখ্যা উভয়ই থাকতে হবে।';
      case 'TOO_COMMON':
      case 'SAME_AS_USERNAME':
        return 'এই পাসওয়ার্ডটি সহজে অনুমানযোগ্য; অনুগ্রহ করে অন্য পাসওয়ার্ড দিন।';
      case 'RATE_LIMITED':
        return 'অনেকবার চেষ্টা করা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।';
      case 'BAD_REQUEST':
        return 'অনুগ্রহ করে সকল তথ্য সঠিকভাবে পূরণ করুন।';
      default:
        return status === 0
          ? 'সার্ভারের সাথে সংযোগ করা যায়নি। ইন্টারনেট সংযোগ যাচাই করে আবার চেষ্টা করুন।'
          : 'অনুরোধটি সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।';
    }
  };

  const loadCandidateApplications = async () => {
    const me = await fetchCandidateMe();
    if (me.ok) setCandidateApplications(me.data.applications);
  };

  const handleCandidateAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthSubmitting) return;
    setAuthError('');
    if (authModalMode === 'register') {
      // Duplicate emails are detected by the server; accounts are never sent to browsers.
      const check = validateCandidateRegistration(
        { fullName: authName, email: authEmail, phone: authPhone, password: authPassword },
        []
      );
      if (!check.valid) {
        setAuthError(check.error || 'সঠিক তথ্য দিন।');
        return;
      }
      if (authPassword.length < MIN_PASSWORD_LENGTH) {
        setAuthError(candidateAuthErrorMessage('TOO_SHORT', 400));
        return;
      }
      setIsAuthSubmitting(true);
      const res = await registerCandidate({
        fullName: authName.trim(),
        email: authEmail.trim().toLowerCase(),
        phone: authPhone.trim(),
        password: authPassword,
      });
      setIsAuthSubmitting(false);
      if (!res.ok) {
        setAuthError(candidateAuthErrorMessage(res.code, res.status));
        return;
      }
      setSignedInCandidate(res.data.candidate);
      setCandidateApplications([]);
      setAuthPassword('');
      setAuthModalMode(null);
    } else if (authModalMode === 'login') {
      if (!authEmail.trim() || !authPassword) {
        setAuthError(candidateAuthErrorMessage('BAD_REQUEST', 400));
        return;
      }
      setIsAuthSubmitting(true);
      const res = await loginCandidate({ email: authEmail.trim().toLowerCase(), password: authPassword });
      setIsAuthSubmitting(false);
      if (!res.ok) {
        setAuthError(candidateAuthErrorMessage(res.code, res.status));
        return;
      }
      setSignedInCandidate(res.data.candidate);
      setAuthPassword('');
      setAuthModalMode(null);
      await loadCandidateApplications();
    }
  };

  const handleCandidateSignOut = async () => {
    await logoutCandidate();
    setSignedInCandidate(null);
    setCandidateApplications([]);
  };

  const myApplications = signedInCandidate ? candidateApplications : [];

  const benefits = [
    {
      icon: HeartHandshake,
      title: 'ইসলামি ও আধুনিক কর্মপরিবেশ',
      desc: 'সম্মানজনক, নিরাপদ ও দ্বীনি পরিবেশে শিক্ষার্থীদের চরিত্র ও মেধা গঠনের মহান সুযোগ।',
    },
    {
      icon: Award,
      title: 'আকর্ষণীয় বেতন ও উৎসব ভাতা',
      desc: 'যোগ্যতা ও অভিজ্ঞতার ভিত্তিতে সম্মানজনক বেতন, দুটি উৎসব বোনাস ও বাৎসরিক ইনক্রিমেন্ট।',
    },
    {
      icon: GraduationCap,
      title: 'নিয়মিত ইন-হাউজ প্রশিক্ষণ',
      desc: 'আধুনিক পাঠদান কৌশল, আইসিটি স্মার্ট বোর্ড ও নেতৃত্ব বিকাশে মাসিক শিক্ষক প্রশিক্ষণ কর্মশালা।',
    },
    {
      icon: Users,
      title: 'সমন্বিত অভিজ্ঞ ফ্যাকাল্টি টিম',
      desc: 'দেশবরেণ্য আলেম, আন্তর্জাতিক মানের হাফেজ-ক্বারী ও বিশ্ববিদ্যালয় গ্র্যাজুয়েটদের সাথে কাজ করার সুযোগ।',
    },
    {
      icon: Building2,
      title: 'পৃথক বয়েজ ও গার্লস ক্যাম্পাস',
      desc: 'উত্তরা সেক্টর-১২ তে বালক ও বালিকাদের সম্পূর্ণ আলাদা ও সুরক্ষিত ক্যাম্পাস ব্যবস্থাপনা।',
    },
    {
      icon: ShieldCheck,
      title: 'সন্তানের টিউশন সুবিধা ও কল্যাণ তহবিল',
      desc: 'স্থায়ী শিক্ষক-কর্মকর্তাদের সন্তানদের অধ্যয়নে বিশেষ টিউশন সুবিধা ও আবাসিক সহায়তা।',
    },
  ];

  const steps = [
    {
      num: '০১',
      title: 'অনলাইন আবেদন জমা',
      desc: 'পছন্দের পদে সরাসরি গেস্ট হিসেবে অথবা অ্যাকাউন্ট তৈরি করে সিভিসহ আবেদন জমা দিন।',
    },
    {
      num: '০২',
      title: 'প্রাথমিক যাচাই ও শর্টলিস্ট',
      desc: 'আমাদের এইচআর ও একাডেমিক প্যানেল আপনার যোগ্যতা ও অভিজ্ঞতা পর্যালোচনা করবে।',
    },
    {
      num: '০৩',
      title: 'ডেমো ক্লাস ও সাক্ষাৎকার',
      desc: 'উত্তরা সেক্টর-১২ ক্যাম্পাসে প্র্যাকটিক্যাল ডেমো ক্লাস ও মৌখিক সাক্ষাৎকার গ্রহণ।',
    },
    {
      num: '০৪',
      title: 'চূড়ান্ত নিয়োগ ও যোগদান',
      desc: 'সফল প্রার্থীদের নিয়োগপত্র প্রদান এবং ওরিয়েন্টেশন প্রোগ্রামের মাধ্যমে টিমে স্বাগতম।',
    },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Hero Banner in Official Maharat Royal Navy-Teal-Gold Gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#071129] via-[#192f64] to-[#005a6e] text-white py-16 sm:py-20 border-b border-[#e5b94c]/25">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(240,201,94,0.55) 1px, transparent 0)',
            backgroundSize: '30px 30px',
          }}
        />
        <div className="cii-container-section relative z-10 text-center max-w-4xl mx-auto space-y-5">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-[#e5b94c]/45 text-[#f0c95e] text-xs sm:text-sm font-bold">
            <Briefcase className="w-4 h-4" />
            <span>মাহারাত মডেল মাদ্রাসা · ক্যারিয়ার ও নিয়োগ পোর্টাল</span>
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">নিয়োগ বিজ্ঞপ্তি</h1>
          <p className="text-base sm:text-lg text-teal-50/90 max-w-2xl mx-auto leading-relaxed">
            আদর্শ, দক্ষ ও নৈতিকতাসম্পন্ন প্রজন্ম গড়ার মহান অভিযাত্রায় একজন গর্বিত শিক্ষক বা কর্মকর্তা হিসেবে আমাদের টিমে যোগ দিন।
          </p>
        </div>
      </section>

      <div className="cii-container-section py-12 sm:py-16 space-y-14">
        {/* No-Login Application Status Tracker (Phone, WhatsApp, or Email) */}
        <section
          data-testid="career-status-tracker"
          className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#005a6e]/30 dark:border-teal-700/60 p-6 sm:p-7 shadow-md space-y-4"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#005a6e] dark:text-[#f0c95e]">
                <Search className="w-4 h-4" />
                <span>
                  {tr(
                    'লগইন ছাড়াই তাৎক্ষণিক আবেদনের অবস্থা যাচাই করুন',
                    'No-Login Application Status Tracker',
                    'تتبع حالة الطلب بدون تسجيل دخول'
                  )}
                </span>
              </span>
              <h2 className="text-xl font-extrabold text-[#192f64] dark:text-white">
                {tr(
                  'আপনার চাকরির আবেদনের সর্বশেষ স্ট্যাটাস দেখুন',
                  'Check Your Recruitment Application Status',
                  'تحقق من حالة طلب التوظيف الخاص بك'
                )}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {tr(
                  'আবেদনের সময় ব্যবহৃত মোবাইল নম্বর, হোয়াটসঅ্যাপ নম্বর অথবা ইমেইল লিখে অনুসন্ধান করুন।',
                  'Enter the Phone number, WhatsApp number, or Email address used during application.',
                  'أدخل رقم الجوال أو الواتساب أو البريد الإلكتروني المستخدم في التقديم.'
                )}
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void searchApplicationStatus();
              }}
              className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto md:min-w-[420px]"
            >
              <input
                type="text"
                data-testid="career-status-input"
                value={statusQuery}
                onChange={(e) => {
                  setStatusQuery(e.target.value);
                  if (!e.target.value.trim()) setStatusSearched(false);
                }}
                placeholder={tr(
                  'যেমন: 01718-456789 বা email@domain.com',
                  'e.g. 01718-456789 or email@domain.com',
                  'مثال: 01718-456789'
                )}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                data-testid="career-status-search-btn"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#192f64] to-[#005a6e] text-white text-sm font-bold inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4 text-[#f0c95e]" />
                <span>{tr('স্ট্যাটাস দেখুন', 'Check Status', 'تحقق الآن')}</span>
              </button>
            </form>
          </div>

          {statusSearched && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800" data-testid="career-status-results">
              {trackedApplications.length === 0 ? (
                <p className="text-sm text-rose-600 dark:text-rose-400 font-semibold">
                  {tr(
                    'এই মোবাইল, হোয়াটসঅ্যাপ বা ইমেইলের বিপরীতে কোনো আবেদন পাওয়া যায়নি।',
                    'No application found matching this phone, WhatsApp, or email.',
                    'لم يتم العثور على طلب مطابق لهذه البيانات.'
                  )}
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {trackedApplications.map((app) => (
                    <div
                      key={app.id}
                      className="rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {app.applicantName}
                          </p>
                          <p className="text-xs font-bold text-[#005a6e] dark:text-[#f0c95e]">
                            {app.jobTitleBn}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 shrink-0">
                          {app.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <span>ID: {app.id}</span>
                        <span>{app.submittedAt}</span>
                      </div>
                      {app.hrNote && (
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl px-3 py-2">
                          {tr('এইচআর বার্তা: ', 'HR Note: ', 'ملاحظة الإدارة: ')}
                          {app.hrNote}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Intro Card: Why Work With Us */}
        <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-7 sm:p-10 shadow-sm text-center max-w-4xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-amber-300 bg-purple-50 dark:bg-purple-950/60 px-3.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>আমাদের সাথে গড়ুন আপনার সম্মানজনক ক্যারিয়ার</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            কেন মাহারাত মডেল মাদ্রাসায় কাজ করবেন?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            মাহারাত মডেল মাদ্রাসা (EIIN: 140630) কেবল একটি শিক্ষাপ্রতিষ্ঠান নয়, বরং দ্বীনি ইলম ও আধুনিক বিজ্ঞানের সমন্বয়ে একটি প্রগতিশীল শিক্ষা পরিবার। এখানে অভিজ্ঞ আলেম, হাফেজ ও বিশ্ববিদ্যালয় গ্র্যাজুয়েটরা পারস্পরিক শ্রদ্ধা, পেশাদারিত্ব ও সদকায়ে জারিয়ার মহান নিয়তে একসাথে কাজ করেন।
          </p>
        </section>

        {/* Optional Candidate Account Bar (Register/Login OR Direct Guest Apply) */}
        <section className="rounded-2xl bg-gradient-to-r from-purple-900 via-[#3b0764] to-fuchsia-900 text-white p-5 sm:p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {signedInCandidate ? (
            <>
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shrink-0">
                  <UserCheck className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-extrabold">
                    স্বাগতম, {signedInCandidate.fullName}
                  </p>
                  <p className="text-xs sm:text-sm text-purple-200">
                    {signedInCandidate.email} · আপনার মোট আবেদন: {myApplications.length}টি
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  void handleCandidateSignOut();
                }}
                className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>সাইন আউট</span>
              </button>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <p className="text-sm sm:text-base font-extrabold flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-300" />
                  <span>অ্যাকাউন্ট ছাড়াই সরাসরি আবেদন করুন অথবা প্রার্থী অ্যাকাউন্ট তৈরি করুন</span>
                </p>
                <p className="text-xs sm:text-sm text-purple-200">
                  রেজিস্ট্রেশন বাধ্যতামূলক নয় — চাইলে গেস্ট হিসেবে ১ মিনিটে আবেদন করতে পারেন, অথবা অ্যাকাউন্ট খুলে আপনার আবেদনের স্ট্যাটাস ট্র্যাক করতে পারবেন।
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('login');
                    setAuthError('');
                  }}
                  className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>প্রার্থী লগইন</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('register');
                    setAuthError('');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#1c0234] text-xs sm:text-sm font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>ফ্রি অ্যাকাউন্ট খুলুন</span>
                </button>
              </div>
            </>
          )}
        </section>

        {/* Signed-in Candidate's Submitted Applications Tracker */}
        {signedInCandidate && myApplications.length > 0 && (
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/60 p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              আমার জমাকৃত আবেদনসমূহ ({myApplications.length})
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {myApplications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">
                      {app.jobTitleBn}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      জমা: {app.submittedAt}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-amber-300 shrink-0">
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Active Job Circulars Section ("বর্তমান নিয়োগ") */}
        <section id="open-positions" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              বর্তমান নিয়োগ বিজ্ঞপ্তিসমূহ
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              আপনার যোগ্যতা অনুযায়ী উপযুক্ত পদ নির্বাচন করুন এবং অনলাইনে আবেদন জমা দিন
            </p>
          </div>

          {activeJobs.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
              <Briefcase className="w-10 h-10 text-purple-600 mx-auto" />
              <p className="text-base font-bold text-slate-900 dark:text-white">
                বর্তমানে কোনো সক্রিয় নিয়োগ বিজ্ঞপ্তি নেই
              </p>
              <p className="text-sm text-slate-500">
                তবে নিচের সাধারণ আবেদন ফরমের মাধ্যমে আপনার সিভি আমাদের ডাটাবেজে জমা দিয়ে রাখতে পারেন।
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6" data-testid="career-jobs-grid">
              {activeJobs.map((job) => (
                <article
                  key={job.id}
                  className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm hover:shadow-lg hover:border-purple-400/70 transition-all flex flex-col justify-between gap-5"
                >
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-200">
                        {job.departmentBn}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        পদসংখ্যা: {job.vacancies} জন
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
                        {job.titleBn}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                        {job.titleEn}
                      </p>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {job.summaryBn}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 pt-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-purple-700 dark:text-amber-300 shrink-0" />
                        <span>{job.campusBn}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-700 dark:text-amber-300 shrink-0" />
                        <span>{job.employmentTypeBn}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {job.salaryRangeBn}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>শেষ তারিখ: {job.deadline}</span>
                      </div>
                    </div>

                    {(job.ageLimitBn || job.applicationFeeBDT || job.subjectBreakdownBn) && (
                      <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 p-3 text-xs space-y-1 text-slate-700 dark:text-slate-300">
                        {job.subjectBreakdownBn && (
                          <p><strong>বিষয়ভিত্তিক চাহিদা:</strong> {job.subjectBreakdownBn}</p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {job.ageLimitBn && <span><strong>বয়স:</strong> {job.ageLimitBn}</span>}
                          {job.applicationFeeBDT && (
                            <span className="text-[#005a6e] dark:text-[#f0c95e] font-bold">
                              আবেদন ফি: ৳{job.applicationFeeBDT} (Bangla QR)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setViewingJob(job)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-sm font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>বিস্তারিত দেখুন</span>
                    </button>
                    <button
                      type="button"
                      data-testid={`apply-job-${job.id}`}
                      onClick={() =>
                        openApplyModal({
                          id: job.id,
                          titleBn: job.titleBn,
                          applicationFeeBDT: job.applicationFeeBDT,
                        })
                      }
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#2e0249] via-[#581c87] to-fuchsia-700 hover:opacity-95 text-white text-sm font-bold inline-flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>আবেদন করুন</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* 6-Card Benefits Grid ("কেন আমাদের টিমে যোগ দেবেন") */}
        <section className="space-y-7">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              কেন আমাদের টিমে যোগ দেবেন?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              মাহারাত মডেল মাদ্রাসায় শিক্ষক ও কর্মকর্তাদের জন্য বিশেষ সুযোগ-সুবিধাসমূহ
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, idx) => {
              const Icon = b.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-3 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2e0249] to-fuchsia-700 text-white flex items-center justify-center shadow-md">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {b.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4-Step Application Process ("আবেদনের প্রক্রিয়া") */}
        <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-7 sm:p-10 space-y-8 shadow-sm">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              আবেদনের প্রক্রিয়া
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              মাত্র ৪টি সহজ ধাপে আমাদের দক্ষ ফ্যাকাল্টি ও টিমের অংশ হোন
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div
                key={s.num}
                className="relative rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 p-5 space-y-3"
              >
                <span className="inline-flex w-10 h-10 rounded-xl bg-gradient-to-br from-[#2e0249] to-[#6b21a8] text-amber-300 font-extrabold text-base items-center justify-center shadow-sm">
                  {s.num}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {s.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Spontaneous General Application Banner ("উপযুক্ত পদ খুঁজে পাচ্ছেন না?") */}
        <section className="rounded-3xl bg-gradient-to-r from-[#140126] via-[#2e0249] to-[#6b21a8] text-white p-8 sm:p-10 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              উপযুক্ত পদ খুঁজে পাচ্ছেন না?
            </h2>
            <p className="text-sm sm:text-base text-purple-100/90 leading-relaxed">
              আপনার যদি কুরআন-সুন্নাহ, জেনারেল একাডেমিক, আইটি বা প্রশাসনিক ক্ষেত্রে দক্ষতা থাকে, তবে সাধারণ আবেদন হিসেবে আপনার সিভি জমা দিয়ে রাখুন। নতুন পদ সৃষ্টি হলে আমরা অগ্রাধিকার ভিত্তিতে আপনার সাথে যোগাযোগ করব।
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              openApplyModal({
                id: 'general-spontaneous',
                titleBn: 'সাধারণ আবেদন (ভবিষ্যৎ নিয়োগের জন্য সিভি জমা)',
              })
            }
            className="px-7 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-[#140126] font-extrabold text-sm sm:text-base shadow-lg inline-flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>সাধারণ সিভি জমা দিন</span>
          </button>
        </section>

        {/* Checklist ("আবেদনের সাথে যা পাঠাবেন") + Direct HR Contact */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-7 space-y-4">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-700 dark:text-amber-300" />
              <span>আবেদনের সাথে যা প্রস্তুত রাখবেন</span>
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
              {[
                'আপডেটেড জীবনবৃত্তান্ত (CV / Resume — PDF বা Google Drive লিংক)।',
                'সদ্য তোলা ২ কপি পাসপোর্ট সাইজের রঙিন ছবি।',
                'সকল শিক্ষাগত যোগ্যতা ও হিফজ/ক্বিরাত সনদের সত্যায়িত ফটোকপি।',
                'জাতীয় পরিচয়পত্র (NID)-এর ফটোকপি এবং পূর্ববর্তী অভিজ্ঞতার সনদ (যদি থাকে)।',
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-7 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-700 dark:text-amber-300" />
                <span>এইচআর ও নিয়োগ সহায়তা ডেস্ক</span>
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                নিয়োগ সংক্রান্ত যেকোনো জিজ্ঞাসায় সরাসরি আমাদের অফিসিয়াল ইমেইলে সিভি পাঠাতে পারেন অথবা অফিসে যোগাযোগ করতে পারেন।
              </p>
              <div className="space-y-2 text-sm font-semibold text-slate-800 dark:text-slate-200 pt-1">
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-700 dark:text-amber-300" />
                  <span>{state.settings.email}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-purple-700 dark:text-amber-300" />
                  <span>01886-340308 / 01901-631641</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onNavigateContact}
              className="self-start inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-amber-300 font-bold text-sm hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors cursor-pointer"
            >
              <span>ক্যাম্পাস লোকেশন ও যোগাযোগ দেখুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>

      {/* Job Details Modal */}
      {viewingJob && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-purple-700 dark:text-amber-300">
                  {viewingJob.departmentBn}
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {viewingJob.titleBn}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{viewingJob.campusBn}</p>
              </div>
              <button
                type="button"
                aria-label="Close job details"
                onClick={() => setViewingJob(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-sm bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-4">
              <p>
                <strong>বেতন:</strong> {viewingJob.salaryRangeBn}
              </p>
              <p>
                <strong>চাকরির ধরন:</strong> {viewingJob.employmentTypeBn}
              </p>
              <p>
                <strong>পদসংখ্যা:</strong> {viewingJob.vacancies} জন
              </p>
              <p>
                <strong>আবেদনের শেষ তারিখ:</strong> {viewingJob.deadline}
              </p>
              {viewingJob.ageLimitBn && (
                <p>
                  <strong>বয়সসীমা:</strong> {viewingJob.ageLimitBn}
                </p>
              )}
              {viewingJob.applicationFeeBDT && (
                <p>
                  <strong>আবেদন ফি (Bangla QR):</strong> ৳{viewingJob.applicationFeeBDT}/-
                </p>
              )}
              {viewingJob.priorityBn && (
                <p className="sm:col-span-2">
                  <strong>অগ্রাধিকার:</strong> {viewingJob.priorityBn}
                </p>
              )}
              {viewingJob.examDateNoteBn && (
                <p className="sm:col-span-2">
                  <strong>লিখিত ও ডেমো পরীক্ষা:</strong> {viewingJob.examDateNoteBn}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-900 dark:text-white">প্রয়োজনীয় যোগ্যতা:</h4>
              <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                {viewingJob.requirementsBn.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-700 dark:text-amber-300 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-900 dark:text-white">প্রধান দায়িত্বসমূহ:</h4>
              <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                {viewingJob.responsibilitiesBn.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewingJob(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm cursor-pointer"
              >
                বন্ধ করুন
              </button>
              <button
                type="button"
                onClick={() =>
                  openApplyModal({
                    id: viewingJob.id,
                    titleBn: viewingJob.titleBn,
                    applicationFeeBDT: viewingJob.applicationFeeBDT,
                  })
                }
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2e0249] to-fuchsia-700 text-white font-bold text-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>এই পদে আবেদন করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal (Guest or Signed-in Candidate) */}
      {applyingJob && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
              <div>
                <span className="text-xs font-bold text-purple-700 dark:text-amber-300">
                  {signedInCandidate
                    ? `প্রার্থী অ্যাকাউন্ট: ${signedInCandidate.email}`
                    : 'সরাসরি অনলাইন আবেদন (রেজিস্ট্রেশন ছাড়াই)'}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {applyingJob.titleBn}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close application modal"
                onClick={() => setApplyingJob(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {appSuccessId ? (
              <div className="py-8 text-center space-y-4" data-testid="career-apply-success">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  আবেদন সফলভাবে জমা হয়েছে!
                </h4>
                <p className="text-xs font-mono font-bold text-purple-700 dark:text-amber-300">
                  Application ID: {appSuccessId}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  আপনার আবেদন আমাদের এইচআর ড্যাশবোর্ডে সংরক্ষিত হয়েছে। শর্টলিস্ট হলে শীঘ্রই ফোন/ইমেইলে জানানো হবে।
                </p>
                <button
                  type="button"
                  onClick={() => setApplyingJob(null)}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#2e0249] to-fuchsia-700 text-white font-bold text-sm cursor-pointer"
                >
                  ধন্যবাদ, ফিরে যান
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplicationSubmit} className="space-y-4" noValidate>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      আবেদনকারীর পূর্ণ নাম *
                    </label>
                    <input
                      type="text"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="আপনার পূর্ণ নাম"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      মোবাইল নম্বর *
                    </label>
                    <input
                      type="tel"
                      value={appPhone}
                      onChange={(e) => setAppPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      ইমেইল ঠিকানা *
                    </label>
                    <input
                      type="email"
                      value={appEmail}
                      onChange={(e) => setAppEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      সর্বশেষ শিক্ষাগত যোগ্যতা *
                    </label>
                    <input
                      type="text"
                      value={appEducation}
                      onChange={(e) => setAppEducation(e.target.value)}
                      placeholder="যেমন: কামিল / অনার্স / হাফেজ"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      অভিজ্ঞতা (যদি থাকে)
                    </label>
                    <input
                      type="text"
                      value={appExperience}
                      onChange={(e) => setAppExperience(e.target.value)}
                      placeholder="যেমন: ৩ বছর / ফ্রেশার"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      প্রত্যাশিত বেতন (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      value={appSalary}
                      onChange={(e) => setAppSalary(e.target.value)}
                      placeholder="যেমন: ৳ ২২,০০০/-"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      হোয়াটসঅ্যাপ নম্বর (ঐচ্ছিক)
                    </label>
                    <input
                      type="tel"
                      value={appWhatsapp}
                      onChange={(e) => setAppWhatsapp(e.target.value)}
                      placeholder="01XXXXXXXXX (WhatsApp)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-[#005a6e]" />
                      <span>
                        Bangla QR ফি (৳{applyingJob.applicationFeeBDT || 200}) TrxID
                      </span>
                    </label>
                    <input
                      type="text"
                      value={appTrxId}
                      onChange={(e) => setAppTrxId(e.target.value)}
                      placeholder="যেমন: BQR26-984512"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    সিভি (CV / Resume) ফাইল আপলোড (PDF/DOC, সর্বোচ্চ ২MB) অথবা Google Drive লিংক
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={appCvLink}
                      onChange={(e) => setAppCvLink(e.target.value)}
                      placeholder="Google Drive / PDF লিংক দিন অথবা ফাইল বাছুন"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                    />
                    <label className="px-4 py-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-amber-300 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0">
                      <Upload className="w-4 h-4" />
                      <span>{appCvFileName ? 'ফাইল সংযুক্ত ✓' : 'PDF/DOC সিভি'}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleCvFilePick}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    সংক্ষিপ্ত পরিচিতি / কভার নোট
                  </label>
                  <textarea
                    rows={3}
                    value={appCoverLetter}
                    onChange={(e) => setAppCoverLetter(e.target.value)}
                    placeholder="আপনার পাঠদান বা কাজের অভিজ্ঞতা সম্পর্কে সংক্ষেপে লিখুন..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white resize-none"
                  />
                </div>

                {appError && (
                  <p className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl px-3.5 py-2">
                    {appError}
                  </p>
                )}

                <button
                  type="submit"
                  data-testid="career-apply-submit"
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#c026d3] via-[#7e22ce] to-[#4c0575] text-white font-extrabold text-sm sm:text-base shadow-lg cursor-pointer"
                >
                  আবেদন জমা দিন
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Optional Candidate Login/Register Modal */}
      {authModalMode && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {authModalMode === 'register' ? 'প্রার্থী অ্যাকাউন্ট তৈরি করুন' : 'প্রার্থী লগইন'}
              </h3>
              <button
                type="button"
                aria-label="Close auth modal"
                onClick={() => setAuthModalMode(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCandidateAuthSubmit} className="space-y-3.5">
              {authModalMode === 'register' && (
                <>
                  <input
                    type="text"
                    placeholder="পূর্ণ নাম *"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                  <input
                    type="tel"
                    placeholder="মোবাইল নম্বর *"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </>
              )}
              <input
                type="email"
                placeholder="ইমেইল ঠিকানা *"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
              <input
                type="password"
                placeholder="পাসওয়ার্ড *"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
              {authError && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 rounded-xl px-3 py-2">
                  {authError}
                </p>
              )}
              <button
                type="submit"
                disabled={isAuthSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2e0249] to-fuchsia-700 text-white font-extrabold text-sm disabled:opacity-60 cursor-pointer"
              >
                {authModalMode === 'register' ? 'অ্যাকাউন্ট তৈরি করুন' : 'লগইন করুন'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
