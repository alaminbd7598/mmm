import React, { useState } from 'react';
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Lock,
  MailCheck,
  Printer,
  RotateCcw,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import {
  ConfigurableRole,
  LeaveStatus,
  PhotoGalleryCategory,
  TeacherLeaveRequest,
} from '../types/cms';
import {
  AdminTabId,
  ALL_ADMIN_TABS,
  computeLeaveEndDate,
  DEFAULT_RBAC_MATRIX,
  filterLeaveRequests,
  hasRolePermission,
  LEAVE_DEPARTMENT_OPTIONS,
  LEAVE_DESIGNATION_OPTIONS,
  LEAVE_DURATION_OPTIONS,
  LEAVE_REASON_CATEGORY_OPTIONS,
  LEAVE_SUBSTITUTE_TEACHER_OPTIONS,
  LEAVE_TYPE_OPTIONS,
  normalizeResourcePermission,
  toBengaliDigits,
  validateLeaveRequestInput,
} from '../utils/cmsLogic';
import { generateLeaveApprovalPDF } from '../utils/pdfExport';
import { localizeDynamicText } from '../utils/i18nContent';

export const AdminLeaveManagementTab: React.FC = () => {
  const {
    state,
    currentUser,
    language,
    submitLeaveRequest,
    reviewLeaveRequest,
    deleteLeaveRequest,
  } = useCMS();

  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  const userRole = currentUser?.role || 'Super Admin';
  const canEdit = hasRolePermission(userRole, 'leaves', 'edit', state.rbacMatrix);
  const canDelete = hasRolePermission(userRole, 'leaves', 'delete', state.rbacMatrix);
  // Chairman / Managing Director, Principal / Vice Principal, and Super Admin can review, comment, and approve/reject
  const canApproveLeave =
    (userRole === 'Super Admin' ||
      userRole === 'Chairman / Managing Director' ||
      userRole === 'Principal / Vice Principal') &&
    canEdit;

  // Form state for Dropdown-based Leave Request
  const [teacherName, setTeacherName] = useState(
    currentUser?.role === 'Coordinators / Teachers'
      ? currentUser.fullName
      : 'Ustad Hafez Maulana Mahmudul Hasan'
  );
  const [department, setDepartment] = useState(LEAVE_DEPARTMENT_OPTIONS[0].en);
  const [designation, setDesignation] = useState(LEAVE_DESIGNATION_OPTIONS[0].en);
  const [leaveType, setLeaveType] = useState(LEAVE_TYPE_OPTIONS[0].en);
  const [totalDays, setTotalDays] = useState<number>(3);
  const [startDate, setStartDate] = useState<string>('2026-11-25');
  const [reasonCategory, setReasonCategory] = useState(
    LEAVE_REASON_CATEGORY_OPTIONS[0].en
  );
  const [substituteTeacher, setSubstituteTeacher] = useState(
    LEAVE_SUBSTITUTE_TEACHER_OPTIONS[1].en
  );
  const [emergencyPhone, setEmergencyPhone] = useState('01715-889900');
  const [reasonDetails, setReasonDetails] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Filter & Review state
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'All'>('All');
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
  const [previewLeave, setPreviewLeave] = useState<TeacherLeaveRequest | null>(null);

  // Visual View Mode: 'list' (Application Form & Review) vs 'calendar' (Monthly Visual Calendar & Team View)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedTeacherQuota, setSelectedTeacherQuota] = useState<string>(
    currentUser?.role === 'Coordinators / Teachers' ? currentUser.fullName : 'Ustad Hafez Maulana Mahmudul Hasan'
  );
  const [calendarDate, setCalendarDate] = useState<Date>(new Date(2026, 10, 1)); // Default Nov 2026
  const [dayModalDate, setDayModalDate] = useState<string | null>(null);
  const [dayModalLeaves, setDayModalLeaves] = useState<TeacherLeaveRequest[] | null>(null);

  const computedEndDate = computeLeaveEndDate(startDate, totalDays);

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setFormError(null);

    const validation = validateLeaveRequestInput(
      {
        teacherName,
        department,
        designation,
        leaveType,
        startDate,
        totalDays,
        reasonCategory,
        substituteTeacher,
      },
      language
    );

    if (!validation.valid) {
      setFormError(
        validation.error ||
          tr(
            'অনুগ্রহ করে সকল আবশ্যক ঘর পূরণ করুন।',
            'Please complete all required fields.',
            'يرجى إكمال جميع الحقول المطلوبة.'
          )
      );
      return;
    }

    submitLeaveRequest({
      teacherId: currentUser?.id || 'usr-teacher',
      teacherName: teacherName.trim(),
      teacherUsername: currentUser?.username || 'teacher',
      department,
      designation,
      leaveType,
      startDate,
      endDate: computedEndDate,
      totalDays,
      reasonCategory,
      reasonDetails:
        reasonDetails.trim() ||
        `${reasonCategory} — ${totalDays} day(s) leave requested with class coverage by ${substituteTeacher}.`,
      substituteTeacher,
      emergencyPhone: emergencyPhone.trim() || '01715-889900',
    });

    setReasonDetails('');
  };

  const allLeaves = state.leaveRequests || [];
  const filteredLeaves = filterLeaveRequests(allLeaves, statusFilter);

  const totalCount = allLeaves.length;
  const pendingCount = allLeaves.filter((l) => l.status === 'Pending').length;
  const approvedCount = allLeaves.filter((l) => l.status === 'Approved').length;
  const rejectedCount = allLeaves.filter((l) => l.status === 'Rejected').length;

  const translateOption = (
    list: readonly { en: string; bn: string; ar: string }[],
    enVal: string
  ) => {
    const found = list.find((i) => i.en === enVal);
    if (!found) return language === 'bn' ? enVal : localizeDynamicText(enVal, language);
    return language === 'bn' ? found.bn : language === 'ar' ? found.ar : found.en;
  };

  // Annual 20-Day Paid Leave Quota calculations
  const ANNUAL_PAID_LEAVE_QUOTA = 20;
  const teacherApprovedLeaves = allLeaves.filter(
    (l) =>
      l.status === 'Approved' &&
      (selectedTeacherQuota === 'All' || l.teacherName === selectedTeacherQuota)
  );
  const usedPaidDays = teacherApprovedLeaves.reduce((sum, l) => sum + (l.totalDays || 0), 0);
  const remainingPaidDays = Math.max(0, ANNUAL_PAID_LEAVE_QUOTA - usedPaidDays);
  const quotaPercentage = Math.min(100, Math.round((usedPaidDays / ANNUAL_PAID_LEAVE_QUOTA) * 100));

  const casualUsed = teacherApprovedLeaves
    .filter((l) => /casual|নৈমিত্তিক|اعتيادية/i.test(l.leaveType))
    .reduce((s, l) => s + l.totalDays, 0);
  const medicalUsed = teacherApprovedLeaves
    .filter((l) => /medical|sick|চিকিৎসা|مرضية/i.test(l.leaveType))
    .reduce((s, l) => s + l.totalDays, 0);
  const emergencyUsed = teacherApprovedLeaves
    .filter((l) => /emergency|urgent|জরুরি|طارئة/i.test(l.leaveType))
    .reduce((s, l) => s + l.totalDays, 0);

  // Calendar calculations
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay(); // 0 is Sunday

  // Get leaves for a specific day string (YYYY-MM-DD)
  const getLeavesForDate = (dateStr: string) => {
    return allLeaves.filter((l) => l.startDate <= dateStr && dateStr <= l.endDate);
  };

  // Month navigation
  const prevMonth = () => setCalendarDate(new Date(calYear, calMonth - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(calYear, calMonth + 1, 1));
  const goToToday = () => setCalendarDate(new Date(2026, 10, 1));

  // Month names
  const monthNamesBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];
  const currentMonthLabel =
    language === 'bn'
      ? `${monthNamesBn[calMonth]} ${calYear}`
      : language === 'ar'
        ? `${monthNamesAr[calMonth]} ${calYear}`
        : `${monthNamesEn[calMonth]} ${calYear}`;

  const weekDayHeaders = [
    { bn: 'রবি', en: 'Sun', ar: 'الأحد' },
    { bn: 'সোম', en: 'Mon', ar: 'الإثنين' },
    { bn: 'মঙ্গল', en: 'Tue', ar: 'الثلاثاء' },
    { bn: 'বুধ', en: 'Wed', ar: 'الأربعاء' },
    { bn: 'বৃহঃ', en: 'Thu', ar: 'الخميس' },
    { bn: 'শুক্র', en: 'Fri', ar: 'الجمعة' },
    { bn: 'শনি', en: 'Sat', ar: 'السبت' },
  ];

  // Today availability calculation (demo date: 2026-11-25)
  const todayStr = '2026-11-25';
  const todayLeaves = getLeavesForDate(todayStr).filter((l) => l.status === 'Approved');

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-[#2e0249] via-[#4c0575] to-[#2e0249] text-white rounded-2xl p-6 shadow-xl border border-purple-500/30 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-fuchsia-500/15 blur-2xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-purple-950 text-xs font-black uppercase tracking-wider">
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>
                {tr(
                  'শিক্ষক ছুটি ব্যবস্থাপনা ও A4 PDF অনুমোদন সনদ',
                  'Teacher Leave Management & A4 PDF Approval System',
                  'نظام إدارة إجازات المعلمين وشهادة الموافقة A4 PDF'
                )}
              </span>
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              {tr(
                'শিক্ষক ছুটির আবেদন, অধ্যক্ষ/চেয়ারম্যান রিভিউ ও অফিসিয়াল A4 PDF ডাউনলোড',
                'Teacher Leave Application, Principal/Chairman Review & A4 PDF Certificate',
                'طلبات إجازات المعلمين ومراجعة المدير/الرئيس وتحميل شهادة A4 PDF'
              )}
            </h2>
            <p className="text-xs sm:text-sm text-purple-200">
              {tr(
                'শিক্ষকবৃন্দ ড্রপডাউন ফর্মের মাধ্যমে ছুটির আবেদন জমা দিতে পারবেন এবং অধ্যক্ষ/চেয়ারম্যান মন্তব্যসহ অনুমোদন করলে অফিসিয়াল A4 PDF ডাউনলোড করা যাবে।',
                'Teachers can submit leave requests via the dropdown form; Principal/Chairman can review, comment, and approve for instant A4 PDF download.',
                'يمكن للمعلمين تقديم طلبات الإجازة عبر القائمة المنسدلة، ويمكن للمدير المراجعة والتعليق والموافقة لتحميل ملف A4 PDF.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl px-3.5 py-2.5 text-center">
              <div className="text-lg font-black text-white">{totalCount}</div>
              <div className="text-[11px] font-bold text-purple-200">
                {tr('মোট আবেদন', 'Total Requests', 'إجمالي الطلبات')}
              </div>
            </div>
            <div className="bg-amber-400/20 border border-amber-300/30 rounded-xl px-3.5 py-2.5 text-center">
              <div className="text-lg font-black text-amber-300">{pendingCount}</div>
              <div className="text-[11px] font-bold text-amber-100">
                {tr('বিবেচনাধীন', 'Pending', 'قيد المراجعة')}
              </div>
            </div>
            <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-xl px-3.5 py-2.5 text-center">
              <div className="text-lg font-black text-emerald-300">{approvedCount}</div>
              <div className="text-[11px] font-bold text-emerald-100">
                {tr('অনুমোদিত', 'Approved', 'معتمد')}
              </div>
            </div>
            <div className="bg-rose-500/20 border border-rose-400/30 rounded-xl px-3.5 py-2.5 text-center">
              <div className="text-lg font-black text-rose-300">{rejectedCount}</div>
              <div className="text-[11px] font-bold text-rose-100">
                {tr('বাতিল', 'Rejected', 'مرفوض')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Annual 20-Day Paid Leave Quota & Visual Progress Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200">
                <CalendarDays className="w-4 h-4" />
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {tr(
                  'বার্ষিক পেইড ছুটি কোটা ও প্রগ্রেস ট্র্যাকার (২০ দিন কোটা)',
                  'Annual Paid Leave Quota & Progress Bar (20-Day Policy)',
                  'رصيد الإجازات المدفوعة السنوي وشريط التقدم (٢٠ يوماً)'
                )}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              {tr(
                'শিক্ষকবৃন্দের বার্ষিক ২০ দিনের পেইড ছুটির ব্যালেন্স, ব্যবহৃত অনুমোদিত দিন এবং অবশিষ্ট কোটার রিয়েল-টাইম ট্র্যাকিং।',
                'Real-time tracking of 20-day annual paid leave allowance, approved used days, and remaining balances.',
                'تتبع فوري لرصيد الإجازات السنوية المدفوعة البالغ ٢٠ يوماً والأيام المستنفذة والمتبقية.'
              )}
            </p>
          </div>

          {/* Profile Filter Dropdown */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
              {tr('শিক্ষক প্রোফাইল:', 'Teacher Profile:', 'ملف المعلم:')}
            </span>
            <select
              value={selectedTeacherQuota}
              onChange={(e) => setSelectedTeacherQuota(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="Ustad Hafez Maulana Mahmudul Hasan">
                {tr(
                  'উস্তাদ হাফেজ মাওলানা মাহমুদুল হাসান',
                  'Ustad Hafez Maulana Mahmudul Hasan',
                  'الأستاذ الحافظ مولانا محمود الحسن'
                )}
              </option>
              <option value="Teacher Sajidul Islam">
                {tr('শিক্ষক সাজিদুল ইসলাম', 'Teacher Sajidul Islam', 'المعلم ساجد الإسلام')}
              </option>
              <option value="All">
                {tr('সকল শিক্ষক (সামগ্রিক)', 'All Teachers (Aggregate)', 'جميع المعلمين (إجمالي)')}
              </option>
            </select>
          </div>
        </div>

        {/* Visual Progress Bar Section */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span>{tr('ব্যবহৃত দিন:', 'Used Days:', 'الأيام المستنفذة:')}</span>
              <span className="text-sm font-black text-purple-700 dark:text-purple-300">
                {usedPaidDays} {tr('দিন', 'Days', 'أيام')}
              </span>
              <span className="text-[11px] text-slate-500">({quotaPercentage}%)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-700 dark:text-slate-300">
                {tr('অবশিষ্ট পেইড ছুটি:', 'Remaining Paid Leave:', 'الإجازة المتبقية:')}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black ${
                  remainingPaidDays > 10
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                    : remainingPaidDays >= 5
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                }`}
              >
                {remainingPaidDays} / {ANNUAL_PAID_LEAVE_QUOTA} {tr('দিন', 'Days', 'أيام')}
              </span>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                remainingPaidDays > 10
                  ? 'from-emerald-500 to-teal-400'
                  : remainingPaidDays >= 5
                    ? 'from-amber-500 to-orange-400'
                    : 'from-rose-500 to-red-400'
              }`}
              style={{ width: `${Math.max(4, quotaPercentage)}%` }}
            />
          </div>
        </div>

        {/* 3 Sub-Quota Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                <span>🌴</span>
                <span>{tr('নৈমিত্তিক ছুটি (Casual)', 'Casual Leave', 'إجازة اعتيادية')}</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-purple-700 dark:text-purple-300">
                {tr('কোটা: ১০ দিন', 'Quota: 10d', 'الحد: ١٠')}
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span>{tr(`ব্যবহৃত: ${casualUsed} দিন`, `Used: ${casualUsed}d`, `المستخدم: ${casualUsed}`)}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {tr(`অবশিষ্ট: ${Math.max(0, 10 - casualUsed)} দিন`, `Left: ${Math.max(0, 10 - casualUsed)}d`, `المتبقي: ${Math.max(0, 10 - casualUsed)}`)}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                <span>🩺</span>
                <span>{tr('চিকিৎসা ছুটি (Medical)', 'Medical Leave', 'إجازة مرضية')}</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-blue-700 dark:text-blue-300">
                {tr('কোটা: ৭ দিন', 'Quota: 7d', 'الحد: ٧')}
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span>{tr(`ব্যবহৃত: ${medicalUsed} দিন`, `Used: ${medicalUsed}d`, `المستخدم: ${medicalUsed}`)}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {tr(`অবশিষ্ট: ${Math.max(0, 7 - medicalUsed)} দিন`, `Left: ${Math.max(0, 7 - medicalUsed)}d`, `المتبقي: ${Math.max(0, 7 - medicalUsed)}`)}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                <span>🚨</span>
                <span>{tr('জরুরি ছুটি (Emergency)', 'Emergency Leave', 'إجازة طارئة')}</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300">
                {tr('কোটা: ৩ দিন', 'Quota: 3d', 'الحد: ٣')}
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span>{tr(`ব্যবহৃত: ${emergencyUsed} দিন`, `Used: ${emergencyUsed}d`, `المستخدم: ${emergencyUsed}`)}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {tr(`অবশিষ্ট: ${Math.max(0, 3 - emergencyUsed)} দিন`, `Left: ${Math.max(0, 3 - emergencyUsed)}d`, `المتبقي: ${Math.max(0, 3 - emergencyUsed)}`)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Automated Email Notification System Banner */}
      <div className="bg-gradient-to-r from-purple-50 via-fuchsia-50 to-purple-50 dark:from-purple-950/30 dark:via-fuchsia-950/20 dark:to-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <MailCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-purple-950 dark:text-purple-200">
              {tr(
                'স্বয়ংক্রিয় ইমেইল নোটিফিকেশন সিস্টেম সক্রিয়',
                'Automated Email Notification System Active',
                'نظام إشعارات البريد الإلكتروني الآلي مفعل'
              )}
            </div>
            <div className="text-slate-600 dark:text-slate-300 text-[11px]">
              {tr(
                'অধ্যক্ষ বা চেয়ারম্যান ছুটি অনুমোদন/বাতিল করলে সংশ্লিষ্ট শিক্ষক ও প্রশাসনকে তৎক্ষণাৎ অফিসিয়াল ইমেইল অ্যালার্ট পাঠানো হয়।',
                'Instant official email alerts and audit logs are dispatched when Principal/Chairman approves or rejects any leave.',
                'يتم إرسال إشعار بريدي رسمي فوري وحفظ السجل عند اعتماد أو رفض طلب الإجازة من قبل الإدارة.'
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 font-mono font-bold text-purple-900 dark:text-purple-300">
            {state.emails.length} {tr('টি ইমেইল প্রেরিত', 'Emails Sent', 'رسائل مرسلة')}
          </span>
        </div>
      </div>

      {/* View Mode Switcher Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-purple-100 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-colors ${
              viewMode === 'list'
                ? 'bg-gradient-to-r from-purple-700 to-fuchsia-700 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>
              {tr(
                'আবেদন ফর্ম ও রিভিউ তালিকা',
                'Application Form & Review List',
                'نموذج التقديم وقائمة المراجعة'
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-colors ${
              viewMode === 'calendar'
                ? 'bg-gradient-to-r from-purple-700 to-fuchsia-700 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>
              {tr(
                'ইন্টারেক্টিভ ক্যালেন্ডার ও টিম উপস্থিতি',
                'Visual Calendar & Team Availability',
                'التقويم التفاعلي وتوافر الفريق'
              )}
            </span>
          </button>
        </div>

        <span className="text-xs font-bold text-purple-800 dark:text-purple-300 font-mono hidden sm:inline">
          {viewMode === 'list'
            ? `${filteredLeaves.length} ${tr('টি আবেদন প্রদর্শিত', 'Requests Shown', 'طلبات معروضة')}`
            : currentMonthLabel}
        </span>
      </div>

      {/* VIEW MODE 1: LIST & FORM VIEW */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Dropdown-Based Teacher Leave Request Form */}
        <div className="xl:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-slate-800 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3.5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>
                  {tr(
                    'নতুন ছুটির আবেদন ফর্ম (ড্রপডাউন ভিত্তিক)',
                    'Submit Leave Request (Dropdown Form)',
                    'نموذج تقديم طلب إجازة (قوائم منسدلة)'
                  )}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {tr(
                  'তালিকা থেকে ছুটির ধরন, বিভাগ, মেয়াদ ও বিকল্প শিক্ষক নির্বাচন করুন',
                  'Select leave type, department, duration, and substitute teacher from dropdowns',
                  'اختر نوع الإجازة والقسم والمدة والمعلم البديل من القوائم'
                )}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 text-[11px] font-extrabold">
              {userRole}
            </span>
          </div>

          {!canEdit && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>
                {tr(
                  'আপনার রোলে ছুটির আবেদন জমা বা সম্পাদনার অনুমতি নেই (View Only)।',
                  'Your current role has View-Only access to Leave Management.',
                  'دورك الحالي يملك صلاحية العرض فقط لطلبات الإجازة.'
                )}
              </span>
            </div>
          )}

          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs font-bold">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmitLeave} className="space-y-4">
            {/* Teacher Name Dropdown / Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {tr('আবেদনকারী শিক্ষকের নাম *', 'Applicant Teacher Name *', 'اسم المعلم مقدم الطلب *')}
              </label>
              <select
                disabled={!canEdit}
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-bold"
              >
                <option value="Ustad Hafez Maulana Mahmudul Hasan">
                  {tr(
                    'উস্তাদ হাফেজ মাওলানা মাহমুদুল হাসান (হিফজ ও তাজবীদ)',
                    'Ustad Hafez Maulana Mahmudul Hasan (Hifz & Tajweed)',
                    'الأستاذ الحافظ مولانا محمود الحسن (التحفيظ والتجويد)'
                  )}
                </option>
                <option value="Teacher Sajidul Islam">
                  {tr(
                    'শিক্ষক সাজিদুল ইসলাম (আইটি ও স্পোকেন ইংলিশ)',
                    'Teacher Sajidul Islam (IT & Spoken English)',
                    'المعلم ساجد الإسلام (تقنية المعلومات والإنجليزية)'
                  )}
                </option>
                <option value="Ustad Qari Abdullah Al-Mamun">
                  {tr(
                    'উস্তাদ ক্বারী আব্দুল্লাহ আল-মামুন (নূরানী ও ক্বিরাত)',
                    'Ustad Qari Abdullah Al-Mamun (Noorani & Qirat)',
                    'الأستاذ القارئ عبد الله المأمون (النورانية والقراءات)'
                  )}
                </option>
                <option value="Teacher Farhana Akter">
                  {tr(
                    'শিক্ষিকা ফারহানা আক্তার (জেনারেল ও প্রি-স্কুল)',
                    'Teacher Farhana Akter (General & Pre-School)',
                    'المعلمة فرحانة أختر (التعليم العام والتمهيدي)'
                  )}
                </option>
                <option value="Maulana Tariqul Islam">
                  {tr(
                    'মাওলানা তারিকুল ইসলাম (আরবি সাহিত্য ও ফিকহ)',
                    'Maulana Tariqul Islam (Arabic & Fiqh)',
                    'مولانا طارق الإسلام (اللغة العربية والفقه)'
                  )}
                </option>
              </select>
            </div>

            {/* Department & Designation Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {tr('বিভাগ নির্বাচন করুন *', 'Department *', 'القسم الأكاديمي *')}
                </label>
                <select
                  disabled={!canEdit}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                >
                  {LEAVE_DEPARTMENT_OPTIONS.map((opt) => (
                    <option key={opt.en} value={opt.en}>
                      {language === 'bn' ? opt.bn : language === 'ar' ? opt.ar : opt.en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {tr('পদবি নির্বাচন করুন *', 'Designation *', 'المسمى الوظيفي *')}
                </label>
                <select
                  disabled={!canEdit}
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                >
                  {LEAVE_DESIGNATION_OPTIONS.map((opt) => (
                    <option key={opt.en} value={opt.en}>
                      {language === 'bn' ? opt.bn : language === 'ar' ? opt.ar : opt.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Leave Type & Duration Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {tr('ছুটির ধরন (Leave Type) *', 'Leave Type *', 'نوع الإجازة *')}
                </label>
                <select
                  disabled={!canEdit}
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                >
                  {LEAVE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.en} value={opt.en}>
                      {language === 'bn' ? opt.bn : language === 'ar' ? opt.ar : opt.en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {tr('ছুটির মেয়াদ (মোট দিন) *', 'Duration (Total Days) *', 'مدة الإجازة (عدد الأيام) *')}
                </label>
                <select
                  disabled={!canEdit}
                  value={totalDays}
                  onChange={(e) => setTotalDays(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                >
                  {LEAVE_DURATION_OPTIONS.map((opt) => (
                    <option key={opt.days} value={opt.days}>
                      {language === 'bn' ? opt.bn : language === 'ar' ? opt.ar : opt.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Start Date & Auto-Calculated End Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {tr('ছুটি শুরুর তারিখ *', 'Start Date *', 'تاريخ بدء الإجازة *')}
                </label>
                <input
                  type="date"
                  disabled={!canEdit}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {tr('সমাপ্তির তারিখ (স্বয়ংক্রিয়)', 'End Date (Auto-Calculated)', 'تاريخ الانتهاء (تلقائي)')}
                </label>
                <input
                  type="text"
                  readOnly
                  value={computedEndDate}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-slate-700 bg-purple-50/60 dark:bg-slate-800 text-xs font-extrabold text-purple-900 dark:text-purple-200"
                />
              </div>
            </div>

            {/* Reason Category Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {tr('ছুটির প্রধান কারণ (ড্রপডাউন) *', 'Reason Category (Dropdown) *', 'سبب الإجازة الرئيسي *')}
              </label>
              <select
                disabled={!canEdit}
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
              >
                {LEAVE_REASON_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.en} value={opt.en}>
                    {language === 'bn' ? opt.bn : language === 'ar' ? opt.ar : opt.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Substitute / Coverage Teacher Dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {tr('বিকল্প ক্লাস গ্রহণকারী শিক্ষক *', 'Substitute / Coverage Teacher *', 'المعلم البديل لتغطية الحصص *')}
                </label>
                <select
                  disabled={!canEdit}
                  value={substituteTeacher}
                  onChange={(e) => setSubstituteTeacher(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                >
                  {LEAVE_SUBSTITUTE_TEACHER_OPTIONS.map((opt) => (
                    <option key={opt.en} value={opt.en}>
                      {language === 'bn' ? opt.bn : language === 'ar' ? opt.ar : opt.en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {tr('জরুরি মোবাইল নম্বর', 'Emergency Mobile No.', 'رقم الطوارئ')}
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                />
              </div>
            </div>

            {/* Additional Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {tr(
                  'বিস্তারিত বিবরণ বা ক্লাস হ্যান্ডওভার নোট (ঐচ্ছিক)',
                  'Additional Notes / Class Handover Details (Optional)',
                  'ملاحظات إضافية أو تفاصيل تسليم الحصص (اختياري)'
                )}
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
                placeholder={tr(
                  'ছুটিকালীন ক্লাস ও দায়িত্ব হস্তান্তরের সংক্ষিপ্ত বিবরণ লিখুন...',
                  'Write brief handover instructions or notes for the Principal...',
                  'اكتب تفاصيل مختصرة حول تسليم المهام للمدير...'
                )}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={!canEdit}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-700 via-fuchsia-600 to-purple-700 hover:from-purple-600 hover:to-fuchsia-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>
                {tr(
                  'অধ্যক্ষ / চেয়ারম্যান বরাবর ছুটির আবেদন জমা দিন',
                  'Submit Leave Request to Principal / Chairman',
                  'إرسال طلب الإجازة إلى المدير / الرئيس'
                )}
              </span>
            </button>
          </form>
        </div>

        {/* Right Column: Leave Requests Queue, Principal Review & A4 PDF Download */}
        <div className="xl:col-span-7 space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-purple-600" />
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                {tr(
                  'ছুটির আবেদন তালিকা ও অধ্যক্ষ অনুমোদন প্যানেল',
                  'Leave Requests & Principal Approval Queue',
                  'قائمة طلبات الإجازة ولوحة موافقة المدير'
                )}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50'
                  }`}
                >
                  {st === 'All'
                    ? tr('সকল', 'All', 'الكل')
                    : st === 'Pending'
                      ? tr('বিবেচনাধীন', 'Pending', 'قيد المراجعة')
                      : st === 'Approved'
                        ? tr('অনুমোদিত', 'Approved', 'معتمد')
                        : tr('বাতিল', 'Rejected', 'مرفوض')}
                </button>
              ))}
            </div>
          </div>

          {/* Leave Cards */}
          <div className="space-y-4">
            {filteredLeaves.map((leave) => {
              const commentVal =
                reviewComments[leave.id] !== undefined
                  ? reviewComments[leave.id]
                  : leave.reviewerComment || '';

              return (
                <div
                  key={leave.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-slate-800 p-5 shadow-xs space-y-4"
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-900 dark:text-purple-200 text-xs font-black">
                          {leave.id}
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {language === 'bn'
                            ? leave.teacherName
                            : localizeDynamicText(leave.teacherName, language)}
                        </h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold flex items-center gap-1 ${
                            leave.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : leave.status === 'Rejected'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {leave.status === 'Approved' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : leave.status === 'Rejected' ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {leave.status === 'Approved'
                              ? tr('অনুমোদিত (Approved)', 'Approved', 'معتمد')
                              : leave.status === 'Rejected'
                                ? tr('বাতিল (Rejected)', 'Rejected', 'مرفوض')
                                : tr('বিবেচনাধীন (Pending)', 'Pending Review', 'قيد المراجعة')}
                          </span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {translateOption(LEAVE_DESIGNATION_OPTIONS, leave.designation)} ·{' '}
                        {translateOption(LEAVE_DEPARTMENT_OPTIONS, leave.department)}
                      </p>
                    </div>

                    {/* Action Buttons: Preview A4 Letterhead & Download A4 PDF */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewLeave(leave)}
                        className="px-3 py-2 rounded-xl bg-purple-50 dark:bg-slate-800 hover:bg-purple-100 text-purple-800 dark:text-purple-200 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer border border-purple-200 dark:border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>
                          {tr('A4 সনদ প্রিভিউ', 'Preview A4 Certificate', 'معاينة شهادة A4')}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => generateLeaveApprovalPDF(leave, state.settings)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-purple-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>
                          {tr('A4 PDF ডাউনলোড', 'Download A4 PDF', 'تحميل A4 PDF')}
                        </span>
                      </button>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => deleteLeaveRequest(leave.id)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title={tr('মুছে ফেলুন', 'Delete Request', 'حذف الطلب')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Leave Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-purple-50/40 dark:bg-slate-800/50 rounded-xl p-3.5 border border-purple-100/80 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 block font-semibold">
                        {tr('ছুটির ধরন ও মেয়াদ:', 'Leave Type & Duration:', 'نوع الإجازة والمدة:')}
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {translateOption(LEAVE_TYPE_OPTIONS, leave.leaveType)} ({leave.totalDays}{' '}
                        {tr('দিন', 'Days', 'أيام')})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-semibold">
                        {tr('তারিখ পরিসর:', 'Leave Dates:', 'تاريخ الإجازة:')}
                      </span>
                      <span className="font-extrabold text-purple-800 dark:text-purple-300">
                        {leave.startDate} → {leave.endDate}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-semibold">
                        {tr('বিকল্প ক্লাস শিক্ষক:', 'Substitute Teacher:', 'المعلم البديل:')}
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {translateOption(
                          LEAVE_SUBSTITUTE_TEACHER_OPTIONS,
                          leave.substituteTeacher
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {tr('প্রধান কারণ:', 'Reason Category:', 'السبب الرئيسي:')}{' '}
                      </span>
                      <span>
                        {translateOption(LEAVE_REASON_CATEGORY_OPTIONS, leave.reasonCategory)}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      {language === 'bn'
                        ? leave.reasonDetails
                        : localizeDynamicText(leave.reasonDetails, language)}
                    </p>
                  </div>

                  {/* Existing Principal Comment Display */}
                  {leave.reviewerComment && (
                    <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3.5 text-xs space-y-1">
                      <div className="font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                        <span>
                          {tr(
                            'অধ্যক্ষ / চেয়ারম্যানের অফিসিয়াল মন্তব্য ও অনুমোদন নোট:',
                            'Principal / Chairman Official Review Comment:',
                            'تعليق وملاحظة المدير / الرئيس الرسمي:'
                          )}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          {leave.reviewedBy || 'Honorable Principal / Chairman'} ·{' '}
                          {leave.reviewedAt || leave.submittedAt}
                        </span>
                      </div>
                      <p className="text-emerald-950 dark:text-emerald-100 font-medium">
                        {language === 'bn'
                          ? leave.reviewerComment
                          : localizeDynamicText(leave.reviewerComment, language)}
                      </p>
                    </div>
                  )}

                  {/* Principal / Chairman Interactive Review & Approval Controls */}
                  {canApproveLeave ? (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                      <label className="block text-xs font-extrabold text-purple-900 dark:text-purple-200">
                        {tr(
                          'অধ্যক্ষ / চেয়ারম্যানের মন্তব্য লিখুন এবং অনুমোদন বা বাতিল করুন:',
                          'Principal / Chairman Review Comment & Decision:',
                          'تعليق المدير / الرئيس وقرار الاعتماد:'
                        )}
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <input
                          type="text"
                          value={commentVal}
                          onChange={(e) =>
                            setReviewComments({
                              ...reviewComments,
                              [leave.id]: e.target.value,
                            })
                          }
                          placeholder={tr(
                            'যেমন: পূর্ণ বেতনে ৩ দিনের ছুটি অনুমোদিত হলো। বিকল্প শিক্ষক ক্লাস পরিচালনা করবেন।',
                            'e.g. Approved with full pay. Substitute teacher will cover scheduled classes.',
                            'مثال: تمت الموافقة على الإجازة براتب كامل مع تغطية الحصص.'
                          )}
                          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        />
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              reviewLeaveRequest(
                                leave.id,
                                'Approved',
                                commentVal ||
                                  'Approved by Principal / Chairman. Substitute teacher assigned for class coverage.',
                                currentUser?.fullName || 'Honorable Principal / Chairman'
                              )
                            }
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{tr('অনুমোদন করুন', 'Approve', 'موافقة')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              reviewLeaveRequest(
                                leave.id,
                                'Rejected',
                                commentVal ||
                                  'Unable to approve during upcoming examination schedule.',
                                currentUser?.fullName || 'Honorable Principal / Chairman'
                              )
                            }
                            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{tr('বাতিল করুন', 'Reject', 'رفض')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic">
                      {tr(
                        'টিপস: অধ্যক্ষ (Principal) বা সুপার অ্যাডমিন রোলে সুইচ করে এই আবেদনটি রিভিউ ও অনুমোদন করতে পারবেন।',
                        'Tip: Switch to Principal or Super Admin role in the sidebar to review, comment, and approve this request.',
                        'ملاحظة: يمكنك التبديل إلى دور المدير أو المشرف العام لمراجعة هذا الطلب واعتماده.'
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {/* VIEW MODE 2: INTERACTIVE MONTHLY VISUAL CALENDAR & TEAM AVAILABILITY */}
      {viewMode === 'calendar' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-slate-800 p-6 shadow-xs space-y-5">
          {/* Calendar Header with Navigation and Availability Summary */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-purple-50 dark:bg-purple-950/50 rounded-xl p-1 border border-purple-200 dark:border-purple-800">
                <button
                  type="button"
                  onClick={prevMonth}
                  aria-label="Previous Month"
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-purple-900 dark:text-purple-200 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
                </button>
                <span className="px-4 text-sm sm:text-base font-extrabold text-purple-950 dark:text-white min-w-[150px] text-center">
                  {currentMonthLabel}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  aria-label="Next Month"
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-purple-900 dark:text-purple-200 cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                </button>
              </div>

              <button
                type="button"
                onClick={goToToday}
                className="px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/40 text-xs font-bold text-purple-900 dark:text-purple-300 cursor-pointer"
              >
                {tr('নভেম্বর ২০২৬ (আজ)', 'Nov 2026 (Today)', 'نوفمبر ٢٠٢٦')}
              </button>
            </div>

            {/* Team Availability Today Summary */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-900 dark:text-purple-200 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>
                  {tr('আজকের তারিখ:', 'Today:', 'اليوم:')} 25 Nov 2026
                </span>
              </span>

              {todayLeaves.length > 0 ? (
                <span className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-bold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {tr(
                      `আজ ছুটিতে: ${todayLeaves.map((l) => l.teacherName.split(' ')[0]).join(', ')}`,
                      `On Leave: ${todayLeaves.map((l) => l.teacherName.split(' ')[0]).join(', ')}`,
                      `في إجازة اليوم: ${todayLeaves.length}`
                    )}
                  </span>
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {tr('সকল শিক্ষক আজ উপস্থিত', 'All Faculty Available Today', 'جميع المعلمين متاحون اليوم')}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Calendar Day Labels and Cells Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Day Headers (Sun - Sat) */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {weekDayHeaders.map((dh, i) => (
                  <div
                    key={i}
                    className="py-2 text-center text-xs font-black uppercase tracking-wider text-purple-900 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 rounded-xl"
                  >
                    {language === 'bn' ? dh.bn : language === 'ar' ? dh.ar : dh.en}
                  </div>
                ))}
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty cells before month start */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="min-h-[90px] rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 opacity-40"
                  />
                ))}

                {/* Days of month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(
                    dayNum
                  ).padStart(2, '0')}`;
                  const isToday = dateStr === todayStr;
                  const leavesOnDay = getLeavesForDate(dateStr);

                  return (
                    <div
                      key={`day-${dayNum}`}
                      onClick={() => {
                        if (leavesOnDay.length > 0) {
                          setDayModalDate(dateStr);
                          setDayModalLeaves(leavesOnDay);
                        }
                      }}
                      className={`min-h-[95px] p-2 rounded-xl border transition-all flex flex-col justify-between ${
                        isToday
                          ? 'border-purple-600 dark:border-purple-400 bg-purple-50/60 dark:bg-purple-950/40 shadow-xs ring-1 ring-purple-500'
                          : leavesOnDay.length > 0
                            ? 'border-purple-200 dark:border-purple-900/50 bg-white dark:bg-slate-900 hover:border-purple-400 cursor-pointer shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-black ${
                            isToday
                              ? 'w-6 h-6 rounded-full bg-purple-700 text-white flex items-center justify-center'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {dayNum}
                        </span>
                        {isToday && (
                          <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300">
                            {tr('আজ', 'Today', 'اليوم')}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 my-1">
                        {leavesOnDay.slice(0, 2).map((l) => (
                          <div
                            key={l.id}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold truncate flex items-center gap-1 ${
                              l.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300'
                                : l.status === 'Rejected'
                                  ? 'bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-300'
                                  : 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300'
                            }`}
                            title={`${l.teacherName} (${l.leaveType})`}
                          >
                            {l.status === 'Approved' ? (
                              <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                            ) : (
                              <Clock className="w-2.5 h-2.5 shrink-0" />
                            )}
                            <span className="truncate">{l.teacherName.split(' ')[0]}</span>
                          </div>
                        ))}
                        {leavesOnDay.length > 2 && (
                          <div className="text-[9px] font-bold text-purple-600 dark:text-purple-400 text-center">
                            +{leavesOnDay.length - 2} {tr('আরো', 'more', 'المزيد')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Day Details Modal for Calendar Clicks */}
      {dayModalLeaves && dayModalDate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl max-w-xl w-full shadow-2xl border border-purple-300 dark:border-purple-800 overflow-hidden my-8">
            <div className="bg-gradient-to-r from-[#2e0249] to-purple-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-amber-400" />
                <span className="font-extrabold text-sm">
                  {tr('ছুটির বিবরণ:', 'Leave Details for Date:', 'تفاصيل الإجازة ليوم:')} {dayModalDate}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDayModalDate(null);
                  setDayModalLeaves(null);
                }}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {dayModalLeaves.map((l) => (
                <div
                  key={l.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-sm text-purple-950 dark:text-white">
                        {l.teacherName}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {l.designation} · {l.department}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-black ${
                        l.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : l.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-slate-500 block">{tr('ধরন:', 'Type:', 'النوع:')}</span>
                      <span className="font-bold">{l.leaveType}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{tr('মেয়াদ:', 'Duration:', 'المدة:')}</span>
                      <span className="font-bold">
                        {l.totalDays} {tr('দিন', 'Days', 'أيام')} ({l.startDate} → {l.endDate})
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block">{tr('বিকল্প শিক্ষক:', 'Substitute:', 'المعلم البديل:')}</span>
                      <span className="font-bold">{l.substituteTeacher}</span>
                    </div>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 text-[11px] italic">
                    "{l.reasonDetails}"
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                    {l.status === 'Approved' && (
                      <button
                        type="button"
                        onClick={() => generateLeaveApprovalPDF(l, state.settings)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>{tr('A4 PDF সনদ ডাউনলোড', 'Download A4 PDF', 'تحميل A4 PDF')}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Official A4 Leave Approval Certificate Modal Preview */}
      {previewLeave && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl border border-purple-300 overflow-hidden my-8">
            {/* Modal Action Bar */}
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>
                  {tr(
                    'অফিসিয়াল A4 ছুটি অনুমোদন সনদ প্রিভিউ',
                    'Official A4 Leave Approval Certificate Preview',
                    'معاينة شهادة الموافقة على الإجازة الرسمية بحجم A4'
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => generateLeaveApprovalPDF(previewLeave, state.settings)}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-purple-950 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{tr('A4 PDF ডাউনলোড করুন', 'Download A4 PDF', 'تحميل A4 PDF')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{tr('প্রিন্ট', 'Print', 'طباعة')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewLeave(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* A4 Sheet Content */}
            <div className="p-8 space-y-6 bg-white">
              {/* Letterhead Header */}
              <div className="bg-gradient-to-r from-[#2e0249] via-[#4c0575] to-[#2e0249] text-white p-6 rounded-xl text-center space-y-1 border-b-4 border-amber-400">
                <h2 className="text-xl font-black uppercase tracking-wide">
                  {state.settings.instituteName}
                </h2>
                <p className="text-xs text-purple-200 font-semibold">
                  {tr(
                    'অধ্যক্ষ ও চেয়ারম্যানের কার্যালয় — অফিসিয়াল শিক্ষক ছুটি অনুমোদন সনদ',
                    'Office of the Honorable Principal & Chairman — Official Teacher Leave Approval Certificate',
                    'مكتب المدير والرئيس — شهادة الموافقة الرسمية على إجازة المعلم'
                  )}
                </p>
                <p className="text-[11px] text-purple-300">{state.settings.addressEn}</p>
              </div>

              {/* Reference & Status Row */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs">
                <div>
                  <span className="font-bold text-slate-500">Reference No: </span>
                  <span className="font-black text-purple-950">{previewLeave.id}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Submitted: </span>
                  <span className="font-bold text-slate-800">{previewLeave.submittedAt}</span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    previewLeave.status === 'Approved'
                      ? 'bg-emerald-600 text-white'
                      : previewLeave.status === 'Rejected'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-500 text-white'
                  }`}
                >
                  {previewLeave.status}
                </span>
              </div>

              {/* Details Table */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-purple-50/50 p-4 rounded-xl border border-purple-200">
                <div>
                  <span className="text-slate-500 block">Applicant Teacher:</span>
                  <span className="font-extrabold text-sm text-slate-900">
                    {previewLeave.teacherName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Designation & Department:</span>
                  <span className="font-bold text-slate-900">
                    {previewLeave.designation} — {previewLeave.department}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Leave Category & Total Days:</span>
                  <span className="font-extrabold text-purple-900">
                    {previewLeave.leaveType} ({previewLeave.totalDays} Days)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Approved Leave Dates:</span>
                  <span className="font-extrabold text-purple-900">
                    {previewLeave.startDate} to {previewLeave.endDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Reason Category:</span>
                  <span className="font-bold text-slate-800">{previewLeave.reasonCategory}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Substitute Coverage Teacher:</span>
                  <span className="font-extrabold text-emerald-800">
                    {previewLeave.substituteTeacher}
                  </span>
                </div>
              </div>

              {/* Principal Remarks */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1 text-xs">
                <div className="font-black text-emerald-900 uppercase">
                  Official Endorsement & Remarks from Principal / Chairman:
                </div>
                <p className="text-slate-800 font-medium">
                  {previewLeave.reviewerComment ||
                    'Reviewed by the Office of the Principal. Substitute teacher will cover all scheduled classes.'}
                </p>
                <div className="text-[11px] text-emerald-700 font-bold pt-1">
                  Reviewed By: {previewLeave.reviewedBy || 'Honorable Principal / Chairman'} · Date:{' '}
                  {previewLeave.reviewedAt || previewLeave.submittedAt}
                </div>
              </div>

              {/* 3 Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs">
                <div className="border-t border-slate-400 pt-2 font-semibold text-slate-700">
                  Applicant Teacher Signature
                </div>
                <div className="border-t border-slate-400 pt-2 font-semibold text-slate-700">
                  Substitute Teacher Consent
                </div>
                <div className="border-t-2 border-purple-900 pt-2 font-black text-purple-950">
                  Principal / Chairman Seal & Sign
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   GRANULAR RBAC PERMISSION MATRIX EDITOR (FOR SUPER ADMIN IN 'users' TAB)
   ============================================================================ */

export const AdminRBACMatrixSection: React.FC = () => {
  const { state, currentUser, language, updateRolePermission, resetRBACMatrix } = useCMS();

  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  const isSuperAdmin = currentUser?.role === 'Super Admin';
  const configurableRoles: ConfigurableRole[] = [
    'Super Admin',
    'Chairman / Managing Director',
    'Principal / Vice Principal',
    'Coordinators / Teachers',
    'Content Managers',
  ];
  const [selectedRoleTab, setSelectedRoleTab] = useState<ConfigurableRole>(
    'Chairman / Managing Director'
  );
  const [moduleSearch, setModuleSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const getResourceLabel = (tabId: AdminTabId): string => {
    const labels: Record<AdminTabId, { bn: string; en: string; ar: string }> = {
      overview: {
        bn: 'ড্যাশবোর্ড ওভারভিউ (Dashboard Overview)',
        en: 'Dashboard Overview',
        ar: 'نظرة عامة على لوحة التحكم',
      },
      'seo-meta': {
        bn: 'এসইও ও সোশ্যাল মেটা এডিটর (SEO & Open Graph Meta)',
        en: 'SEO & Social Meta Editor',
        ar: 'محرر تحسين محركات البحث والوسائط الاجتماعية',
      },
      releases: {
        bn: 'ভার্সন ও রিলিজ ম্যানেজার (Version & Rollback)',
        en: 'Version & Release Manager (Rollback)',
        ar: 'مدير الإصدارات والاسترجاع',
      },
      'madrasah-infographics': {
        bn: 'মাদ্রাসা ইনফোগ্রাফিক ও পরিবহন (Infographics & Transport)',
        en: 'Madrasah Infographics & Transport',
        ar: 'إنفوجرافيك المدرسة والنقل',
      },
      'popup-ai-fees': {
        bn: 'পপআপ, এমএমএম এআই এজেন্ট ও ফি ক্যালকুলেটর (Popup, MMM AI & Fees)',
        en: 'Popup, MMM AI Agent & Fee Calculator',
        ar: 'النوافذ المنبثقة ووكيل الذكاء الاصطناعي وحاسبة الرسوم',
      },
      videos: {
        bn: 'মিডিয়া শোকেস (Media Showcase)',
        en: 'Media Showcase',
        ar: 'معرض الوسائط',
      },
      career: {
        bn: 'ক্যারিয়ার ও নিয়োগ ব্যবস্থাপনা (Career & Recruitment)',
        en: 'Career & Recruitment Portal',
        ar: 'إدارة الوظائف والتوظيف',
      },
      leaves: {
        bn: 'শিক্ষক ছুটি ব্যবস্থাপনা ও A4 PDF (Teacher Leaves)',
        en: 'Teacher Leave Management & PDF',
        ar: 'إدارة إجازات المعلمين وملف PDF',
      },
      leads: {
        bn: 'ভর্তি আবেদন ও রেজিস্ট্রেশন (Admission Leads)',
        en: 'Admission Applications (Leads)',
        ar: 'طلبات القبول والتسجيل',
      },
      tokens: {
        bn: 'ভর্তি টোকেন ২০২৭ (Admission Token 2027)',
        en: 'Admission Token 2027',
        ar: 'بطاقات القبول ٢٠٢٧',
      },
      'virtual-office': {
        bn: 'ভার্চুয়াল অফিস ও লাইভ ডেস্ক (Virtual Office Live Desk)',
        en: 'Virtual Office & Live Desk',
        ar: 'المكتب الافتراضي والمكتب المباشر',
      },
      calendar: {
        bn: 'প্রাতিষ্ঠানিক ক্যালেন্ডার ও Google Sync (Calendar)',
        en: 'Institutional Calendar & Google Sync',
        ar: 'التقويم المؤسسي ومزامنة جوجل',
      },
      blog: {
        bn: 'ব্লগ ও অটো-পোস্টিং API (Blog & Auto-Posting)',
        en: 'Blog & Auto-Posting API',
        ar: 'المدونة والنشر التلقائي',
      },
      'ai-publisher': {
        bn: 'AI স্মার্ট পাবলিশার (AI Smart Publisher)',
        en: 'AI Smart Publishing Assistant',
        ar: 'مساعد النشر الذكي بالذكاء الاصطناعي',
      },
      emails: {
        bn: 'ইমেইল নোটিফিকেশন লগ (Email Logs)',
        en: 'Email Notification Logs',
        ar: 'سجلات إشعارات البريد الإلكتروني',
      },
      news: {
        bn: 'স্ক্রলিং নিউজ টিকার (News Ticker)',
        en: 'Scrolling News Manager',
        ar: 'إدارة شريط الأخبار المتحرك',
      },
      notices: {
        bn: 'নোটিশ বোর্ড ম্যানেজার (Notice Board)',
        en: 'Notice Board Manager',
        ar: 'إدارة لوحة الإعلانات',
      },
      courses: {
        bn: 'কারিকুলাম ও একাডেমিক সিলেবাস (Curriculum)',
        en: 'Curriculum & Academic Syllabus',
        ar: 'المناهج الدراسية والمقررات',
      },
      events: {
        bn: 'ইভেন্ট ও সেমিনার ম্যানেজার (Events & Seminars)',
        en: 'Events & Seminars Manager',
        ar: 'إدارة الفعاليات والندوات',
      },
      branding: {
        bn: 'ব্র্যান্ডিং ও লোগো ভল্ট (Branding & Header Logos)',
        en: 'Branding & Global Header Logos',
        ar: 'الهوية والشعارات الرسمية',
      },
      users: {
        bn: 'ইউজার রোল ও RBAC পারমিশন (User Roles & RBAC)',
        en: 'User Roles & RBAC Permissions (Super Admin Exclusive)',
        ar: 'أدوار المستخدمين وصلاحيات RBAC (للمشرف العام فقط)',
      },
      'backup-ai': {
        bn: 'ব্যাকআপ, রিস্টোর ও AI অটো-ফিল (Backup & Restore)',
        en: 'Backup, Restore & AI Auto-Fill',
        ar: 'النسخ الاحتياطي والاستعادة والملء الذكي',
      },
      settings: {
        bn: 'সাধারণ সাইট সেটিংস ও পেইজ ভিজিবিলিটি (Site Settings)',
        en: 'Page Visibility & Site Settings',
        ar: 'الإعدادات العامة للموقع وإمكانية الرؤية',
      },
    };
    const item = labels[tabId];
    return item ? (language === 'bn' ? item.bn : language === 'ar' ? item.ar : item.en) : tabId;
  };

  const roleLabels: Record<ConfigurableRole, { bn: string; en: string; ar: string; desc: string }> =
    {
      'Super Admin': {
        bn: '১. সুপার অ্যাডমিন (Super Admin)',
        en: '1. Super Admin',
        ar: '١. المشرف العام (Super Admin)',
        desc: tr(
          'সকল ওয়েবসাইট মডিউল, ইউজার অ্যাকাউন্ট ও CRUD পারমিশন ম্যাট্রিক্সে সর্বোচ্চ নিয়ন্ত্রণ',
          'Full root CRUD authority across all website modules, user accounts, and RBAC matrix',
          'صلاحية كاملة (Create/Read/Update/Delete) على جميع الأقسام والحسابات'
        ),
      },
      'Chairman / Managing Director': {
        bn: '২. চেয়ারম্যান / ম্যানেজিং ডিরেক্টর',
        en: '2. Chairman / Managing Director',
        ar: '٢. رئيس مجلس الإدارة / المدير العام',
        desc: tr(
          'প্রতিষ্ঠানের নীতি নির্ধারণ, শিক্ষক ছুটি চূড়ান্ত অনুমোদন, ভর্তি ও ব্র্যান্ডিং তদারকি',
          'Executive oversight, teacher leave approvals, admission reports, and branding',
          'الإشراف التنفيذي واعتماد إجازات المعلمين وتقارير القبول والهوية'
        ),
      },
      'Principal / Vice Principal': {
        bn: '৩. অধ্যক্ষ / উপাধ্যক্ষ (Principal / VP)',
        en: '3. Principal / Vice Principal',
        ar: '٣. المدير / نائب المدير (Principal / VP)',
        desc: tr(
          'শিক্ষকদের ছুটির আবেদন অনুমোদন (A4 PDF সনদ), ভর্তি যাচাই ও একাডেমিক তদারকি',
          'Approves teacher leave applications with A4 PDF, reviews admissions, and oversees academics',
          'يعتمد إجازات المعلمين ويراجع طلبات القبول ويشرف على الشؤون الأكاديمية'
        ),
      },
      'Coordinators / Teachers': {
        bn: '৪. কো-অর্ডিনেটর / শিক্ষকবৃন্দ',
        en: '4. Coordinators / Teachers',
        ar: '٤. المنسقون / المعلمون (Coordinators / Teachers)',
        desc: tr(
          'নিজের ছুটির আবেদন জমা ও A4 PDF ডাউনলোড এবং একাডেমিক সিলেবাস ও নোটিশ দেখা',
          'Submits leave requests, downloads A4 PDF approvals, and views syllabus & notices',
          'يقدم طلبات الإجازة ويحمل شهادة A4 PDF ويعرض المناهج والإعلانات'
        ),
      },
      'Content Managers': {
        bn: '৫. কন্টেন্ট ম্যানেজার (Content Managers)',
        en: '5. Content Managers',
        ar: '٥. مديرو المحتوى (Content Managers)',
        desc: tr(
          'ওয়েবসাইটের ব্র্যান্ডিং লোগো, নোটিশ, নিউজ, ইনফোগ্রাফিক, কোর্স, ভিডিও ও ইভেন্ট আপডেট',
          'Manages branding logos, notices, news ticker, infographics, courses, videos, and events',
          'يدير الشعارات والإعلانات والأخبار والإنفوجرافيك والدورات والفيديوهات والفعاليات'
        ),
      },
    };

  const matrix = state.rbacMatrix || DEFAULT_RBAC_MATRIX;

  const getRolePermForModule = (role: ConfigurableRole, tabId: AdminTabId) => {
    const raw =
      matrix?.[role]?.[tabId] ||
      DEFAULT_RBAC_MATRIX?.[role]?.[tabId] || {
        create: false,
        read: false,
        update: false,
        delete: false,
        view: false,
        edit: false,
      };
    return normalizeResourcePermission(raw);
  };

  const handleBulkRowPreset = (tabId: AdminTabId, mode: 'full' | 'readonly' | 'none') => {
    if (!isSuperAdmin) return;
    if (tabId === 'users') return;
    if (mode === 'full') {
      updateRolePermission(selectedRoleTab, tabId, 'read', true);
      updateRolePermission(selectedRoleTab, tabId, 'create', true);
      updateRolePermission(selectedRoleTab, tabId, 'update', true);
      updateRolePermission(selectedRoleTab, tabId, 'delete', true);
    } else if (mode === 'readonly') {
      updateRolePermission(selectedRoleTab, tabId, 'read', true);
      updateRolePermission(selectedRoleTab, tabId, 'create', false);
      updateRolePermission(selectedRoleTab, tabId, 'update', false);
      updateRolePermission(selectedRoleTab, tabId, 'delete', false);
    } else {
      updateRolePermission(selectedRoleTab, tabId, 'read', false);
    }
  };

  const categories = ['All', 'Core', 'Administration', 'Academic', 'HR & Faculty', 'Content', 'System'];
  const filteredModules = ALL_ADMIN_TABS.filter((tabItem) => {
    const matchesCat = categoryFilter === 'All' || tabItem.category === categoryFilter;
    const q = moduleSearch.trim().toLowerCase();
    const labelText = getResourceLabel(tabItem.id).toLowerCase();
    const matchesSearch =
      !q ||
      labelText.includes(q) ||
      tabItem.label.toLowerCase().includes(q) ||
      tabItem.id.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const crudActions: {
    key: 'create' | 'read' | 'update' | 'delete';
    labelBn: string;
    labelEn: string;
    labelAr: string;
    shortCode: string;
  }[] = [
    {
      key: 'create',
      labelBn: 'তৈরি (Create)',
      labelEn: 'Create (C)',
      labelAr: 'إنشاء (Create)',
      shortCode: 'C',
    },
    {
      key: 'read',
      labelBn: 'পড়া / দেখা (Read)',
      labelEn: 'Read (R)',
      labelAr: 'قراءة / عرض (Read)',
      shortCode: 'R',
    },
    {
      key: 'update',
      labelBn: 'আপডেট (Update)',
      labelEn: 'Update (U)',
      labelAr: 'تحديث (Update)',
      shortCode: 'U',
    },
    {
      key: 'delete',
      labelBn: 'ডিলিট (Delete)',
      labelEn: 'Delete (D)',
      labelAr: 'حذف (Delete)',
      shortCode: 'D',
    },
  ];

  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-200 dark:border-slate-800 p-6 shadow-xs space-y-5"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-800 dark:text-purple-300">
            <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>
              {tr(
                'গ্র্যানুলার ৫-রোল CRUD পারমিশন ম্যাট্রিক্স (Create · Read · Update · Delete)',
                'Interactive 5-Role CRUD Permission Matrix (Create · Read · Update · Delete)',
                'مصفوفة الصلاحيات التفاعلية (Create · Read · Update · Delete) للأدوار الخمسة'
              )}
            </span>
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            {tr(
              '৫টি রোলের জন্য সকল ওয়েবসাইট মডিউলে সুনির্দিষ্ট CRUD (Create, Read, Update, Delete) পারমিশন নিয়ন্ত্রণ করুন',
              'Toggle Specific Permissions (Create, Read, Update, Delete) for Each of the 5 Roles Across All Modules',
              'تخصيص صلاحيات (الإنشاء، القراءة، التحديث، الحذف) لكل دور من الأدوار الخمسة عبر جميع الأقسام'
            )}
          </h3>
          <p className="text-xs text-slate-500">
            {tr(
              'শুধুমাত্র Super Admin এই পারমিশন ম্যাট্রিক্স পরিবর্তন করতে পারবেন। যেকোনো রোল কার্ডে ক্লিক করে ১৫টি ওয়েবসাইট মডিউলের Create, Read, Update এবং Delete অ্যাক্সেস টগল করুন।',
              'Only Super Admin can modify this matrix. Select any of the 5 roles below to toggle Create, Read, Update, and Delete permissions across all 15 website modules.',
              'يمكن للمشرف العام فقط تعديل هذه المصفوفة. اختر أياً من الأدوار الخمسة لتبديل الصلاحيات.'
            )}
          </p>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={resetRBACMatrix}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>
              {tr('ডিফল্ট পারমিশন রিসেট', 'Reset Default Permissions', 'إعادة ضبط الصلاحيات')}
            </span>
          </button>
        )}
      </div>

      {/* Role Selector Tabs (All 5 Roles with Live Active Module Counts) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3" role="tablist" aria-label="Select Role for CRUD Matrix">
        {configurableRoles.map((r) => {
          const active = selectedRoleTab === r;
          const info = roleLabels[r];
          const readableCount = ALL_ADMIN_TABS.filter((t) => getRolePermForModule(r, t.id).read).length;
          return (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedRoleTab(r)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                active
                  ? 'bg-gradient-to-r from-[#2e0249] to-[#4c0575] text-white border-purple-600 shadow-md'
                  : 'bg-purple-50/40 dark:bg-slate-800/60 border-purple-100 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-purple-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-extrabold text-xs leading-snug">
                    {language === 'bn' ? info.bn : language === 'ar' ? info.ar : info.en}
                  </span>
                  <Shield
                    className={`w-4 h-4 shrink-0 ${active ? 'text-amber-400' : 'text-purple-600'}`}
                  />
                </div>
                <p
                  className={`text-[11px] leading-snug ${
                    active ? 'text-purple-200' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {info.desc}
                </p>
              </div>
              <div
                className={`text-[11px] font-mono tabular-nums pt-1.5 border-t flex items-center justify-between ${
                  active
                    ? 'border-purple-400/30 text-amber-300'
                    : 'border-slate-200/70 dark:border-slate-700 text-purple-700 dark:text-purple-300'
                }`}
              >
                <span>{tr('সক্রিয় মডিউল:', 'Active Modules:', 'الأقسام المفعلة:')}</span>
                <span className="font-bold">{readableCount} / {ALL_ADMIN_TABS.length}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar for Website Modules */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-purple-900 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'All' ? tr('সকল মডিউল (১৫)', 'All Modules (15)', 'جميع الأقسام (١٥)') : cat}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={moduleSearch}
            onChange={(e) => setModuleSearch(e.target.value)}
            placeholder={tr('মডিউল খুঁজুন...', 'Filter modules by name...', 'ابحث عن قسم...')}
            aria-label="Filter modules by name"
            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* CRUD Permission Matrix Table for Selected Role */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-purple-950 text-white">
              <th className="py-3 px-4 font-extrabold">
                {tr('ওয়েবসাইট মডিউল / রিসোর্স', 'Website Module / Resource', 'قسم الموقع / المورد')}
              </th>
              {crudActions.map((col) => (
                <th key={col.key} className="py-3 px-3 text-center font-extrabold whitespace-nowrap">
                  {language === 'bn' ? col.labelBn : language === 'ar' ? col.labelAr : col.labelEn}
                </th>
              ))}
              <th className="py-3 px-4 text-right font-extrabold whitespace-nowrap">
                {tr('কুইক অ্যাকশন', 'Quick Preset', 'إجراء سريع')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredModules.map((tabItem) => {
              const tabId = tabItem.id;
              const perm = getRolePermForModule(selectedRoleTab, tabId);
              const isUsersLockedRow = tabId === 'users';

              return (
                <tr
                  key={tabId}
                  className="hover:bg-purple-50/40 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    <div className="flex flex-col">
                      <span>{getResourceLabel(tabId)}</span>
                      <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                        {tabItem.category} · ID: <code className="font-mono">{tabId}</code>
                      </span>
                    </div>
                  </td>
                  {crudActions.map((col) => {
                    const checked = Boolean(perm[col.key]);
                    const checkboxDisabled = !isSuperAdmin || isUsersLockedRow;
                    return (
                      <td key={col.key} className="py-3 px-3 text-center">
                        <label className="inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={checkboxDisabled}
                            checked={checked}
                            aria-label={`${selectedRoleTab} ${col.labelEn} permission for ${tabItem.label}`}
                            onChange={(e) =>
                              updateRolePermission(
                                selectedRoleTab,
                                tabId,
                                col.key,
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 accent-purple-700 rounded cursor-pointer disabled:opacity-40"
                          />
                        </label>
                      </td>
                    );
                  })}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {isUsersLockedRow ? (
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {selectedRoleTab === 'Super Admin'
                          ? tr('রুট লকড (Full CRUD)', 'Root Locked (Full CRUD)', 'محمي للمشرف العام')
                          : tr('শুধুমাত্র Super Admin', 'Super Admin Only', 'للمشرف العام فقط')}
                      </span>
                    ) : (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={!isSuperAdmin}
                          onClick={() => handleBulkRowPreset(tabId, 'full')}
                          className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-950/70 hover:bg-purple-200 text-purple-900 dark:text-purple-200 text-[11px] font-bold cursor-pointer disabled:opacity-40"
                        >
                          {tr('Full CRUD', 'Full CRUD', 'كامل')}
                        </button>
                        <button
                          type="button"
                          disabled={!isSuperAdmin}
                          onClick={() => handleBulkRowPreset(tabId, 'readonly')}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-bold cursor-pointer disabled:opacity-40"
                        >
                          {tr('Read Only', 'Read Only', 'قراءة فقط')}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ============================================================================
   VIDEO & MEDIA SHOWCASES TAB ('videos') & BACKUP / AI AUTO-FILL TAB ('backup-ai')
   ============================================================================ */

export const AdminVideosTab: React.FC = () => {
  const {
    state,
    currentUser,
    language,
    pushToast,
    updateSettings,
    updateCampusVideo,
    updateDepartmentVideo,
    addActivityVideo,
    updateActivityVideo,
    deleteActivityVideo,
    addGuardianReel,
    updateGuardianReel,
    deleteGuardianReel,
    clearAllVideoLinks,
    addHafizGraduate,
    updateHafizGraduate,
    deleteHafizGraduate,
    addPhotoGalleryItem,
    updatePhotoGalleryItem,
    deletePhotoGalleryItem,
  } = useCMS();

  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;
  const locVal = (val?: string) =>
    !val ? '' : language === 'bn' ? val : localizeDynamicText(val, language);

  const userRole = currentUser?.role || 'Super Admin';
  const canEdit = hasRolePermission(userRole, 'videos', 'edit', state.rbacMatrix);
  const canDelete = hasRolePermission(userRole, 'videos', 'delete', state.rbacMatrix);

  const [mediaSubTab, setMediaSubTab] = useState<'videos' | 'hifz-tree' | 'photo-gallery'>('videos');

  const [campusDraft, setCampusDraft] = useState(state.campusVideo);
  const [actTitle, setActTitle] = useState('');
  const [actCategory] = useState('Academic');
  const [actDuration] = useState('03:30');
  const [actVideoUrl, setActVideoUrl] = useState('');
  const [actThumbUrl, setActThumbUrl] = useState('/assets/maharat/fb/fb-media-15.jpg');

  const [reelTitle, setReelTitle] = useState('');
  const [reelGuardian, setReelGuardian] = useState('');
  const [reelRelation] = useState('Guardian of Class 4 Student');
  const [reelDuration] = useState('01:15');
  const [reelVideoUrl, setReelVideoUrl] = useState('');
  const [reelThumbUrl] = useState('/assets/maharat/fb/fb-media-18.jpg');

  // New Hafez Graduate Form State
  const nextSerial = (state.hifzTreeConfig?.graduates?.length || 30) + 1;
  const [hafizSerial, setHafizSerial] = useState<number>(nextSerial);
  const [hafizNameBn, setHafizNameBn] = useState('');
  const [hafizClassBn, setHafizClassBn] = useState('হিফজুল কুরআন বিভাগ');
  const [hafizSession, setHafizSession] = useState('2026');
  const [hafizDurationBn] = useState('আন্তর্জাতিক মানের তাজবীদ ও সুন্দর তিলাওয়াত');
  const [hafizDescBn, setHafizDescBn] = useState('');
  const [hafizFatherBn, setHafizFatherBn] = useState('');
  const [hafizTeacherBn, setHafizTeacherBn] = useState('');
  const [hafizHometownBn, setHafizHometownBn] = useState('');
  const [hafizBioBn, setHafizBioBn] = useState('');
  const [hafizCertUrl, setHafizCertUrl] = useState('');
  const [hafizPhotoUrl, setHafizPhotoUrl] = useState('/assets/maharat/fb/fb-media-21.jpg');
  const [hafizFbUrl, setHafizFbUrl] = useState('');
  const [expandedHafizId, setExpandedHafizId] = useState<string | null>(null);

  // New Photo Gallery Item Form State
  const [pgTitleBn, setPgTitleBn] = useState('');
  const [pgCategory, setPgCategory] = useState<PhotoGalleryCategory>('Hifz & Sabak');
  const [pgBadgeBn, setPgBadgeBn] = useState('');
  const [pgDescBn, setPgDescBn] = useState('');
  const [pgImageUrl, setPgImageUrl] = useState('/assets/maharat/fb/fb-media-16.jpg');
  const [pgFbUrl, setPgFbUrl] = useState('');

  const uploadEnabled = state.settings.enableDirectMediaUpload !== false;

  const handleImageFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onLoaded: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = String(ev.target?.result || '');
      if (result) {
        onLoaded(result);
        pushToast(
          tr('ছবি ফাইল আপলোড সম্পন্ন!', 'Image File Uploaded!', 'تم رفع ملف الصورة!'),
          file.name
        );
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Master Hybrid Media Bar: Facebook Link + Direct Upload Toggle + Device Frame Selector */}
      <div className="bg-gradient-to-r from-[#071129] via-[#192f64] to-[#005a6e] text-white rounded-2xl p-5 sm:p-6 shadow-lg border border-[#e5b94c]/30 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#f0c95e] text-[#071129] text-[11px] font-black uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {tr(
                  'হাইব্রিড মিডিয়া সিস্টেম (ফেসবুক লিঙ্ক + সরাসরি আপলোড + পপআপ ফ্রেমিং)',
                  'Hybrid Media Engine (Facebook Links + Direct Upload + Device Framing)',
                  'نظام الوسائط الهجين (روابط فيسبوك + رفع مباشر + إطارات العرض)'
                )}
              </span>
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold">
              {tr(
                `ভিডিও রিলস, হিফজুল কুরআন ট্রি (${state.hifzTreeConfig?.graduates?.length || 30} হাফেজ · জীবনী ও সার্টিফিকেট) এবং ফটো গ্যালারি কন্ট্রোলার`,
                `Master Controller for Video Reels, Hifzul Quran Lineage (${state.hifzTreeConfig?.graduates?.length || 30} Huffaz) & Photo Gallery`,
                'وحدة التحكم الشاملة في الفيديوهات وشجرة الحفاظ ومعرض الصور'
              )}
            </h3>
            <p className="text-xs text-teal-100/90 max-w-3xl">
              {tr(
                'ফেসবুকের যেকোনো ভিডিও/রিল বা ছবির লিঙ্ক পেস্ট করতে পারবেন এবং পাশাপাশি কম্পিউটার/মোবাইল থেকে সরাসরি ছবি বা থাম্বনেইল আপলোডও করতে পারবেন। ওয়েবসাইটে ক্লিক করলেই মোবাইল বা কম্পিউটার স্ক্রিন ফ্রেমে পপআপ প্লে হবে।',
                'Paste Facebook/YouTube links OR upload image files directly. Visitors watch videos inside an in-website Mobile or Computer screen frame.',
                'الصق روابط فيسبوك أو يوتيوب أو ارفع الصور مباشرة مع عرض منبثق داخل إطار هاتف أو كمبيوتر.'
              )}
            </p>
          </div>

          {/* Direct Upload Toggle + Default Frame Mode */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={!canEdit}
              onClick={() =>
                updateSettings({
                  ...state.settings,
                  enableDirectMediaUpload: !uploadEnabled,
                })
              }
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                uploadEnabled
                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-sm'
                  : 'bg-white/10 text-purple-200 border-white/20'
              }`}
            >
              {uploadEnabled
                ? tr('✓ সরাসরি ফাইল আপলোড: চালু', '✓ Direct File Upload: Enabled', '✓ الرفع المباشر: مفعل')
                : tr('সরাসরি ফাইল আপলোড: বন্ধ (ডেমো লিঙ্ক মোড)', 'Direct Upload: Disabled', 'الرفع المباشر: متوقف')}
            </button>

            <select
              disabled={!canEdit}
              value={state.settings.defaultVideoFrameMode || 'auto'}
              onChange={(e) =>
                updateSettings({
                  ...state.settings,
                  defaultVideoFrameMode: e.target.value as 'auto' | 'mobile' | 'desktop',
                })
              }
              aria-label="Default Video Popup Frame Mode"
              className="px-3 py-2 rounded-xl bg-white/15 border border-white/25 text-white text-xs font-extrabold cursor-pointer"
            >
              <option value="auto" className="text-slate-900">
                {tr('ফ্রেম মোড: অটো (রিল=মোবাইল, ভিডিও=কম্পিউটার)', 'Frame: Auto (Reel=Mobile, Video=PC)', 'الإطار: تلقائي')}
              </option>
              <option value="mobile" className="text-slate-900">
                {tr('📱 সর্বদা মোবাইল স্ক্রিন ফ্রেম', '📱 Always Mobile Screen Frame', '📱 إطار الهاتف دائماً')}
              </option>
              <option value="desktop" className="text-slate-900">
                {tr('💻 সর্বদা কম্পিউটার মনিটর ফ্রেম', '💻 Always Computer Monitor Frame', '💻 إطار الكمبيوتر دائماً')}
              </option>
            </select>
          </div>
        </div>

        {/* 3 Sub-Tabs Switcher */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/15">
          {[
            {
              id: 'videos' as const,
              label: tr(
                `১. ভিডিও ও ফেসবুক রিলস (${state.activityVideos.length + state.guardianReels.length + 3})`,
                `1. Videos & Facebook Reels (${state.activityVideos.length + state.guardianReels.length + 3})`,
                '١. الفيديوهات ومقاطع ريلز'
              ),
            },
            {
              id: 'hifz-tree' as const,
              label: tr(
                `২. হিফজুল কুরআন ট্রি ও সার্টিফিকেট (${state.hifzTreeConfig?.graduates?.length || 30} জন হাফেজ)`,
                `2. Hifzul Quran Lineage & Certificates (${state.hifzTreeConfig?.graduates?.length || 30} Huffaz)`,
                '٢. شجرة حفاظ القرآن والشهادات'
              ),
            },
            {
              id: 'photo-gallery' as const,
              label: tr(
                `৩. ফটো গ্যালারি ও ফেসবুক পোস্ট (${state.photoGallery?.length || 17}টি পোস্ট)`,
                `3. Categorized Photo Gallery (${state.photoGallery?.length || 17} Posts)`,
                '٣. معرض الصور ومنشورات فيسبوك'
              ),
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMediaSubTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                mediaSubTab === tab.id
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-purple-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================================
          SUB-TAB 1: VIDEOS & FACEBOOK REELS (HERO, CAMPUS, DEPTS, ACTIVITIES, REELS)
         ===================================================================== */}
      {mediaSubTab === 'videos' && (
        <>
          <div className="bg-purple-50/70 dark:bg-slate-900 rounded-2xl border border-purple-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
              {tr(
                'টিপস: এখানে ফেসবুক রিলস (facebook.com/reel/...), ফেসবুক ভিডিও (facebook.com/share/v/...) এবং ইউটিউব লিংক সবই সাপোর্ট করে।',
                'Tip: Supports Facebook Reels (facebook.com/reel/...), Facebook Videos (facebook.com/share/v/...), and YouTube URLs.',
                'يدعم روابط ريلز فيسبوك وفيديوهات فيسبوك ويوتيوب.'
              )}
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  clearAllVideoLinks();
                  setCampusDraft((prev) => ({ ...prev, videoUrl: '' }));
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold cursor-pointer transition-colors"
              >
                {tr('সব ভিডিও লিঙ্ক খালি করুন', 'Clear All Video Links', 'مسح جميع روابط الفيديو')}
              </button>
            )}
          </div>

          {/* Campus Video Documentary & Hero Video Editor */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-slate-800 p-6 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {tr(
                    '১. হিরো ও আওয়ার ক্যাম্পাস ডকুমেন্টারি ভিডিও কন্ট্রোলার',
                    '1. Hero & Our Campus Documentary Video Controller',
                    '١. وحدة التحكم في فيديو الواجهة والفيديو الوثائقي للحرم'
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  {tr(
                    'হোমপেজের হিরো ও প্রধান ক্যাম্পাস ট্যুর ভিডিওর শিরোনাম, থাম্বনেইল (লিঙ্ক বা সরাসরি আপলোড) ও ভিডিও লিংক পরিবর্তন করুন',
                    'Update the main homepage hero and campus tour video title, thumbnail (URL or file upload), and embed URL',
                    'تحديث عنوان وصورة ورابط فيديو جولة الحرم المدرسي في الصفحة الرئيسية'
                  )}
                </p>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => updateCampusVideo(campusDraft)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white text-xs font-extrabold cursor-pointer shadow-xs"
                >
                  {tr('ক্যাম্পাস ভিডিও সংরক্ষণ করুন', 'Save Campus Video', 'حفظ فيديو الحرم')}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-bold mb-1">
                  {tr('হিরো ব্যাকগ্রাউন্ড ভিডিও লিংক', 'Hero Video URL', 'رابط فيديو الواجهة الرئيسية')}
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={state.settings.heroVideoUrl || ''}
                  onChange={(e) =>
                    updateSettings({
                      ...state.settings,
                      heroVideoUrl: e.target.value,
                    })
                  }
                  placeholder={tr('ফেসবুক রিল / ইউটিউব লিঙ্ক...', 'Paste FB Reel / YouTube URL...', 'الصق الرابط...')}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">
                  {tr('ক্যাম্পাস শিরোনাম (Headline)', 'Campus Video Headline', 'عنوان فيديو الحرم')}
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={locVal(campusDraft.titleBn)}
                  onChange={(e) => setCampusDraft({ ...campusDraft, titleBn: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">
                  {tr('ক্যাম্পাস ফেসবুক রিল / ইউটিউব লিংক', 'Campus Video URL (FB/YT)', 'رابط فيديو الحرم')}
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={campusDraft.videoUrl}
                  onChange={(e) => {
                    const nextUrl = e.target.value;
                    setCampusDraft({ ...campusDraft, videoUrl: nextUrl });
                    updateCampusVideo({ ...campusDraft, videoUrl: nextUrl });
                  }}
                  placeholder={tr('ফেসবুক/ইউটিউব ভিডিও লিঙ্ক...', 'Paste FB/YouTube Video URL...', 'الصق رابط الفيديو...')}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold">
                  {tr('থাম্বনেইল ছবি (লিংক বা ফাইল আপলোড)', 'Thumbnail Image (URL or Upload)', 'الصورة المصغرة')}
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={campusDraft.thumbnailUrl}
                    onChange={(e) => setCampusDraft({ ...campusDraft, thumbnailUrl: e.target.value })}
                    className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 px-2.5 py-2 text-xs font-mono"
                  />
                  {uploadEnabled && canEdit && (
                    <label className="px-2.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[11px] cursor-pointer shrink-0 flex items-center">
                      <span>{tr('আপলোড', 'Upload', 'رفع')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageFileUpload(e, (dataUrl) => {
                            setCampusDraft({ ...campusDraft, thumbnailUrl: dataUrl });
                            updateCampusVideo({ ...campusDraft, thumbnailUrl: dataUrl });
                          })
                        }
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Department Videos Editor */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-slate-800 p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {tr(
                '২. মূল বিভাগের পরিচিতিমূলক ভিডিও গ্যালারি (ফেসবুক রিলস / ইউটিউব)',
                '2. Core Department Video Showcases (Facebook Reels / YouTube)',
                '٢. معرض فيديوهات الأقسام الرئيسية'
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.departmentVideos.map((dv) => (
                <div
                  key={dv.id}
                  className="p-4 rounded-xl bg-purple-50/40 dark:bg-slate-800/60 border border-purple-100 dark:border-slate-700 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-extrabold text-purple-950 dark:text-white">
                      {locVal(dv.titleBn)}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        dv.videoUrl?.trim()
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {dv.videoUrl?.trim()
                        ? tr('লিঙ্ক সক্রিয়', 'Link Active', 'الرابط مفعل')
                        : tr('লিঙ্ক খালি', 'No Link', 'بدون رابط')}
                    </span>
                  </div>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={dv.videoUrl}
                    onChange={(e) => updateDepartmentVideo({ ...dv, videoUrl: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 font-mono text-xs"
                    placeholder={tr('ফেসবুক রিল বা ইউটিউব ভিডিও লিঙ্ক পেস্ট করুন...', 'Paste Facebook Reel or YouTube URL...', 'الصق رابط الفيديو...')}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Activity Videos & Guardian Reels Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Videos */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {tr(
                  `৩. আওয়ার অ্যাক্টিভিটিস ভিডিও ও ফেসবুক রিলস (${state.activityVideos.length})`,
                  `3. Our Activities Videos & FB Reels (${state.activityVideos.length})`,
                  `٣. فيديوهات أنشطة الطلاب (${state.activityVideos.length})`
                )}
              </h3>
              {canEdit && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!actTitle.trim()) return;
                    addActivityVideo({
                      titleBn: actTitle.trim(),
                      department: (actCategory === 'Hifz' ? 'Hifz' : 'Academic') as 'Academic' | 'Hifz',
                      categoryBn: actCategory,
                      descriptionBn: actTitle.trim(),
                      duration: actDuration,
                      dateBn: '2026',
                      videoUrl: actVideoUrl.trim(),
                      thumbnailUrl: actThumbUrl,
                      active: true,
                    });
                    setActTitle('');
                    setActVideoUrl('');
                  }}
                  className="space-y-2 text-xs bg-purple-50/50 dark:bg-slate-800/50 p-3 rounded-xl border border-purple-100 dark:border-slate-700"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={actTitle}
                      onChange={(e) => setActTitle(e.target.value)}
                      placeholder={tr('নতুন ভিডিওর শিরোনাম...', 'Activity Video Title...', 'عنوان فيديو النشاط...')}
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                    />
                    <input
                      type="text"
                      value={actVideoUrl}
                      onChange={(e) => setActVideoUrl(e.target.value)}
                      placeholder={tr('ফেসবুক রিল / ইউটিউব লিঙ্ক...', 'FB Reel / YouTube URL...', 'رابط الفيديو...')}
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={actThumbUrl}
                      onChange={(e) => setActThumbUrl(e.target.value)}
                      placeholder={tr('থাম্বনেইল ছবির লিঙ্ক...', 'Thumbnail URL...', 'رابط الصورة...')}
                      className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 font-mono"
                    />
                    {uploadEnabled && (
                      <label className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold cursor-pointer">
                        <span>{tr('ছবি আপলোড', 'Upload Thumb', 'رفع صورة')}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageFileUpload(e, (url) => setActThumbUrl(url))}
                        />
                      </label>
                    )}
                    <button
                      type="submit"
                      className="rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold px-4 py-1.5 cursor-pointer"
                    >
                      + {tr('যুক্ত করুন', 'Add Video', 'إضافة فيديو')}
                    </button>
                  </div>
                </form>
              )}
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {state.activityVideos.map((av) => (
                  <div
                    key={av.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={av.thumbnailUrl || '/assets/maharat/fb/fb-media-15.jpg'}
                          alt={av.titleBn}
                          className="w-10 h-10 rounded-lg object-cover shrink-0 border border-purple-200"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {locVal(av.titleBn)}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {av.department} · {av.duration || '02:15'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            av.videoUrl?.trim()
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {av.videoUrl?.trim()
                            ? tr('লিঙ্ক যুক্ত', 'Linked', 'مرتبط')
                            : tr('লিঙ্ক খালি', 'Empty', 'فارغ')}
                        </span>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => deleteActivityVideo(av.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={av.videoUrl}
                      onChange={(e) => updateActivityVideo({ ...av, videoUrl: e.target.value })}
                      placeholder={tr('ফেসবুক রিল বা ইউটিউব ভিডিও লিঙ্ক পেস্ট করুন...', 'Paste Facebook Reel or YouTube URL...', 'الصق رابط الفيديو...')}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 font-mono text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Guardian Review Reels */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {tr(
                  `৪. অভিভাবক রিভিউ ও ফেসবুক রিলস (${state.guardianReels.length})`,
                  `4. Guardian Review & Facebook Reels (${state.guardianReels.length})`,
                  `٤. مقاطع آراء أولياء الأمور (${state.guardianReels.length})`
                )}
              </h3>
              {canEdit && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!reelTitle.trim() || !reelGuardian.trim()) return;
                    addGuardianReel({
                      titleBn: reelTitle.trim(),
                      guardianNameBn: reelGuardian.trim(),
                      guardianRelationBn: reelGuardian.trim(),
                      studentRelationBn: reelRelation,
                      rating: 5,
                      duration: reelDuration,
                      viewsCount: '2.5K',
                      videoUrl: reelVideoUrl.trim(),
                      thumbnailUrl: reelThumbUrl,
                      active: true,
                    });
                    setReelTitle('');
                    setReelGuardian('');
                    setReelVideoUrl('');
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-purple-50/50 dark:bg-slate-800/50 p-3 rounded-xl border border-purple-100 dark:border-slate-700"
                >
                  <input
                    type="text"
                    value={reelGuardian}
                    onChange={(e) => setReelGuardian(e.target.value)}
                    placeholder={tr('অভিভাবকের পরিচয়...', 'Guardian Relation/Name...', 'اسم/صفة ولي الأمر...')}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                  />
                  <input
                    type="text"
                    value={reelTitle}
                    onChange={(e) => setReelTitle(e.target.value)}
                    placeholder={tr('রিভিউ শিরোনাম...', 'Review Quote...', 'عنوان التقييم...')}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                  />
                  <input
                    type="text"
                    value={reelVideoUrl}
                    onChange={(e) => setReelVideoUrl(e.target.value)}
                    placeholder={tr('ফেসবুক রিল / ইউটিউব লিঙ্ক...', 'Facebook Reel / YouTube URL...', 'رابط الفيديو...')}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold px-3 py-2 cursor-pointer"
                  >
                    + {tr('রিল যুক্ত করুন', 'Add Reel', 'إضافة مقطع')}
                  </button>
                </form>
              )}
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {state.guardianReels.map((gr) => (
                  <div
                    key={gr.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {locVal(gr.guardianRelationBn || gr.guardianNameBn)} — {locVal(gr.titleBn)}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            gr.videoUrl?.trim()
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {gr.videoUrl?.trim()
                            ? tr('লিঙ্ক যুক্ত', 'Linked', 'مرتبط')
                            : tr('লিঙ্ক খালি', 'Empty', 'فارغ')}
                        </span>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => deleteGuardianReel(gr.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={gr.videoUrl}
                      onChange={(e) => updateGuardianReel({ ...gr, videoUrl: e.target.value })}
                      placeholder={tr('ফেসবুক রিল বা ইউটিউব ভিডিও লিঙ্ক পেস্ট করুন...', 'Paste Facebook Reel or YouTube URL...', 'الصق رابط الفيديو...')}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 font-mono text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* =====================================================================
          SUB-TAB 2: HIFZUL QURAN LINEAGE MANAGER (1ST TO 30TH+ HAFEZ · BIO & CERTIFICATES)
         ===================================================================== */}
      {mediaSubTab === 'hifz-tree' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-xs">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-[#0a1738] dark:text-white">
                {tr(
                  `হিফজুল কুরআন টাইমলাইন, জীবনী ও সার্টিফিকেট ম্যানেজার — মোট ${state.hifzTreeConfig?.graduates?.length || 30} জন হাফেজ`,
                  `Hifzul Quran Timeline, Biography & Certificate Manager — Total ${state.hifzTreeConfig?.graduates?.length || 30} Huffaz`,
                  'إدارة شجرة حفاظ القرآن والسيرة والشهادات'
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tr(
                  'প্রতিটি হাফেজের নাম, পিতার নাম, তত্ত্বাবধায়ক উস্তাদ, পূর্ণাঙ্গ জীবনী এবং মূল সার্টিফিকেট (ইমেজ/PDF আপলোড বা লিংক) এখান থেকে সহজেই অর্গানাইজ করুন।',
                  'Organize each Hafez profile with father name, mentor Ustad, biography, and downloadable certificate image/PDF.',
                  'نظّم ملف كل حافظ مع السيرة الذاتية وإرفاق الشهادة للتحميل.'
                )}
              </p>
            </div>
          </div>

          {canEdit && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!hafizNameBn.trim()) return;
                addHafizGraduate({
                  serialNumber: Number(hafizSerial) || nextSerial,
                  serialLabelBn: `${toBengaliDigits(hafizSerial)}তম হাফেজ`,
                  nameBn: hafizNameBn.trim(),
                  nameEn: hafizNameBn.trim(),
                  classNameBn: hafizClassBn.trim(),
                  completionDate: `${toBengaliDigits(hafizSession)} শিক্ষাবর্ষ`,
                  completionYear: hafizSession,
                  durationNoteBn: hafizDurationBn.trim(),
                  badgeTextBn: `${toBengaliDigits(hafizSerial)}তম হাফেজ · উত্তরা ক্যাম্পাস`,
                  descriptionBn:
                    hafizDescBn.trim() ||
                    `আলহামদুলিল্লাহ! মাহারাত মডেল মাদ্রাসার হিফজুল কুরআন বিভাগ থেকে ${hafizNameBn.trim()} সফলভাবে পূর্ণাঙ্গ পবিত্র কুরআন হিফজ সম্পন্ন করেছে।`,
                  fatherNameBn: hafizFatherBn.trim() || undefined,
                  teacherNameBn: hafizTeacherBn.trim() || undefined,
                  hometownBn: hafizHometownBn.trim() || undefined,
                  biographyBn: hafizBioBn.trim() || undefined,
                  certificateUrl: hafizCertUrl.trim() || undefined,
                  photoUrl: hafizPhotoUrl.trim() || '/assets/maharat/fb/fb-media-21.jpg',
                  facebookPostUrl: hafizFbUrl.trim(),
                  featured: true,
                });
                setHafizSerial(nextSerial + 1);
                setHafizNameBn('');
                setHafizDescBn('');
                setHafizFatherBn('');
                setHafizTeacherBn('');
                setHafizHometownBn('');
                setHafizBioBn('');
                setHafizCertUrl('');
                setHafizFbUrl('');
              }}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-[#005a6e]/30 dark:border-slate-700 space-y-3 text-xs"
            >
              <div className="font-extrabold text-[#0a1738] dark:text-[#f0c95e]">
                + {tr('হিফজুল কুরআন টাইমলাইনে নতুন হাফেজ (জীবনী ও সার্টিফিকেটসহ) যুক্ত করুন', 'Add New Hafez with Biography & Certificate', 'إضافة حافظ جديد')}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  type="number"
                  value={hafizSerial}
                  onChange={(e) => setHafizSerial(Number(e.target.value))}
                  placeholder="Serial (e.g. 31)"
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-bold"
                />
                <input
                  type="text"
                  value={hafizNameBn}
                  onChange={(e) => setHafizNameBn(e.target.value)}
                  placeholder={tr('হাফেজের পূর্ণ নাম (বাংলায়)...', 'Hafez Full Name...', 'اسم الحافظ...')}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-bold"
                  required
                />
                <input
                  type="text"
                  value={hafizFatherBn}
                  onChange={(e) => setHafizFatherBn(e.target.value)}
                  placeholder={tr('পিতার নাম (ঐচ্ছিক)...', 'Father Name (optional)...', 'اسم الأب...')}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                />
                <input
                  type="text"
                  value={hafizTeacherBn}
                  onChange={(e) => setHafizTeacherBn(e.target.value)}
                  placeholder={tr('তত্ত্বাবধায়ক উস্তাদের নাম...', 'Hifz Ustad / Teacher...', 'اسم المعلم...')}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={hafizClassBn}
                  onChange={(e) => setHafizClassBn(e.target.value)}
                  placeholder={tr('শ্রেণি ও বিভাগ...', 'Class & Department...', 'الصف والقسم...')}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                />
                <input
                  type="text"
                  value={hafizSession}
                  onChange={(e) => setHafizSession(e.target.value)}
                  placeholder={tr('সেশন (যেমন: 2026)...', 'Session Year (e.g. 2026)...', 'السنة...')}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono"
                />
                <input
                  type="text"
                  value={hafizHometownBn}
                  onChange={(e) => setHafizHometownBn(e.target.value)}
                  placeholder={tr('নিজ জেলা / ঠিকানা...', 'Hometown / District...', 'المدينة...')}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                />
                <input
                  type="text"
                  value={hafizFbUrl}
                  onChange={(e) => setHafizFbUrl(e.target.value)}
                  placeholder={tr('ফেসবুক পোস্ট লিঙ্ক (ঐচ্ছিক)...', 'Facebook Post URL (optional)...', 'رابط منشور فيسبوك...')}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono"
                />
              </div>

              <textarea
                rows={2}
                value={hafizBioBn}
                onChange={(e) => setHafizBioBn(e.target.value)}
                placeholder={tr(
                  'হাফেজের বিস্তারিত জীবনী, হিফজ সফরের গল্প ও অর্জন লিখুন (টাইমলাইন ও বায়োগ্রাফি মোডালে দেখানো হবে)...',
                  'Detailed biography & Hifz journey...',
                  'السيرة الذاتية وإنجازات الحافظ...'
                )}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
              />

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <input
                  type="text"
                  value={hafizPhotoUrl}
                  onChange={(e) => setHafizPhotoUrl(e.target.value)}
                  placeholder={tr('হাফেজের ছবির লিঙ্ক...', 'Hafez Photo URL...', 'رابط الصورة...')}
                  className="sm:col-span-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono"
                />
                {uploadEnabled && (
                  <label className="sm:col-span-2 px-3 py-2 rounded-xl bg-[#f0c95e] hover:bg-[#fde68a] text-[#071129] font-extrabold text-center cursor-pointer">
                    <span>{tr('ছবি আপলোড', 'Upload Photo', 'رفع صورة')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFileUpload(e, (url) => setHafizPhotoUrl(url))}
                    />
                  </label>
                )}
                <input
                  type="text"
                  value={hafizCertUrl}
                  onChange={(e) => setHafizCertUrl(e.target.value)}
                  placeholder={tr('সার্টিফিকেট লিংক বা আপলোড (ইমেজ/PDF)...', 'Certificate URL or upload (Image/PDF)...', 'رابط الشهادة...')}
                  className="sm:col-span-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono"
                />
                {uploadEnabled && (
                  <label className="sm:col-span-1 px-2.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-center cursor-pointer">
                    <span>{tr('সনদ', 'Cert', 'شهادة')}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => handleImageFileUpload(e, (url) => setHafizCertUrl(url))}
                    />
                  </label>
                )}
                <button
                  type="submit"
                  className="sm:col-span-2 py-2 px-4 rounded-xl bg-gradient-to-r from-[#192f64] to-[#005a6e] hover:from-[#132654] hover:to-[#004454] text-white font-extrabold cursor-pointer"
                >
                  + {tr('হাফেজ যুক্ত করুন', 'Add Hafez', 'إضافة')}
                </button>
              </div>
            </form>
          )}

          {/* Editable List of All Huffaz (with Expandable Biography & Certificate Drawer) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[600px] overflow-y-auto pr-1">
            {(state.hifzTreeConfig?.graduates || [])
              .slice()
              .sort((a, b) => a.serialNumber - b.serialNumber)
              .map((g) => {
                const isExpanded = expandedHafizId === g.id;
                return (
                  <div
                    key={g.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={g.photoUrl}
                        alt={g.nameBn}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border-2 border-[#d4a843]/60"
                      />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-[#0a1738] dark:text-[#f0c95e] truncate">
                            {g.serialLabelBn} — {g.nameBn}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setExpandedHafizId(isExpanded ? null : g.id)}
                              className="px-2.5 py-1 rounded-lg bg-[#192f64] hover:bg-[#005a6e] text-white text-[10px] font-extrabold cursor-pointer transition-colors"
                            >
                              {isExpanded
                                ? tr('বন্ধ করুন', 'Close', 'إغلاق')
                                : tr('জীবনী ও সার্টিফিকেট', 'Bio & Cert', 'السيرة والشهادة')}
                            </button>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => deleteHafizGraduate(g.id)}
                                aria-label={`Delete ${g.nameBn}`}
                                className="text-rose-500 hover:text-rose-700 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-[#005a6e] dark:text-teal-300 font-bold">
                            {g.completionYear}
                          </span>
                          {g.certificateUrl ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                              ✓ {tr('সার্টিফিকেট সংযুক্ত', 'Certificate Attached', 'الشهادة مرفقة')}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                              {tr('অটো PDF সার্টিফিকেট চালু', 'Auto PDF Certificate Ready', 'شهادة PDF تلقائية')}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            disabled={!canEdit}
                            value={g.photoUrl}
                            onChange={(e) => updateHafizGraduate({ ...g, photoUrl: e.target.value })}
                            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 font-mono text-[11px]"
                            placeholder="Photo URL..."
                          />
                          {uploadEnabled && canEdit && (
                            <label className="px-2.5 py-1 rounded-lg bg-[#f0c95e] text-[#071129] font-extrabold text-[11px] cursor-pointer shrink-0">
                              <span>{tr('ছবি', 'Photo', 'صورة')}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  handleImageFileUpload(e, (url) =>
                                    updateHafizGraduate({ ...g, photoUrl: url })
                                  )
                                }
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Full Biography & Certificate Attachment Editor */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            disabled={!canEdit}
                            value={g.nameBn}
                            onChange={(e) => updateHafizGraduate({ ...g, nameBn: e.target.value })}
                            placeholder={tr('নাম (বাংলায়)', 'Name (Bn)', 'الاسم')}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 font-bold"
                          />
                          <input
                            type="text"
                            disabled={!canEdit}
                            value={g.nameEn}
                            onChange={(e) => updateHafizGraduate({ ...g, nameEn: e.target.value })}
                            placeholder={tr('নাম (ইংরেজিতে - PDF সার্টিফিকেটের জন্য)', 'Name (English - for PDF Certificate)', 'الاسم بالإنجليزية')}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5"
                          />
                          <input
                            type="text"
                            disabled={!canEdit}
                            value={g.fatherNameBn || ''}
                            onChange={(e) =>
                              updateHafizGraduate({ ...g, fatherNameBn: e.target.value })
                            }
                            placeholder={tr('পিতার নাম...', 'Father Name...', 'اسم الأب...')}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5"
                          />
                          <input
                            type="text"
                            disabled={!canEdit}
                            value={g.teacherNameBn || ''}
                            onChange={(e) =>
                              updateHafizGraduate({ ...g, teacherNameBn: e.target.value })
                            }
                            placeholder={tr('তত্ত্বাবধায়ক উস্তাদ...', 'Mentor Ustad...', 'المعلم...')}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5"
                          />
                          <input
                            type="text"
                            disabled={!canEdit}
                            value={g.hometownBn || ''}
                            onChange={(e) =>
                              updateHafizGraduate({ ...g, hometownBn: e.target.value })
                            }
                            placeholder={tr('নিজ জেলা / ঠিকানা...', 'Hometown...', 'المدينة...')}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5"
                          />
                          <input
                            type="text"
                            disabled={!canEdit}
                            value={g.certificateCode || ''}
                            onChange={(e) =>
                              updateHafizGraduate({ ...g, certificateCode: e.target.value })
                            }
                            placeholder={tr('সার্টিফিকেট কোড (যেমন: MMM-HIFZ-2026-030)', 'Certificate Code (optional)', 'رقم الشهادة')}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 font-mono"
                          />
                        </div>

                        <textarea
                          rows={2}
                          disabled={!canEdit}
                          value={g.biographyBn ?? g.descriptionBn}
                          onChange={(e) =>
                            updateHafizGraduate({
                              ...g,
                              biographyBn: e.target.value,
                              descriptionBn: e.target.value,
                            })
                          }
                          placeholder={tr('হাফেজের পূর্ণাঙ্গ জীবনী লিখুন...', 'Full Biography...', 'السيرة الذاتية...')}
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5"
                        />

                        <div className="flex gap-1.5 items-center">
                          <input
                            type="text"
                            disabled={!canEdit}
                            value={g.certificateUrl || ''}
                            onChange={(e) =>
                              updateHafizGraduate({ ...g, certificateUrl: e.target.value })
                            }
                            placeholder={tr('সার্টিফিকেট ফাইল URL (অথবা ডানদিকে আপলোড করুন)...', 'Certificate URL or upload file...', 'رابط الشهادة...')}
                            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 font-mono text-[11px]"
                          />
                          {uploadEnabled && canEdit && (
                            <label className="px-3 py-1.5 rounded-lg bg-[#005a6e] hover:bg-[#004454] text-white font-extrabold text-[11px] cursor-pointer shrink-0">
                              <span>{tr('সার্টিফিকেট আপলোড', 'Upload Cert', 'رفع الشهادة')}</span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                onChange={(e) =>
                                  handleImageFileUpload(e, (url) =>
                                    updateHafizGraduate({ ...g, certificateUrl: url })
                                  )
                                }
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 3: CATEGORIZED PHOTO GALLERY & FACEBOOK POSTS (17 POSTS)
         ===================================================================== */}
      {mediaSubTab === 'photo-gallery' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-slate-800 p-6 space-y-6 shadow-xs">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {tr(
                `ফটো গ্যালারি ও ফেসবুক পোস্ট ম্যানেজার (${state.photoGallery?.length || 17}টি পোস্ট)`,
                `Categorized Photo Gallery & Facebook Post Manager (${state.photoGallery?.length || 17} Posts)`,
                'إدارة معرض الصور ومنشورات فيسبوك'
              )}
            </h3>
            <p className="text-xs text-slate-500">
              {tr(
                'ফেসবুক পোস্টের লিংক অথবা সরাসরি ছবি আপলোড করে ক্যাটাগরি অনুযায়ী গ্যালারিতে যুক্ত করুন',
                'Add new gallery photos via Facebook link or Direct Image File Upload',
                'أضف صوراً جديدة عبر رابط فيسبوك أو برفع ملف الصورة مباشرة'
              )}
            </p>
          </div>

          {canEdit && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!pgTitleBn.trim()) return;
                addPhotoGalleryItem({
                  titleBn: pgTitleBn.trim(),
                  titleEn: pgTitleBn.trim(),
                  category: pgCategory,
                  badgeTextBn: pgBadgeBn.trim() || pgCategory,
                  descriptionBn: pgDescBn.trim() || pgTitleBn.trim(),
                  dateBn: '২০২৬ শিক্ষাবর্ষ',
                  imageUrl: pgImageUrl.trim() || '/assets/maharat/fb/fb-media-16.jpg',
                  facebookPostUrl: pgFbUrl.trim(),
                  active: true,
                });
                setPgTitleBn('');
                setPgBadgeBn('');
                setPgDescBn('');
                setPgFbUrl('');
              }}
              className="p-4 rounded-2xl bg-purple-50/60 dark:bg-slate-800/60 border border-purple-200 dark:border-slate-700 space-y-3 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={pgTitleBn}
                  onChange={(e) => setPgTitleBn(e.target.value)}
                  placeholder={tr('ছবির শিরোনাম (Title)...', 'Photo Title...', 'عنوان الصورة...')}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-bold"
                  required
                />
                <select
                  value={pgCategory}
                  onChange={(e) => setPgCategory(e.target.value as PhotoGalleryCategory)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-bold"
                >
                  <option value="Hifz & Sabak">Hifz & Sabak (হিফজ ও সবক)</option>
                  <option value="Board & Exam Results">Board & Exam Results (বোর্ড ফলাফল)</option>
                  <option value="Study Tour & Events">Study Tour & Events (শিক্ষাসফর ও ইভেন্ট)</option>
                  <option value="Seerah & Publications">Seerah & Publications (সীরাত ও পত্রিকা)</option>
                  <option value="Teacher Training & Campus">Teacher Training & Campus (প্রশিক্ষণ ও ক্যাম্পাস)</option>
                </select>
                <input
                  type="text"
                  value={pgFbUrl}
                  onChange={(e) => setPgFbUrl(e.target.value)}
                  placeholder={tr('ফেসবুক পোস্ট লিঙ্ক (ঐচ্ছিক)...', 'Facebook Post URL...', 'رابط منشور فيسبوك...')}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <input
                  type="text"
                  value={pgDescBn}
                  onChange={(e) => setPgDescBn(e.target.value)}
                  placeholder={tr('বিস্তারিত ক্যাপশন বা বিবরণ...', 'Detailed caption...', 'وصف الصورة...')}
                  className="sm:col-span-5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                />
                <input
                  type="text"
                  value={pgImageUrl}
                  onChange={(e) => setPgImageUrl(e.target.value)}
                  placeholder={tr('ছবির লিঙ্ক বা ফাইল আপলোড...', 'Image URL or upload...', 'رابط الصورة...')}
                  className="sm:col-span-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono"
                />
                {uploadEnabled && (
                  <label className="sm:col-span-1 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-center cursor-pointer">
                    <span>{tr('আপলোড', 'Upload', 'رفع')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFileUpload(e, (url) => setPgImageUrl(url))}
                    />
                  </label>
                )}
                <button
                  type="submit"
                  className="sm:col-span-2 py-2 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold cursor-pointer"
                >
                  + {tr('ছবি যুক্ত করুন', 'Add Photo', 'إضافة صورة')}
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
            {(state.photoGallery || []).map((pg) => (
              <div
                key={pg.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-3 text-xs"
              >
                <img
                  src={pg.imageUrl}
                  alt={pg.titleBn}
                  className="w-16 h-14 rounded-xl object-cover shrink-0 border border-purple-300"
                />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-slate-900 dark:text-white truncate">
                      {pg.titleBn}
                    </span>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => deletePhotoGalleryItem(pg.id)}
                        className="text-rose-500 hover:text-rose-700 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="text-[11px] text-purple-700 dark:text-amber-300 font-bold">
                    {pg.category}
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={pg.imageUrl}
                      onChange={(e) => updatePhotoGalleryItem({ ...pg, imageUrl: e.target.value })}
                      className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 font-mono text-[11px]"
                    />
                    {uploadEnabled && canEdit && (
                      <label className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-extrabold text-[11px] cursor-pointer shrink-0">
                        <span>{tr('আপলোড', 'Upload', 'رفع')}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleImageFileUpload(e, (url) =>
                              updatePhotoGalleryItem({ ...pg, imageUrl: url })
                            )
                          }
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminBackupAndAITab: React.FC = () => {
  const { state, language, importFullCMSState, resetToDefaultData, updateSettings } = useCMS();

  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  const [aiRawText, setAiRawText] = useState('');

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maharat_madrasah_cms_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || '{}'));
        if (parsed && parsed.settings) {
          importFullCMSState(
            parsed,
            tr(
              'JSON ব্যাকআপ ফাইল থেকে সম্পূর্ণ ডাটাবেস রিস্টোর হয়েছে।',
              'Full CMS database restored from JSON backup file.',
              'تمت استعادة قاعدة البيانات بالكامل من ملف النسخ الاحتياطي JSON.'
            )
          );
        }
      } catch {
        // Ignore invalid JSON
      }
    };
    reader.readAsText(file);
  };

  const handleAIExtractApply = () => {
    if (!aiRawText.trim()) return;
    const lines = aiRawText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const phoneMatch = aiRawText.match(/01[3-9]\d{2}[- ]?\d{6}/);
    const emailMatch = aiRawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    updateSettings({
      ...state.settings,
      instituteName: lines[0] || state.settings.instituteName,
      tagline: lines[1] || state.settings.tagline,
      phonePrimary: phoneMatch ? phoneMatch[0] : state.settings.phonePrimary,
      email: emailMatch ? emailMatch[0] : state.settings.email,
    });
    setAiRawText('');
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-r from-[#2e0249] via-[#4c0575] to-[#2e0249] text-white rounded-2xl p-6 shadow-xl border border-purple-500/30 space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-purple-950 text-xs font-black uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {tr(
              'প্রোডাকশন ডাটা ব্যাকআপ, রিস্টোর ও স্মার্ট ডকুমেন্ট এক্সট্রাক্টর',
              'Production JSON Backup, Restore & Smart Document Extractor',
              'النسخ الاحتياطي والاستعادة واستخراج البيانات الذكي'
            )}
          </span>
        </span>
        <h2 className="text-xl font-extrabold">
          {tr(
            '১-ক্লিক সম্পূর্ণ ওয়েবসাইট ডাটা এক্সপোর্ট (.json), রিস্টোর এবং অটো-ফিল',
            '1-Click Full Website Data Export (.json), Restore & Smart Auto-Fill',
            'تصدير واستعادة بيانات الموقع بالكامل بضغطة واحدة (.json)'
          )}
        </h2>
        <p className="text-xs text-purple-200">
          {tr(
            'যেকোনো হোস্টিং প্যানেলে ওয়েবসাইটটি লাইভ ও মাইগ্রেট করার জন্য সম্পূর্ণ ডাটাবেস JSON হিসেবে ডাউনলোড বা আপলোড করুন।',
            'Download or upload the complete CMS database as a portable JSON file for instant migration to any production hosting server.',
            'قم بتنزيل أو رفع قاعدة بيانات النظام بالكامل كملف JSON جاهز للاستضافة.'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {tr(
              'সম্পূর্ণ ডাটাবেস ব্যাকআপ ও রিস্টোর (.json)',
              'Full Database Backup & Restore (.json)',
              'النسخ الاحتياطي واستعادة قاعدة البيانات (.json)'
            )}
          </h3>
          <p className="text-xs text-slate-500">
            {tr(
              'কোর্স, নোটিশ, ইনফোগ্রাফিক, ছুটির আবেদন, RBAC পারমিশন এবং সেটিংসসহ সব ডাটা সংরক্ষণ করুন।',
              'Export or restore all courses, notices, infographics, leave requests, RBAC permissions, and site settings.',
              'تصدير أو استعادة جميع الدورات والإعلانات والإنفوجرافيك وطلبات الإجازة والصلاحيات.'
            )}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={handleExportJSON}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>
                {tr(
                  'সম্পূর্ণ ব্যাকআপ ডাউনলোড (.json)',
                  'Download Full Backup (.json)',
                  'تحميل النسخة الاحتياطية (.json)'
                )}
              </span>
            </button>

            <label className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-purple-950 text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-xs">
              <span>
                {tr(
                  'ব্যাকআপ ফাইল আপলোড করুন',
                  'Restore from JSON File',
                  'استعادة من ملف JSON'
                )}
              </span>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>

            <button
              type="button"
              onClick={resetToDefaultData}
              className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer"
            >
              {tr('ফ্যাক্টরি ডাটা রিসেট', 'Factory Reset', 'إعادة ضبط المصنع')}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {tr(
              'স্মার্ট ডকুমেন্ট ও প্রসপেক্টাস অটো-ফিল এক্সট্রাক্টর',
              'Smart Prospectus & Document Auto-Fill Extractor',
              'مستخرج البيانات الذكي من النشرات التعريفية'
            )}
          </h3>
          <textarea
            rows={4}
            value={aiRawText}
            onChange={(e) => setAiRawText(e.target.value)}
            placeholder={tr(
              'প্রতিষ্ঠানের নাম, স্লোগান, ফোন নম্বর ও ইমেইলসহ যেকোনো টেক্সট পেস্ট করুন...',
              'Paste raw institution text (Institute Name on Line 1, Tagline on Line 2, Phone & Email anywhere)...',
              'الصق نص المؤسسة (اسم المؤسسة، الشعار، رقم الهاتف والبريد الإلكتروني)...'
            )}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-3 text-xs bg-transparent"
          />
          <button
            type="button"
            onClick={handleAIExtractApply}
            className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold cursor-pointer"
          >
            {tr(
              'অটো-ফিল ও ব্র্যান্ডিং আপডেট করুন',
              'Extract & Auto-Update Branding',
              'استخراج وتحديث بيانات المؤسسة تلقائياً'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

