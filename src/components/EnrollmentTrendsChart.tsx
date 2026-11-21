import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  BookOpen,
  Bus,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck2,
  Filter,
  Plus,
  Sparkles,
  TicketPercent,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import { localizeDynamicText } from '../utils/i18nContent';

type TimeframeOption = '6m' | '1y' | 'all';
type ChartViewMode = 'area' | 'bar';

interface DiscountTokenItem {
  id: string;
  code: string;
  studentName: string;
  targetClass: string;
  discountPercent: number;
  issuedBy: string;
  note: string;
  status: 'Active' | 'Applied';
  createdAt: string;
}

interface MonthlyCourseRecord {
  monthKey: string;
  monthLabel: string;
  byCourse: Record<
    string,
    {
      enrolled: number;
      inPipeline: number;
      pending: number;
    }
  >;
}

const HISTORICAL_BASELINE: MonthlyCourseRecord[] = [
  {
    monthKey: '2025-08',
    monthLabel: 'Aug 25',
    byCourse: {
      'course-prep-2': { enrolled: 14, inPipeline: 6, pending: 4 },
      'course-class-3': { enrolled: 9, inPipeline: 4, pending: 3 },
      'course-class-4-8': { enrolled: 12, inPipeline: 5, pending: 4 },
      'course-hifz': { enrolled: 16, inPipeline: 7, pending: 5 },
      'course-it-skills': { enrolled: 8, inPipeline: 4, pending: 2 },
      'course-soft-hard': { enrolled: 6, inPipeline: 3, pending: 2 },
    },
  },
  {
    monthKey: '2025-09',
    monthLabel: 'Sep 25',
    byCourse: {
      'course-prep-2': { enrolled: 16, inPipeline: 7, pending: 4 },
      'course-class-3': { enrolled: 11, inPipeline: 5, pending: 3 },
      'course-class-4-8': { enrolled: 14, inPipeline: 6, pending: 3 },
      'course-hifz': { enrolled: 18, inPipeline: 8, pending: 4 },
      'course-it-skills': { enrolled: 10, inPipeline: 5, pending: 3 },
      'course-soft-hard': { enrolled: 7, inPipeline: 3, pending: 2 },
    },
  },
  {
    monthKey: '2025-10',
    monthLabel: 'Oct 25',
    byCourse: {
      'course-prep-2': { enrolled: 19, inPipeline: 8, pending: 5 },
      'course-class-3': { enrolled: 12, inPipeline: 5, pending: 4 },
      'course-class-4-8': { enrolled: 15, inPipeline: 7, pending: 4 },
      'course-hifz': { enrolled: 21, inPipeline: 9, pending: 5 },
      'course-it-skills': { enrolled: 11, inPipeline: 5, pending: 3 },
      'course-soft-hard': { enrolled: 8, inPipeline: 4, pending: 2 },
    },
  },
  {
    monthKey: '2025-11',
    monthLabel: 'Nov 25',
    byCourse: {
      'course-prep-2': { enrolled: 22, inPipeline: 9, pending: 5 },
      'course-class-3': { enrolled: 14, inPipeline: 6, pending: 4 },
      'course-class-4-8': { enrolled: 18, inPipeline: 8, pending: 5 },
      'course-hifz': { enrolled: 25, inPipeline: 10, pending: 6 },
      'course-it-skills': { enrolled: 13, inPipeline: 6, pending: 3 },
      'course-soft-hard': { enrolled: 9, inPipeline: 4, pending: 3 },
    },
  },
  {
    monthKey: '2025-12',
    monthLabel: 'Dec 25',
    byCourse: {
      'course-prep-2': { enrolled: 28, inPipeline: 11, pending: 6 },
      'course-class-3': { enrolled: 18, inPipeline: 7, pending: 4 },
      'course-class-4-8': { enrolled: 22, inPipeline: 9, pending: 5 },
      'course-hifz': { enrolled: 31, inPipeline: 12, pending: 6 },
      'course-it-skills': { enrolled: 15, inPipeline: 6, pending: 4 },
      'course-soft-hard': { enrolled: 11, inPipeline: 5, pending: 3 },
    },
  },
  {
    monthKey: '2026-01',
    monthLabel: 'Jan 26',
    byCourse: {
      'course-prep-2': { enrolled: 34, inPipeline: 12, pending: 6 },
      'course-class-3': { enrolled: 21, inPipeline: 8, pending: 5 },
      'course-class-4-8': { enrolled: 26, inPipeline: 10, pending: 5 },
      'course-hifz': { enrolled: 36, inPipeline: 13, pending: 7 },
      'course-it-skills': { enrolled: 18, inPipeline: 7, pending: 4 },
      'course-soft-hard': { enrolled: 14, inPipeline: 5, pending: 3 },
    },
  },
  {
    monthKey: '2026-02',
    monthLabel: 'Feb 26',
    byCourse: {
      'course-prep-2': { enrolled: 24, inPipeline: 9, pending: 4 },
      'course-class-3': { enrolled: 16, inPipeline: 6, pending: 3 },
      'course-class-4-8': { enrolled: 20, inPipeline: 8, pending: 4 },
      'course-hifz': { enrolled: 27, inPipeline: 10, pending: 5 },
      'course-it-skills': { enrolled: 16, inPipeline: 6, pending: 3 },
      'course-soft-hard': { enrolled: 12, inPipeline: 4, pending: 2 },
    },
  },
  {
    monthKey: '2026-03',
    monthLabel: 'Mar 26',
    byCourse: {
      'course-prep-2': { enrolled: 21, inPipeline: 8, pending: 4 },
      'course-class-3': { enrolled: 15, inPipeline: 6, pending: 3 },
      'course-class-4-8': { enrolled: 19, inPipeline: 7, pending: 4 },
      'course-hifz': { enrolled: 29, inPipeline: 11, pending: 5 },
      'course-it-skills': { enrolled: 19, inPipeline: 8, pending: 4 },
      'course-soft-hard': { enrolled: 13, inPipeline: 5, pending: 3 },
    },
  },
  {
    monthKey: '2026-04',
    monthLabel: 'Apr 26',
    byCourse: {
      'course-prep-2': { enrolled: 23, inPipeline: 9, pending: 4 },
      'course-class-3': { enrolled: 16, inPipeline: 7, pending: 3 },
      'course-class-4-8': { enrolled: 21, inPipeline: 8, pending: 4 },
      'course-hifz': { enrolled: 26, inPipeline: 10, pending: 4 },
      'course-it-skills': { enrolled: 21, inPipeline: 8, pending: 4 },
      'course-soft-hard': { enrolled: 15, inPipeline: 6, pending: 3 },
    },
  },
  {
    monthKey: '2026-05',
    monthLabel: 'May 26',
    byCourse: {
      'course-prep-2': { enrolled: 25, inPipeline: 10, pending: 5 },
      'course-class-3': { enrolled: 17, inPipeline: 7, pending: 4 },
      'course-class-4-8': { enrolled: 23, inPipeline: 9, pending: 4 },
      'course-hifz': { enrolled: 28, inPipeline: 11, pending: 5 },
      'course-it-skills': { enrolled: 23, inPipeline: 9, pending: 4 },
      'course-soft-hard': { enrolled: 16, inPipeline: 6, pending: 3 },
    },
  },
  {
    monthKey: '2026-06',
    monthLabel: 'Jun 26',
    byCourse: {
      'course-prep-2': { enrolled: 27, inPipeline: 10, pending: 5 },
      'course-class-3': { enrolled: 19, inPipeline: 8, pending: 4 },
      'course-class-4-8': { enrolled: 25, inPipeline: 9, pending: 5 },
      'course-hifz': { enrolled: 30, inPipeline: 12, pending: 5 },
      'course-it-skills': { enrolled: 25, inPipeline: 9, pending: 4 },
      'course-soft-hard': { enrolled: 18, inPipeline: 7, pending: 3 },
    },
  },
  {
    monthKey: '2026-07',
    monthLabel: 'Jul 26',
    byCourse: {
      'course-prep-2': { enrolled: 29, inPipeline: 11, pending: 5 },
      'course-class-3': { enrolled: 20, inPipeline: 8, pending: 4 },
      'course-class-4-8': { enrolled: 27, inPipeline: 10, pending: 5 },
      'course-hifz': { enrolled: 32, inPipeline: 12, pending: 6 },
      'course-it-skills': { enrolled: 27, inPipeline: 10, pending: 5 },
      'course-soft-hard': { enrolled: 19, inPipeline: 7, pending: 4 },
    },
  },
  {
    monthKey: '2026-08',
    monthLabel: 'Aug 26',
    byCourse: {
      'course-prep-2': { enrolled: 31, inPipeline: 12, pending: 5 },
      'course-class-3': { enrolled: 22, inPipeline: 9, pending: 4 },
      'course-class-4-8': { enrolled: 29, inPipeline: 11, pending: 5 },
      'course-hifz': { enrolled: 35, inPipeline: 13, pending: 6 },
      'course-it-skills': { enrolled: 29, inPipeline: 11, pending: 5 },
      'course-soft-hard': { enrolled: 21, inPipeline: 8, pending: 4 },
    },
  },
  {
    monthKey: '2026-09',
    monthLabel: 'Sep 26',
    byCourse: {
      'course-prep-2': { enrolled: 35, inPipeline: 13, pending: 6 },
      'course-class-3': { enrolled: 24, inPipeline: 9, pending: 5 },
      'course-class-4-8': { enrolled: 32, inPipeline: 12, pending: 5 },
      'course-hifz': { enrolled: 38, inPipeline: 14, pending: 6 },
      'course-it-skills': { enrolled: 31, inPipeline: 12, pending: 5 },
      'course-soft-hard': { enrolled: 23, inPipeline: 8, pending: 4 },
    },
  },
  {
    monthKey: '2026-10',
    monthLabel: 'Oct 26 (Live)',
    byCourse: {
      'course-prep-2': { enrolled: 38, inPipeline: 14, pending: 6 },
      'course-class-3': { enrolled: 26, inPipeline: 10, pending: 5 },
      'course-class-4-8': { enrolled: 34, inPipeline: 13, pending: 5 },
      'course-hifz': { enrolled: 41, inPipeline: 15, pending: 6 },
      'course-it-skills': { enrolled: 33, inPipeline: 12, pending: 5 },
      'course-soft-hard': { enrolled: 25, inPipeline: 9, pending: 4 },
    },
  },
];

const INITIAL_DISCOUNT_TOKENS: DiscountTokenItem[] = [
  {
    id: 'tok-1',
    code: 'MMM-TOK-2026-01',
    studentName: 'আহনাফ রহমান (Ahnaf Rahman)',
    targetClass: 'Class 4 (General Academic)',
    discountPercent: 15,
    issuedBy: 'Principal / Vice Principal',
    note: 'অভিভাবকের বিশেষ আবেদনের প্রেক্ষিতে প্রিন্সিপাল কোটা থেকে ১৫% টিউশন ছাড় অনুমোদিত।',
    status: 'Active',
    createdAt: '2026-10-28',
  },
  {
    id: 'tok-2',
    code: 'MMM-TOK-2026-02',
    studentName: 'মুহাম্মাদ ত্বহা (Muhammad Taha)',
    targetClass: 'Tahfizul Quran (Day-Care)',
    discountPercent: 20,
    issuedBy: 'Principal / Vice Principal',
    note: 'হাফেজ পরিবারের সন্তান হিসেবে ভর্তি ফিতে ২০% বিশেষ ছাড় টোকেন।',
    status: 'Applied',
    createdAt: '2026-10-25',
  },
];

export const EnrollmentTrendsChart: React.FC = () => {
  const { state, theme, language } = useCMS();
  const [timeframe, setTimeframe] = useState<TimeframeOption>('6m');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('All');
  const [chartMode, setChartMode] = useState<ChartViewMode>('area');

  // Seasonal Mode: When admission Season is active vs Regular Academic Operations
  const [isAdmissionSeasonActive, setIsAdmissionSeasonActive] = useState<boolean>(
    state.popupConfig?.enabled ?? true
  );

  // Principal / VP Special Admission Discount Token Quota State
  const TOTAL_TOKEN_QUOTA = 25;
  const [tokens, setTokens] = useState<DiscountTokenItem[]>(() => {
    try {
      const saved = localStorage.getItem('mmm_admission_discount_tokens_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_DISCOUNT_TOKENS;
  });

  const [newTokenStudent, setNewTokenStudent] = useState('');
  const [newTokenClass, setNewTokenClass] = useState('Class 3 (Academic)');
  const [newTokenDiscount, setNewTokenDiscount] = useState<number>(15);
  const [newTokenNote, setNewTokenNote] = useState('');

  const saveTokens = (next: DiscountTokenItem[]) => {
    setTokens(next);
    try {
      localStorage.setItem('mmm_admission_discount_tokens_v1', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleIssueToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenStudent.trim()) return;
    const nextNum = String(tokens.length + 1).padStart(2, '0');
    const newTok: DiscountTokenItem = {
      id: `tok-${Date.now()}`,
      code: `MMM-TOK-2026-${nextNum}`,
      studentName: newTokenStudent.trim(),
      targetClass: newTokenClass,
      discountPercent: Number(newTokenDiscount) || 10,
      issuedBy: 'Principal / Vice Principal',
      note:
        newTokenNote.trim() ||
        'প্রিন্সিপাল/ভাইস-প্রিন্সিপাল স্পেশাল কোটা থেকে বিশেষ ডিসকাউন্ট অনুমোদিত।',
      status: 'Active',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    saveTokens([newTok, ...tokens]);
    setNewTokenStudent('');
    setNewTokenNote('');
  };

  const handleToggleTokenStatus = (id: string) => {
    saveTokens(
      tokens.map((t) =>
        t.id === id ? { ...t, status: t.status === 'Active' ? 'Applied' : 'Active' } : t
      )
    );
  };

  const isDark = theme === 'dark';
  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;
  const loc = (val?: string) => (val ? localizeDynamicText(val, language) : '');

  const chartData = useMemo(() => {
    const sliceCount = timeframe === '6m' ? 6 : timeframe === '1y' ? 12 : HISTORICAL_BASELINE.length;
    const slicedRecords = HISTORICAL_BASELINE.slice(-sliceCount);

    const relevantLiveLeads =
      selectedCourseId === 'All'
        ? state.leads
        : state.leads.filter((l) => l.courseId === selectedCourseId);

    const liveEnrolled = relevantLiveLeads.filter(
      (l) => l.status === 'Enrolled' || l.status === 'Admitted'
    ).length;
    const liveInPipeline = relevantLiveLeads.filter((l) =>
      ['Contacted', 'Document Verification', 'Interview Scheduled', 'Offer Extended'].includes(
        l.status
      )
    ).length;
    const livePending = relevantLiveLeads.filter((l) => l.status === 'Pending').length;

    return slicedRecords.map((record, index) => {
      const isLatestMonth = index === slicedRecords.length - 1;
      let enrolled = 0;
      let inPipeline = 0;
      let pending = 0;

      if (selectedCourseId === 'All') {
        Object.values(record.byCourse).forEach((cStats) => {
          enrolled += cStats.enrolled;
          inPipeline += cStats.inPipeline;
          pending += cStats.pending;
        });
      } else {
        const courseData = record.byCourse[selectedCourseId] || {
          enrolled: 10,
          inPipeline: 4,
          pending: 2,
        };
        enrolled = courseData.enrolled;
        inPipeline = courseData.inPipeline;
        pending = courseData.pending;
      }

      if (isLatestMonth) {
        enrolled += liveEnrolled;
        inPipeline += liveInPipeline;
        pending += livePending;
      }

      const totalInquiries = enrolled + inPipeline + pending;

      return {
        month: record.monthLabel,
        enrolled,
        inPipeline,
        pending,
        totalInquiries,
      };
    });
  }, [timeframe, selectedCourseId, state.leads]);

  const kpiMetrics = useMemo(() => {
    const totalEnrolled = chartData.reduce((acc, row) => acc + row.enrolled, 0);
    const totalPipeline = chartData.reduce((acc, row) => acc + row.inPipeline, 0);
    const totalInquiries = chartData.reduce((acc, row) => acc + row.totalInquiries, 0);

    const conversionRate =
      totalInquiries > 0 ? ((totalEnrolled / totalInquiries) * 100).toFixed(1) : '0.0';

    const firstMonthEnrolled = chartData[0]?.enrolled || 1;
    const lastMonthEnrolled = chartData[chartData.length - 1]?.enrolled || firstMonthEnrolled;
    const growthPct = (
      ((lastMonthEnrolled - firstMonthEnrolled) / Math.max(1, firstMonthEnrolled)) *
      100
    ).toFixed(1);

    return {
      totalEnrolled,
      totalPipeline,
      totalInquiries,
      conversionRate,
      growthPct: Number(growthPct) >= 0 ? `+${growthPct}%` : `${growthPct}%`,
      latestMonthEnrolled: lastMonthEnrolled,
    };
  }, [chartData]);

  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const axisTickColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6 transition-colors"
    >
      {/* Top Mode Switcher: Admission Season Active vs Regular Academic Year Info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-purple-950 via-[#2e0249] to-purple-900 text-white rounded-2xl p-4 sm:p-5 border border-purple-500/30 shadow-md">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-purple-950 text-[11px] font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isAdmissionSeasonActive
                ? tr('ভর্তি মৌসুম সক্রিয় (Admission Season ON)', 'Admission Season Active', 'موسم القبول والتسجيل نشط')
                : tr('সাধারণ শিক্ষাবর্ষ মোড (Regular Academic Mode)', 'Regular Academic Session Mode', 'وضع العام الدراسي المعتاد')}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-white">
            {isAdmissionSeasonActive
              ? tr(
                  'ভর্তি প্রগ্রেস চার্ট ও প্রিন্সিপাল স্পেশাল ডিসকাউন্ট টোকেন কন্ট্রোলার',
                  'Interactive Admission Progress & Principal Discount Token Controller',
                  'مخطط تقدم القبول ووحدة تحكم قسائم الخصم الخاصة بالمدير'
                )
              : tr(
                  'প্রতিষ্ঠানের একাডেমিক কার্যক্রম, রুটিন, শিক্ষক উপস্থিতি ও পরিবহন সারসংক্ষেপ',
                  'Institutional Academic Summary, Routine, Faculty & Transport Overview',
                  'ملخص الأنشطة الأكاديمية، والروتين اليومي، وحضور المعلمين والنقل'
                )}
          </h3>
          <p className="text-xs text-purple-200">
            {isAdmissionSeasonActive
              ? tr(
                  'ভর্তি চলাকালীন সময়ে আবেদনের প্রগ্রেস চার্ট এবং প্রিন্সিপাল/ভাইস-প্রিন্সিপালের স্পেশাল ডিসকাউন্ট টোকেন এখান থেকে নিয়ন্ত্রণ করুন।',
                  'Monitor live enrollment progress and manage Principal/VP special discount tokens during active admission season.',
                  'متابعة تقدم القبول وإدارة قسائم الخصم الخاصة بالمدير خلال فترة التسجيل.'
                )
              : tr(
                  'ভর্তি মৌসুম বন্ধ থাকাকালীন সময়ে প্রতিষ্ঠানের নিয়মিত ক্লাস, ডে-কেয়ার রুটিন, নোটিশ ও পরিবহন তথ্য এখানে প্রদর্শিত হয়।',
                  'When admission season is closed, regular institutional academic schedules, faculty leaves, and campus operations are displayed here.',
                  'في غير موسم القبول، يتم عرض الجدول الأكاديمي المعتاد، وإجازات المعلمين، وحركة النقل.'
                )}
          </p>
        </div>

        {/* Toggle Switch between Admission Season & Regular Academic Mode */}
        <div className="flex items-center gap-2 shrink-0 bg-white/10 p-1.5 rounded-xl border border-white/15">
          <button
            type="button"
            onClick={() => setIsAdmissionSeasonActive(true)}
            className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              isAdmissionSeasonActive
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-purple-950 shadow-sm'
                : 'text-purple-100 hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{tr('ভর্তি চলাকালীন ভিউ', 'Admission Season View', 'عرض موسم القبول')}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAdmissionSeasonActive(false)}
            className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              !isAdmissionSeasonActive
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-purple-950 shadow-sm'
                : 'text-purple-100 hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{tr('সাধারণ শিক্ষাবর্ষ ভিউ', 'Regular Institutional View', 'عرض المعلومات العامة')}</span>
          </button>
        </div>
      </div>

      {isAdmissionSeasonActive ? (
        <>
          {/* ADMISSION SEASON MODE: Interactive Chart + Principal Discount Token System */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                <TrendingUp className="w-4 h-4" />
                <span>
                  {tr(
                    'ভর্তি গতিপ্রকৃতি ও ফানেল অ্যানালিটিক্স',
                    'Admissions Velocity & Funnel Analytics',
                    'تحليلات معدل القبول والتسجيل'
                  )}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {tr(
                  'মাসিক শিক্ষার্থী ভর্তি ও আবেদনের ধারাবাহিক চিত্র',
                  'Student Enrollment Trends Over Time',
                  'اتجاهات تسجيل الطلاب بمرور الوقت'
                )}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  aria-label="Filter enrollment trends by course"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 text-xs font-semibold focus:border-purple-600 focus:outline-none cursor-pointer max-w-[220px] truncate"
                >
                  <option value="All">
                    {tr('সকল বিভাগ ও কোর্স', 'All Courses & Departments', 'جميع الدورات والأقسام')}
                  </option>
                  {state.courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {language === 'bn' ? course.titleBn || course.title : course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div
                role="group"
                aria-label="Select enrollment chart timeframe"
                className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700"
              >
                {(
                  [
                    { id: '6m', label: tr('৬ মাস', '6 Months', '٦ أشهر') },
                    { id: '1y', label: tr('১ বছর', '1 Year', 'سنة واحدة') },
                    { id: 'all', label: tr('সর্বমোট', 'All Time', 'كل الأوقات') },
                  ] as const
                ).map((tf) => (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() => setTimeframe(tf.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      timeframe === tf.id
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              <div
                role="group"
                aria-label="Select chart visualization type"
                className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700"
              >
                <button
                  type="button"
                  onClick={() => setChartMode('area')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    chartMode === 'area'
                      ? 'bg-slate-900 dark:bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{tr('এরিয়া', 'Area', 'مساحة')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('bar')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    chartMode === 'bar'
                      ? 'bg-slate-900 dark:bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>{tr('বার', 'Bar', 'أعمدة')}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {tr('মোট ভর্তিকৃত শিক্ষার্থী', 'Total Enrolled (Selected Period)', 'إجمالي الطلاب المسجلين')}
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
                  {kpiMetrics.totalEnrolled}
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                  {kpiMetrics.latestMonthEnrolled}{' '}
                  {tr('জন চলতি মাসে ভর্তি', 'Enrolled in Latest Month', 'مسجل في الشهر الحالي')}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {tr('আবেদন থেকে ভর্তির হার', 'Inquiry-to-Enrollment Conversion', 'معدل التحويل من الطلب إلى التسجيل')}
                </div>
                <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums mt-1">
                  {kpiMetrics.conversionRate}%
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  {kpiMetrics.totalEnrolled} / {kpiMetrics.totalInquiries}{' '}
                  {tr('মোট আবেদন', 'Total Inquiries', 'إجمالي الطلبات')}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {tr('প্রিন্সিপাল ডিসকাউন্ট টোকেন কোটা', 'Principal Discount Token Quota', 'حصة قسائم خصم المدير')}
                </div>
                <div className="text-2xl font-extrabold text-purple-700 dark:text-purple-400 font-mono tabular-nums mt-1">
                  {tokens.length} / {TOTAL_TOKEN_QUOTA}
                </div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 font-mono mt-0.5">
                  {TOTAL_TOKEN_QUOTA - tokens.length}{' '}
                  {tr('টি স্পেশাল টোকেন অবশিষ্ট', 'Special Tokens Remaining', 'قسيمة خاصة متبقية')}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <TicketPercent className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'area' ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEnrolled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9333ea" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#9333ea" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="colorPipeline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke={axisTickColor}
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: gridStroke }}
                  />
                  <YAxis stroke={axisTickColor} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                  <Area
                    type="monotone"
                    dataKey="enrolled"
                    name={tr('ভর্তিকৃত শিক্ষার্থী', 'Enrolled / Admitted', 'الطلاب المقبولون')}
                    stroke="#9333ea"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorEnrolled)"
                  />
                  <Area
                    type="monotone"
                    dataKey="inPipeline"
                    name={tr('যাচাই ও সাক্ষাৎকার পর্যায়', 'Active Pipeline', 'قيد المراجعة والمقابلة')}
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPipeline)"
                  />
                  <Area
                    type="monotone"
                    dataKey="pending"
                    name={tr('নতুন অপেক্ষমাণ আবেদন', 'Pending Inquiries', 'طلبات قيد الانتظار')}
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPending)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke={axisTickColor}
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: gridStroke }}
                  />
                  <YAxis stroke={axisTickColor} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                  <Bar
                    dataKey="enrolled"
                    name={tr('ভর্তিকৃত শিক্ষার্থী', 'Enrolled / Admitted', 'الطلاب المقبولون')}
                    fill="#9333ea"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="inPipeline"
                    name={tr('যাচাই ও সাক্ষাৎকার পর্যায়', 'Active Pipeline', 'قيد المراجعة والمقابلة')}
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="pending"
                    name={tr('নতুন অপেক্ষমাণ আবেদন', 'Pending Inquiries', 'طلبات قيد الانتظار')}
                    fill="#f59e0b"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Principal / Vice Principal Special Admission Discount Token Generator & Tracker */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TicketPercent className="w-5 h-5 text-purple-700 dark:text-purple-400" />
                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  {tr(
                    'প্রিন্সিপাল / ভাইস-প্রিন্সিপাল স্পেশাল ভর্তি ডিসকাউন্ট টোকেন সিস্টেম',
                    'Principal / Vice-Principal Special Admission Discount Token System',
                    'نظام قسائم الخصم الخاصة بالقبول (المدير / نائب المدير)'
                  )}
                </h4>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300">
                {tr('কোটা ব্যবহৃত:', 'Quota Used:', 'الحصة المستخدمة:')} {tokens.length} / {TOTAL_TOKEN_QUOTA}
              </span>
            </div>

            <form
              onSubmit={handleIssueToken}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 bg-purple-50/60 dark:bg-slate-800/60 p-3.5 rounded-xl border border-purple-100 dark:border-slate-700 text-xs"
            >
              <input
                type="text"
                value={newTokenStudent}
                onChange={(e) => setNewTokenStudent(e.target.value)}
                placeholder={tr('শিক্ষার্থীর নাম...', 'Student Name...', 'اسم الطالب...')}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-semibold"
              />
              <input
                type="text"
                value={newTokenClass}
                onChange={(e) => setNewTokenClass(e.target.value)}
                placeholder={tr('শ্রেণি / বিভাগ...', 'Target Class / Dept...', 'الصف / القسم...')}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
              />
              <select
                value={newTokenDiscount}
                onChange={(e) => setNewTokenDiscount(Number(e.target.value))}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-bold text-purple-800 dark:text-purple-300"
              >
                <option value={10}>10% Special Discount</option>
                <option value={15}>15% Special Discount</option>
                <option value={20}>20% Special Discount</option>
                <option value={25}>25% Special Discount</option>
                <option value={30}>30% Special Scholarship</option>
              </select>
              <input
                type="text"
                value={newTokenNote}
                onChange={(e) => setNewTokenNote(e.target.value)}
                placeholder={tr('প্রিন্সিপালের নোট / শর্ত...', 'Principal Note / Requirement...', 'ملاحظة المدير...')}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
              />
              <button
                type="submit"
                className="rounded-lg bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:from-purple-800 hover:to-fuchsia-700 text-white font-extrabold px-3 py-2 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{tr('টোকেন জেনারেট করুন', 'Issue Token ID', 'إصدار رمز القسيمة')}</span>
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tokens.map((tok) => (
                <div
                  key={tok.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-purple-900 text-amber-300 font-mono font-extrabold text-[11px]">
                        {tok.code}
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-white truncate">
                        {loc(tok.studentName)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-fuchsia-100 dark:bg-fuchsia-950 text-fuchsia-800 dark:text-fuchsia-300 font-bold text-[10px]">
                        -{tok.discountPercent}% OFF
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {loc(tok.targetClass)} — {loc(tok.note)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleTokenStatus(tok.id)}
                    className={`px-3 py-1.5 rounded-lg font-extrabold text-[11px] shrink-0 cursor-pointer transition-colors ${
                      tok.status === 'Applied'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                        : 'bg-amber-400 hover:bg-amber-500 text-purple-950'
                    }`}
                  >
                    {tok.status === 'Applied'
                      ? tr('✓ ভর্তিতে ব্যবহৃত', '✓ Applied by Admin', '✓ تم التطبيق')
                      : tr('অ্যাপ্লাই করুন', 'Apply Token', 'تطبيق القسيمة')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* REGULAR ACADEMIC YEAR VIEW (When Admission Season is OFF) */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: 50/50 Curriculum Balance */}
            <div className="p-5 rounded-2xl bg-purple-50/50 dark:bg-slate-800/60 border border-purple-100 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  {tr('৫০/৫০ সমন্বিত কারিকুলাম', '50/50 Integrated Curriculum', 'المنهج المتكامل ٥٠/٥٠')}
                </span>
                <BookOpen className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                {loc(state.educationMethodConfig.islamicTitleBn)} +{' '}
                {loc(state.educationMethodConfig.generalTitleBn)}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {loc(state.educationMethodConfig.descriptionBn)}
              </p>
              <div className="space-y-1.5 pt-1">
                {state.educationMethodConfig.stages.slice(0, 3).map((st) => (
                  <div key={st.id} className="text-[11px] flex items-center justify-between font-semibold">
                    <span>{loc(st.stageNameBn)}</span>
                    <span className="font-mono text-purple-700 dark:text-purple-300">
                      {st.quranPercent}% / {st.arabicPercent}% / {st.generalPercent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Hifz Day-Care Daily Schedule & Active Leave Status */}
            <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-slate-800/60 border border-amber-200/70 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  {tr('দৈনিক ডে-কেয়ার রুটিন ও শিক্ষক উপস্থিতি', 'Daily Routine & Faculty Status', 'الروتين اليومي وحضور المعلمين')}
                </span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                {loc(state.dayCareRoutineConfig.headingBn)}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {loc(state.dayCareRoutineConfig.seasonalNoteBn)}
              </p>
              <div className="pt-2 border-t border-amber-200/60 dark:border-slate-700 flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <FileCheck2 className="w-4 h-4" />
                  {tr('অনুমোদিত শিক্ষক ছুটি:', 'Approved Teacher Leaves:', 'إجازات المعلمين المعتمدة:')}
                </span>
                <span className="font-mono">
                  {(state.leaveRequests || []).filter((l) => l.status === 'Approved').length}
                </span>
              </div>
            </div>

            {/* Card 3: Campus Transport Routes & Upcoming Events */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-slate-800/60 border border-emerald-200/70 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  {tr('নিজস্ব পরিবহন রুট ও ক্যাম্পাস ইভেন্ট', 'Transport Fleet & Campus Events', 'حافلات المعهد والفعاليات')}
                </span>
                <Bus className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                {state.transportConfig.routes.length}{' '}
                {tr('টি সক্রিয় পরিবহন রুট চালু', 'Active Transport Routes', 'مسارات نقل نشطة')}
              </div>
              <div className="space-y-1.5 text-xs">
                {state.transportConfig.routes.slice(0, 3).map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="truncate">{loc(r.routeNameBn)}</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      ৳{r.monthlyFee}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-emerald-200/60 dark:border-slate-700 flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
                  <Calendar className="w-4 h-4" />
                  {tr('আসন্ন একাডেমিক ইভেন্ট:', 'Upcoming Campus Events:', 'الفعاليات القادمة:')}
                </span>
                <span className="font-mono">{state.events.length}</span>
              </div>
            </div>
          </div>

          {/* Latest Institutional Notices Strip */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                {tr('সাম্প্রতিক একাডেমিক নোটিশ ও ঘোষণা', 'Recent Academic Notices & Announcements', 'أحدث الإعلانات الأكاديمية')}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {state.notices.length} {tr('টি নোটিশ প্রকাশিত', 'Published Notices', 'إعلانات منشورة')}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {state.notices.slice(0, 3).map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs space-y-1"
                >
                  <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                    {loc(n.title)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">{n.publishDate}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
