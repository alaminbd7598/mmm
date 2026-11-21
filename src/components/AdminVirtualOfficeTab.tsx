import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  Eye,
  EyeOff,
  Headset,
  Plus,
  Radio,
  RefreshCw,
  Save,
  Search,
  Trash2,
  UserRound,
  Users,
  Video,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import type {
  VirtualOfficeConfig,
  VirtualOfficeDesk,
  VirtualOfficePlatform,
  VirtualOfficeSession,
  VirtualOfficeSessionStatus,
  VirtualOfficeStatusMode,
} from '../types/cms';
import {
  DEFAULT_VIRTUAL_OFFICE_CONFIG,
  computeVirtualOfficeAnalytics,
  evaluateVirtualOfficeLiveStatus,
} from '../utils/virtualOfficeLogic';

type Tr = (bn: string, en: string, ar: string) => string;

const PLATFORMS: VirtualOfficePlatform[] = ['Google Meet', 'Zoom', 'WhatsApp Video', 'Jitsi'];
const STATUS_MODES: VirtualOfficeStatusMode[] = ['AUTO', 'ONLINE_LIVE', 'BUSY_IN_SESSION', 'OFFLINE'];
const SESSION_STATUSES: VirtualOfficeSessionStatus[] = [
  'Joined',
  'Counseled',
  'Enrolled',
  'Missed — Call Back',
];
const WEEK_DAYS: Array<{ idx: number; bn: string; en: string; ar: string }> = [
  { idx: 6, bn: 'শনি', en: 'Sat', ar: 'السبت' },
  { idx: 0, bn: 'রবি', en: 'Sun', ar: 'الأحد' },
  { idx: 1, bn: 'সোম', en: 'Mon', ar: 'الإثنين' },
  { idx: 2, bn: 'মঙ্গল', en: 'Tue', ar: 'الثلاثاء' },
  { idx: 3, bn: 'বুধ', en: 'Wed', ar: 'الأربعاء' },
  { idx: 4, bn: 'বৃহঃ', en: 'Thu', ar: 'الخميس' },
  { idx: 5, bn: 'শুক্র', en: 'Fri', ar: 'الجمعة' },
];

const STATUS_STYLES: Record<VirtualOfficeStatusMode, { dot: string; badge: string }> = {
  AUTO: { dot: 'bg-sky-400', badge: 'bg-sky-500/20 text-sky-100' },
  ONLINE_LIVE: { dot: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-100' },
  BUSY_IN_SESSION: { dot: 'bg-amber-400', badge: 'bg-amber-500/20 text-amber-100' },
  OFFLINE: { dot: 'bg-slate-400', badge: 'bg-white/10 text-slate-200' },
};

const SESSION_BADGES: Record<VirtualOfficeSessionStatus, string> = {
  Joined: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  Counseled: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  Enrolled: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  'Missed — Call Back': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
};

const CARD =
  'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900';
const INPUT =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#005a6e] focus:ring-2 focus:ring-[#005a6e]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const LABEL = 'mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300';
const CARD_TITLE = 'flex items-center gap-2 text-sm font-bold text-[#192f64] dark:text-white';

const statusLabel = (mode: VirtualOfficeStatusMode, tr: Tr) =>
  mode === 'AUTO'
    ? tr('অটো (অফিস সময় অনুযায়ী)', 'Auto (office hours)', 'تلقائي (حسب الدوام)')
    : mode === 'ONLINE_LIVE'
      ? tr('লাইভ — অনলাইন', 'Live — Online', 'مباشر — متصل')
      : mode === 'BUSY_IN_SESSION'
        ? tr('ব্যস্ত — সেশনে আছেন', 'Busy — In Session', 'مشغول — في جلسة')
        : tr('অফলাইন', 'Offline', 'غير متصل');

const sessionStatusLabel = (s: VirtualOfficeSessionStatus, tr: Tr) =>
  s === 'Joined'
    ? tr('যুক্ত হয়েছেন', 'Joined', 'انضم')
    : s === 'Counseled'
      ? tr('কাউন্সেলিং সম্পন্ন', 'Counseled', 'تمت الاستشارة')
      : s === 'Enrolled'
        ? tr('ভর্তি সম্পন্ন', 'Enrolled', 'تم التسجيل')
        : tr('মিসড — কল ব্যাক', 'Missed — Call Back', 'فائت — معاودة الاتصال');

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

/** Coerces possibly stale / partial persisted data into a complete, crash-safe config. */
function normalizeConfig(cfg: VirtualOfficeConfig | null | undefined): VirtualOfficeConfig {
  const def = DEFAULT_VIRTUAL_OFFICE_CONFIG;
  const raw: Partial<VirtualOfficeConfig> = cfg && typeof cfg === 'object' ? cfg : def;
  const desks = Array.isArray(raw.desks) ? raw.desks : def.desks;
  return {
    enabled: raw.enabled !== false,
    manualStatus: STATUS_MODES.includes(raw.manualStatus as VirtualOfficeStatusMode)
      ? (raw.manualStatus as VirtualOfficeStatusMode)
      : 'AUTO',
    timezone: str(raw.timezone) || def.timezone,
    officeDays: Array.isArray(raw.officeDays)
      ? raw.officeDays.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
      : def.officeDays,
    openTime: str(raw.openTime) || def.openTime,
    closeTime: str(raw.closeTime) || def.closeTime,
    primaryPlatform: PLATFORMS.includes(raw.primaryPlatform as VirtualOfficePlatform)
      ? (raw.primaryPlatform as VirtualOfficePlatform)
      : def.primaryPlatform,
    dutyOfficerNameBn: str(raw.dutyOfficerNameBn),
    dutyOfficerNameEn: str(raw.dutyOfficerNameEn),
    dutyOfficerTitleBn: str(raw.dutyOfficerTitleBn),
    dutyOfficerTitleEn: str(raw.dutyOfficerTitleEn),
    dutyOfficerPhone: str(raw.dutyOfficerPhone),
    dutyOfficerPhotoUrl: str(raw.dutyOfficerPhotoUrl),
    roomUrl: str(raw.roomUrl),
    zoomMeetingId: str(raw.zoomMeetingId),
    zoomPasscode: str(raw.zoomPasscode),
    desks: desks
      .filter((d) => d && typeof d === 'object' && typeof d.id === 'string' && d.id)
      .map((d) => ({
        ...d,
        nameBn: str(d.nameBn),
        nameEn: str(d.nameEn),
        nameAr: str(d.nameAr),
        officerNameBn: str(d.officerNameBn),
        officerNameEn: str(d.officerNameEn),
        platform: PLATFORMS.includes(d.platform) ? d.platform : def.primaryPlatform,
        roomUrl: str(d.roomUrl),
        zoomMeetingId: str(d.zoomMeetingId),
        zoomPasscode: str(d.zoomPasscode),
        active: d.active !== false,
      })),
  };
}

/** Fills Meet/Zoom credentials that the public CMS payload blanks out, so a save never wipes them. */
function fillBlankCredentials(
  cfg: VirtualOfficeConfig,
  secure: VirtualOfficeConfig | null
): VirtualOfficeConfig {
  if (!secure) return cfg;
  return {
    ...cfg,
    roomUrl: cfg.roomUrl || secure.roomUrl,
    zoomMeetingId: cfg.zoomMeetingId || secure.zoomMeetingId,
    zoomPasscode: cfg.zoomPasscode || secure.zoomPasscode,
    desks: cfg.desks.map((d) => {
      const match = secure.desks.find((sd) => sd.id === d.id);
      return match
        ? {
            ...d,
            roomUrl: d.roomUrl || match.roomUrl,
            zoomMeetingId: d.zoomMeetingId || match.zoomMeetingId,
            zoomPasscode: d.zoomPasscode || match.zoomPasscode,
          }
        : d;
    }),
  };
}

const isValidRoomUrl = (url: string) => {
  try {
    return new URL(url.trim()).protocol === 'https:';
  } catch {
    return false;
  }
};

/** An unknown IANA zone would make the live-status evaluator fall back to "always online". */
const isValidTimezone = (tz: string) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz }).format();
    return true;
  } catch {
    return false;
  }
};

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  dir?: 'ltr' | 'rtl' | 'auto';
  placeholder?: string;
  className?: string;
  testId?: string;
}> = ({ label, value, onChange, type = 'text', dir = 'auto', placeholder, className, testId }) => {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        dir={dir}
        value={value}
        placeholder={placeholder}
        autoComplete={type === 'password' ? 'new-password' : 'off'}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT}
        data-testid={testId}
      />
    </div>
  );
};

const PlatformSelect: React.FC<{
  label: string;
  value: VirtualOfficePlatform;
  onChange: (v: VirtualOfficePlatform) => void;
  testId?: string;
}> = ({ label, value, onChange, testId }) => {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as VirtualOfficePlatform)}
        className={INPUT}
        data-testid={testId}
      >
        {PLATFORMS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </div>
  );
};

export const AdminVirtualOfficeTab: React.FC = () => {
  const {
    state,
    language,
    updateVirtualOfficeConfig,
    updateVirtualOfficeSessionStatus,
    deleteVirtualOfficeSession,
    pushToast,
  } = useCMS();

  const tr: Tr = (bn, en, ar) => (language === 'bn' ? bn : language === 'ar' ? ar : en);
  const locale = language === 'bn' ? 'bn-BD' : language === 'ar' ? 'ar' : 'en-GB';

  const storeCfg = useMemo(() => normalizeConfig(state.virtualOfficeConfig), [state.virtualOfficeConfig]);
  const sessions = useMemo<VirtualOfficeSession[]>(
    () => state.virtualOfficeSessions || [],
    [state.virtualOfficeSessions]
  );

  const secureRef = useRef<VirtualOfficeConfig | null>(null);
  const mountedRef = useRef(true);
  const [draft, setDraft] = useState<VirtualOfficeConfig>(storeCfg);
  const [dirty, setDirty] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | VirtualOfficeSessionStatus>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeskId, setConfirmDeskId] = useState<string | null>(null);

  // Re-evaluate the office-hours based live status every 30 seconds.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // Keep the form in sync with the store while there are no unsaved edits.
  useEffect(() => {
    if (!dirty) setDraft(fillBlankCredentials(storeCfg, secureRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeCfg]);

  const loadSecureConfig = async (announce: boolean) => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/admin/virtual-office', { headers: { 'X-MMM-Admin': '1' } });
      const data = (await res.json()) as { ok?: boolean; config?: VirtualOfficeConfig };
      if (!res.ok || !data.ok || !data.config) throw new Error('unavailable');
      if (!mountedRef.current) return;
      const secure = normalizeConfig(data.config);
      secureRef.current = secure;
      setDraft((prev) => fillBlankCredentials(prev, secure));
      if (announce) {
        pushToast(
          tr('সার্ভার থেকে রুম লিংক লোড হয়েছে', 'Room links loaded from server', 'تم تحميل روابط الغرف من الخادم'),
          tr('খালি Meet/Zoom ঘরগুলো পূরণ করা হয়েছে।', 'Blank Meet/Zoom fields were filled in.', 'تمت تعبئة حقول Meet/Zoom الفارغة.'),
          'info'
        );
      }
    } catch {
      if (announce) {
        pushToast(
          tr('সার্ভারে সংযোগ করা যায়নি', 'Could not reach the server', 'تعذر الاتصال بالخادم'),
          tr('স্থানীয় সেটিংস দেখানো হচ্ছে।', 'Showing locally stored settings.', 'يتم عرض الإعدادات المحلية.'),
          'info'
        );
      }
    } finally {
      if (mountedRef.current) setIsSyncing(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    void loadSecureConfig(false);
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = (p: Partial<VirtualOfficeConfig>) => {
    setDraft((prev) => ({ ...prev, ...p }));
    setDirty(true);
  };
  const patchDesk = (id: string, p: Partial<VirtualOfficeDesk>) => {
    setDraft((prev) => ({ ...prev, desks: prev.desks.map((d) => (d.id === id ? { ...d, ...p } : d)) }));
    setDirty(true);
  };

  const validate = (cfg: VirtualOfficeConfig): string | null => {
    if (!/^\d{2}:\d{2}$/.test(cfg.openTime) || !/^\d{2}:\d{2}$/.test(cfg.closeTime) || cfg.openTime >= cfg.closeTime) {
      return tr('খোলার সময় অবশ্যই বন্ধের সময়ের আগে হতে হবে।', 'Opening time must be earlier than closing time.', 'يجب أن يكون وقت الفتح قبل وقت الإغلاق.');
    }
    if (!isValidTimezone(cfg.timezone.trim())) {
      return tr('টাইমজোনটি বৈধ নয় (যেমন Asia/Dhaka)।', 'The timezone is not valid (e.g. Asia/Dhaka).', 'المنطقة الزمنية غير صالحة (مثال: Asia/Dhaka).');
    }
    if (cfg.desks.length === 0) {
      return tr('অন্তত একটি ডেস্ক রাখুন; লুকাতে চাইলে "সক্রিয়" টিক তুলে দিন।', 'Keep at least one desk; untick "Active" to hide a desk instead.', 'أبقِ مكتبًا واحدًا على الأقل؛ ألغِ تحديد "نشط" لإخفاء المكتب.');
    }
    if (cfg.officeDays.length === 0) {
      return tr('অন্তত একটি অফিস দিবস নির্বাচন করুন।', 'Select at least one office day.', 'اختر يوم دوام واحدًا على الأقل.');
    }
    if (cfg.roomUrl.trim() && !isValidRoomUrl(cfg.roomUrl)) {
      return tr('প্রধান রুম লিংকটি বৈধ https লিংক নয়।', 'The primary room link is not a valid https URL.', 'رابط الغرفة الرئيسية ليس رابط https صالحًا.');
    }
    for (const d of cfg.desks) {
      if (!d.nameBn.trim() || !d.nameEn.trim()) {
        return tr('প্রতিটি ডেস্কের বাংলা ও ইংরেজি নাম দিন।', 'Every desk needs a Bangla and an English name.', 'كل مكتب يحتاج اسمًا بالبنغالية والإنجليزية.');
      }
      if (d.roomUrl.trim() && !isValidRoomUrl(d.roomUrl)) {
        return tr(`"${d.nameBn}" ডেস্কের রুম লিংক বৈধ নয়।`, `The room link of "${d.nameEn}" is not a valid https URL.`, `رابط غرفة "${d.nameAr || d.nameEn}" غير صالح.`);
      }
    }
    return null;
  };

  const commit = (next: VirtualOfficeConfig) => {
    const error = validate(next);
    if (error) {
      pushToast(tr('সংরক্ষণ করা যায়নি', 'Could not save', 'تعذر الحفظ'), error, 'info');
      return;
    }
    const cleaned: VirtualOfficeConfig = {
      ...next,
      timezone: next.timezone.trim(),
      roomUrl: next.roomUrl.trim(),
      officeDays: [...next.officeDays].sort((a, b) => a - b),
      desks: next.desks.map((d) => ({ ...d, roomUrl: d.roomUrl.trim() })),
    };
    // What the admin just saved is now authoritative: a deliberately cleared desk link or
    // Zoom passcode must not be re-filled from the older server copy.
    secureRef.current = cleaned;
    setDraft(cleaned);
    setDirty(false);
    updateVirtualOfficeConfig(cleaned);
  };

  /** Switchboard actions save instantly on top of the stored config, leaving unsaved form edits untouched. */
  const quickSave = (p: Pick<VirtualOfficeConfig, 'enabled'> | Pick<VirtualOfficeConfig, 'manualStatus'>) => {
    updateVirtualOfficeConfig({ ...fillBlankCredentials(storeCfg, secureRef.current), ...p });
    setDraft((prev) => ({ ...prev, ...p }));
  };

  const addDesk = () => {
    const desk: VirtualOfficeDesk = {
      id: `desk-${Date.now().toString(36)}`,
      nameBn: '',
      nameEn: '',
      nameAr: '',
      officerNameBn: '',
      officerNameEn: '',
      platform: draft.primaryPlatform,
      roomUrl: '',
      active: true,
    };
    patch({ desks: [...draft.desks, desk] });
  };

  const liveStatus = evaluateVirtualOfficeLiveStatus(storeCfg, now);
  const analytics = useMemo(() => computeVirtualOfficeAnalytics(sessions), [sessions]);
  const missingRoomLink =
    !isSyncing && !draft.roomUrl.trim() && draft.desks.some((d) => d.active !== false && !d.roomUrl.trim());

  const filteredSessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...sessions]
      .filter((s) => statusFilter === 'all' || s.sessionStatus === statusFilter)
      .filter(
        (s) =>
          !q ||
          [s.fullName, s.phone, s.email, s.topic, s.deskNameBn, s.deskName]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
      )
      .sort((a, b) => (b.checkedInAt || '').localeCompare(a.checkedInAt || ''));
  }, [sessions, query, statusFilter]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? iso
      : d.toLocaleString(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const kpis = [
    { key: 'visits', label: tr('মোট চেক-ইন', 'Total check-ins', 'إجمالي تسجيلات الدخول'), value: analytics.totalVisits, icon: Users },
    { key: 'counseled', label: tr('কাউন্সেলিং সম্পন্ন', 'Counseled', 'تمت استشارتهم'), value: analytics.counseledCount, icon: Headset },
    { key: 'enrolled', label: tr('ভর্তি সম্পন্ন', 'Enrolled', 'المسجلون'), value: analytics.enrolledCount, icon: UserRound },
    { key: 'conversion', label: tr('রূপান্তর হার', 'Conversion rate', 'معدل التحويل'), value: `${analytics.conversionRate}%`, icon: BarChart3 },
  ];
  const secretType = showSecrets ? 'text' : 'password';

  return (
    <div className="space-y-6" data-testid="admin-virtual-office-tab">
      {/* Banner + live status */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0a1738] via-[#192f64] to-[#005a6e] p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#f0c95e]">
              <Radio className="h-3.5 w-3.5" />
              {tr('হাইব্রিড লাইভ ডেস্ক', 'Hybrid Live Desk', 'المكتب المباشر الهجين')}
            </div>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl">
              {tr('ভার্চুয়াল অফিস সুইচবোর্ড', 'Virtual Office Switchboard', 'لوحة تحكم المكتب الافتراضي')}
            </h2>
            <p className="mt-1 text-xs text-slate-200 sm:text-sm">
              {tr(
                'লাইভ স্ট্যাটাস, অফিস সময়, Meet/Zoom রুম ও অভিভাবক চেক-ইন কিউ এক জায়গা থেকে পরিচালনা করুন।',
                'Manage the live status, office hours, Meet/Zoom rooms and the guardian check-in queue in one place.',
                'أدر الحالة المباشرة وساعات الدوام وغرف Meet/Zoom وقائمة تسجيل دخول أولياء الأمور من مكان واحد.'
              )}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span
              role="status"
              aria-live="polite"
              data-testid="virtual-office-live-status"
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold ${STATUS_STYLES[liveStatus].badge}`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${STATUS_STYLES[liveStatus].dot} ${liveStatus === 'ONLINE_LIVE' ? 'animate-pulse' : ''}`} />
              {tr('বর্তমান অবস্থা:', 'Now:', 'الحالة الآن:')} {statusLabel(liveStatus, tr)}
            </span>
            <span className="text-[11px] text-slate-200" dir="ltr">
              {storeCfg.openTime}–{storeCfg.closeTime} · {storeCfg.timezone} · {storeCfg.primaryPlatform}
            </span>
          </div>
        </div>
      </div>

      {missingRoomLink && (
        <div role="alert" className="flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {tr(
              'কিছু সক্রিয় ডেস্কের রুম লিংক খালি। চেক-ইনের পর অভিভাবক কোনো লিংক পাবেন না — লিংক দিন অথবা সার্ভার থেকে লোড করুন।',
              'Some active desks have no room link. Guardians would receive no link after check-in — add one or load the links from the server.',
              'بعض المكاتب النشطة بلا رابط غرفة. لن يحصل أولياء الأمور على رابط بعد تسجيل الدخول — أضف رابطًا أو حمّل الروابط من الخادم.'
            )}
          </span>
        </div>
      )}

      {/* Switchboard */}
      <section className={CARD} aria-labelledby="vo-switchboard-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="vo-switchboard-title" className={CARD_TITLE}>
            <Radio className="h-4 w-4 text-[#005a6e]" />
            {tr('লাইভ স্ট্যাটাস সুইচবোর্ড', 'Live status switchboard', 'لوحة الحالة المباشرة')}
          </h3>
          <button
            type="button"
            role="switch"
            aria-checked={storeCfg.enabled}
            onClick={() => quickSave({ enabled: !storeCfg.enabled })}
            data-testid="virtual-office-enabled-toggle"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <span className={`flex h-6 w-11 items-center rounded-full p-0.5 transition ${storeCfg.enabled ? 'justify-end bg-[#005a6e]' : 'justify-start bg-slate-300 dark:bg-slate-700'}`}>
              <span className="h-5 w-5 rounded-full bg-white shadow" />
            </span>
            {storeCfg.enabled
              ? tr('ওয়েবসাইটে চালু', 'Enabled on website', 'مفعّل على الموقع')
              : tr('ওয়েবসাইটে বন্ধ', 'Hidden from website', 'معطّل على الموقع')}
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4" role="group" aria-labelledby="vo-switchboard-title">
          {STATUS_MODES.map((mode) => {
            const active = storeCfg.manualStatus === mode;
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={active}
                onClick={() => quickSave({ manualStatus: mode })}
                data-testid={`virtual-office-mode-${mode}`}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-3 text-start text-xs font-bold transition ${
                  active
                    ? 'border-[#005a6e] bg-[#005a6e] text-white shadow'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_STYLES[mode].dot}`} />
                {statusLabel(mode, tr)}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
          {tr(
            'এই সুইচ ও স্ট্যাটাস বোতাম সঙ্গে সঙ্গে সংরক্ষিত হয়। "অটো" মোডে নিচের অফিস দিবস ও সময় অনুযায়ী ডেস্ক নিজে থেকেই খোলে ও বন্ধ হয়।',
            'This switch and the status buttons save immediately. In "Auto" mode the desk opens and closes by the office days and hours below.',
            'هذا المفتاح وأزرار الحالة تُحفظ فورًا. في الوضع "التلقائي" يفتح المكتب ويغلق حسب أيام وساعات الدوام أدناه.'
          )}
        </p>
      </section>

      {/* KPIs + peak hours */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="grid grid-cols-2 gap-3 xl:col-span-5">
          {kpis.map(({ key, label, value, icon: Icon }) => (
            <div key={key} className={CARD} data-testid={`virtual-office-kpi-${key}`}>
              <Icon className="h-5 w-5 text-[#c4962c]" />
              <div className="mt-2 text-2xl font-extrabold text-[#192f64] dark:text-white">{value}</div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</div>
            </div>
          ))}
        </div>
        <section className={`${CARD} xl:col-span-7`} aria-labelledby="vo-peak-title">
          <h3 id="vo-peak-title" className={CARD_TITLE}>
            <BarChart3 className="h-4 w-4 text-[#005a6e]" />
            {tr('চেক-ইনের ব্যস্ত সময়', 'Peak check-in hours', 'ساعات الذروة لتسجيل الدخول')}
          </h3>
          {analytics.totalVisits === 0 ? (
            <p className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
              {tr('এখনো কোনো চেক-ইন নেই।', 'No check-ins yet.', 'لا توجد تسجيلات دخول بعد.')}
            </p>
          ) : (
            <div className="mt-3 h-52 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.peakHoursData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.3} vertical={false} />
                  <XAxis dataKey="slot" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(148,163,184,0.15)' }}
                    contentStyle={{ borderRadius: 12, fontSize: 12, color: '#0f172a' }}
                  />
                  <Bar dataKey="visits" name={tr('চেক-ইন', 'Check-ins', 'تسجيلات الدخول')} fill="#005a6e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className={`${CARD} space-y-3`} aria-labelledby="vo-hours-title">
          <h3 id="vo-hours-title" className={CARD_TITLE}>
            <CalendarClock className="h-4 w-4 text-[#005a6e]" />
            {tr('অফিস দিবস ও সময়', 'Office days & hours', 'أيام وساعات الدوام')}
          </h3>
          <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="vo-hours-title">
            {WEEK_DAYS.map((d) => {
              const on = draft.officeDays.includes(d.idx);
              return (
                <button
                  key={d.idx}
                  type="button"
                  aria-pressed={on}
                  onClick={() => patch({ officeDays: on ? draft.officeDays.filter((x) => x !== d.idx) : [...draft.officeDays, d.idx] })}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    on ? 'bg-[#192f64] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {tr(d.bn, d.en, d.ar)}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <Field label={tr('খোলার সময়', 'Opens at', 'وقت الفتح')} type="time" dir="ltr" value={draft.openTime} onChange={(v) => patch({ openTime: v })} testId="virtual-office-open-time" />
            <Field label={tr('বন্ধের সময়', 'Closes at', 'وقت الإغلاق')} type="time" dir="ltr" value={draft.closeTime} onChange={(v) => patch({ closeTime: v })} testId="virtual-office-close-time" />
            <Field label={tr('টাইমজোন', 'Timezone', 'المنطقة الزمنية')} dir="ltr" value={draft.timezone} placeholder="Asia/Dhaka" onChange={(v) => patch({ timezone: v })} />
          </div>
        </section>

        <section className={`${CARD} space-y-3`} aria-labelledby="vo-room-title">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="vo-room-title" className={CARD_TITLE}>
              <Video className="h-4 w-4 text-[#005a6e]" />
              {tr('প্রধান মিটিং রুম', 'Primary meeting room', 'غرفة الاجتماع الرئيسية')}
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowSecrets((v) => !v)}
                aria-pressed={showSecrets}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {showSecrets ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showSecrets ? tr('পাসকোড লুকান', 'Hide passcodes', 'إخفاء الرموز') : tr('পাসকোড দেখান', 'Show passcodes', 'إظهار الرموز')}
              </button>
              <button
                type="button"
                onClick={() => void loadSecureConfig(true)}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {tr('সার্ভার থেকে লোড', 'Load from server', 'تحميل من الخادم')}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <PlatformSelect label={tr('প্রধান প্ল্যাটফর্ম', 'Primary platform', 'المنصة الرئيسية')} value={draft.primaryPlatform} onChange={(v) => patch({ primaryPlatform: v })} testId="virtual-office-platform" />
            <Field label={tr('রুম লিংক (https)', 'Room link (https)', 'رابط الغرفة (https)')} type="url" dir="ltr" value={draft.roomUrl} placeholder="https://meet.google.com/…" onChange={(v) => patch({ roomUrl: v })} testId="virtual-office-room-url" />
            <Field label={tr('Zoom মিটিং আইডি', 'Zoom meeting ID', 'معرّف اجتماع Zoom')} dir="ltr" value={draft.zoomMeetingId || ''} onChange={(v) => patch({ zoomMeetingId: v })} />
            <Field label={tr('Zoom পাসকোড', 'Zoom passcode', 'رمز مرور Zoom')} type={secretType} dir="ltr" value={draft.zoomPasscode || ''} onChange={(v) => patch({ zoomPasscode: v })} />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {tr(
              'রুম লিংক ও পাসকোড ওয়েবসাইটে প্রকাশ হয় না; নাম, মোবাইল ও ইমেইল দিয়ে চেক-ইনের পরই দর্শনার্থী এগুলো পান।',
              'Room links and passcodes are never published; a visitor receives them only after checking in with name, mobile and email.',
              'لا تُنشر روابط الغرف ورموز المرور؛ يحصل عليها الزائر فقط بعد تسجيل الدخول بالاسم والجوال والبريد.'
            )}
          </p>
        </section>

        <section className={`${CARD} space-y-3 lg:col-span-2`} aria-labelledby="vo-officer-title">
          <h3 id="vo-officer-title" className={CARD_TITLE}>
            <Headset className="h-4 w-4 text-[#005a6e]" />
            {tr('দায়িত্বরত কর্মকর্তা', 'Duty officer', 'الموظف المناوب')}
          </h3>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={tr('নাম (বাংলা)', 'Name (Bangla)', 'الاسم (بنغالي)')} value={draft.dutyOfficerNameBn} onChange={(v) => patch({ dutyOfficerNameBn: v })} />
            <Field label={tr('নাম (ইংরেজি)', 'Name (English)', 'الاسم (إنجليزي)')} dir="ltr" value={draft.dutyOfficerNameEn} onChange={(v) => patch({ dutyOfficerNameEn: v })} />
            <Field label={tr('মোবাইল', 'Phone', 'الهاتف')} type="tel" dir="ltr" value={draft.dutyOfficerPhone} onChange={(v) => patch({ dutyOfficerPhone: v })} />
            <Field label={tr('পদবি (বাংলা)', 'Title (Bangla)', 'المسمى (بنغالي)')} value={draft.dutyOfficerTitleBn} onChange={(v) => patch({ dutyOfficerTitleBn: v })} />
            <Field label={tr('পদবি (ইংরেজি)', 'Title (English)', 'المسمى (إنجليزي)')} dir="ltr" value={draft.dutyOfficerTitleEn} onChange={(v) => patch({ dutyOfficerTitleEn: v })} />
            <Field label={tr('ছবির লিংক', 'Photo URL', 'رابط الصورة')} dir="ltr" value={draft.dutyOfficerPhotoUrl} onChange={(v) => patch({ dutyOfficerPhotoUrl: v })} />
          </div>
        </section>
      </div>

      {/* Desks */}
      <section className={`${CARD} space-y-4`} aria-labelledby="vo-desks-title">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="vo-desks-title" className={CARD_TITLE}>
            <Users className="h-4 w-4 text-[#005a6e]" />
            {tr('ডেস্ক তালিকা', 'Desks', 'المكاتب')} ({draft.desks.length})
          </h3>
          <button
            type="button"
            onClick={addDesk}
            data-testid="virtual-office-add-desk"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#192f64] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0a1738]"
          >
            <Plus className="h-4 w-4" />
            {tr('নতুন ডেস্ক', 'Add desk', 'إضافة مكتب')}
          </button>
        </div>
        {draft.desks.length === 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tr('কোনো ডেস্ক নেই। সংরক্ষণের আগে অন্তত একটি ডেস্ক যোগ করুন।', 'No desks. Add at least one desk before saving.', 'لا توجد مكاتب. أضف مكتبًا واحدًا على الأقل قبل الحفظ.')}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {draft.desks.map((desk, i) => {
            const active = desk.active !== false;
            return (
              <fieldset
                key={desk.id}
                data-testid={`virtual-office-desk-${desk.id}`}
                className={`space-y-2.5 rounded-2xl border p-4 ${active ? 'border-slate-200 dark:border-slate-700' : 'border-dashed border-slate-300 opacity-75 dark:border-slate-700'}`}
              >
                <legend className="px-1 text-xs font-bold text-[#192f64] dark:text-slate-100">
                  {tr('ডেস্ক', 'Desk', 'مكتب')} {i + 1}
                </legend>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => patchDesk(desk.id, { active: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 accent-[#005a6e]"
                    />
                    {tr('সক্রিয় (ওয়েবসাইটে দেখাবে)', 'Active (shown on website)', 'نشط (يظهر على الموقع)')}
                  </label>
                  {confirmDeskId === desk.id ? (
                    <span className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          patch({ desks: draft.desks.filter((d) => d.id !== desk.id) });
                          setConfirmDeskId(null);
                        }}
                        className="rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700"
                      >
                        {tr('নিশ্চিত', 'Confirm', 'تأكيد')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeskId(null)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                      >
                        {tr('বাতিল', 'Cancel', 'إلغاء')}
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeskId(desk.id)}
                      aria-label={tr('ডেস্ক মুছুন', 'Remove desk', 'حذف المكتب')}
                      className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-900/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <Field label={tr('ডেস্কের নাম (বাংলা)', 'Desk name (Bangla)', 'اسم المكتب (بنغالي)')} value={desk.nameBn} onChange={(v) => patchDesk(desk.id, { nameBn: v })} />
                  <Field label={tr('ডেস্কের নাম (ইংরেজি)', 'Desk name (English)', 'اسم المكتب (إنجليزي)')} dir="ltr" value={desk.nameEn} onChange={(v) => patchDesk(desk.id, { nameEn: v })} />
                  <Field label={tr('ডেস্কের নাম (আরবি)', 'Desk name (Arabic)', 'اسم المكتب (عربي)')} dir="rtl" value={desk.nameAr || ''} onChange={(v) => patchDesk(desk.id, { nameAr: v })} />
                  <PlatformSelect label={tr('প্ল্যাটফর্ম', 'Platform', 'المنصة')} value={desk.platform} onChange={(v) => patchDesk(desk.id, { platform: v })} />
                  <Field label={tr('কর্মকর্তা (বাংলা)', 'Officer (Bangla)', 'الموظف (بنغالي)')} value={desk.officerNameBn} onChange={(v) => patchDesk(desk.id, { officerNameBn: v })} />
                  <Field label={tr('কর্মকর্তা (ইংরেজি)', 'Officer (English)', 'الموظف (إنجليزي)')} dir="ltr" value={desk.officerNameEn} onChange={(v) => patchDesk(desk.id, { officerNameEn: v })} />
                  <Field className="sm:col-span-2" label={tr('রুম লিংক (https)', 'Room link (https)', 'رابط الغرفة (https)')} type="url" dir="ltr" value={desk.roomUrl} placeholder={draft.roomUrl || 'https://'} onChange={(v) => patchDesk(desk.id, { roomUrl: v })} />
                  {desk.platform === 'Zoom' && (
                    <>
                      <Field label={tr('Zoom মিটিং আইডি', 'Zoom meeting ID', 'معرّف اجتماع Zoom')} dir="ltr" value={desk.zoomMeetingId || ''} onChange={(v) => patchDesk(desk.id, { zoomMeetingId: v })} />
                      <Field label={tr('Zoom পাসকোড', 'Zoom passcode', 'رمز مرور Zoom')} type={secretType} dir="ltr" value={desk.zoomPasscode || ''} onChange={(v) => patchDesk(desk.id, { zoomPasscode: v })} />
                    </>
                  )}
                </div>
              </fieldset>
            );
          })}
        </div>
      </section>

      {/* Save bar */}
      <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <span className={`text-xs font-bold ${dirty ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'}`} aria-live="polite">
          {dirty
            ? tr('অসংরক্ষিত পরিবর্তন আছে', 'You have unsaved changes', 'لديك تغييرات غير محفوظة')
            : tr('সব পরিবর্তন সংরক্ষিত', 'All changes saved', 'تم حفظ كل التغييرات')}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!dirty}
            onClick={() => {
              setDraft(fillBlankCredentials(storeCfg, secureRef.current));
              setDirty(false);
              setConfirmDeskId(null);
            }}
            className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {tr('পরিবর্তন বাতিল', 'Discard', 'تجاهل')}
          </button>
          <button
            type="button"
            disabled={!dirty}
            onClick={() => commit(draft)}
            data-testid="virtual-office-save"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#005a6e] px-4 py-2 text-xs font-bold text-white shadow hover:bg-[#004656] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {tr('সেটিংস সংরক্ষণ', 'Save settings', 'حفظ الإعدادات')}
          </button>
        </div>
      </div>

      {/* Check-in queue */}
      <section className={`${CARD} space-y-4`} aria-labelledby="vo-queue-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="vo-queue-title" className={CARD_TITLE}>
            <Users className="h-4 w-4 text-[#005a6e]" />
            {tr('দর্শনার্থী চেক-ইন কিউ', 'Visitor check-in queue', 'قائمة تسجيل دخول الزوار')} ({filteredSessions.length}/{sessions.length})
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={tr('কিউতে খুঁজুন', 'Search the queue', 'ابحث في القائمة')}
                placeholder={tr('নাম, মোবাইল, ইমেইল…', 'Name, phone, email…', 'الاسم، الجوال، البريد…')}
                className={`${INPUT} ps-8 sm:w-56`}
                data-testid="virtual-office-queue-search"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | VirtualOfficeSessionStatus)}
              aria-label={tr('স্ট্যাটাস ফিল্টার', 'Filter by status', 'تصفية حسب الحالة')}
              className={`${INPUT} sm:w-44`}
            >
              <option value="all">{tr('সব স্ট্যাটাস', 'All statuses', 'كل الحالات')}</option>
              {SESSION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {sessionStatusLabel(s, tr)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            {sessions.length === 0
              ? tr('এখনো কেউ ভার্চুয়াল অফিসে চেক-ইন করেননি।', 'Nobody has checked in to the virtual office yet.', 'لم يسجّل أحد الدخول إلى المكتب الافتراضي بعد.')
              : tr('এই ফিল্টারে কোনো চেক-ইন মেলেনি।', 'No check-ins match this filter.', 'لا توجد نتائج مطابقة لهذه التصفية.')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-start text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th scope="col" className="px-2 py-2 text-start">{tr('দর্শনার্থী', 'Visitor', 'الزائر')}</th>
                  <th scope="col" className="px-2 py-2 text-start">{tr('যোগাযোগ', 'Contact', 'التواصل')}</th>
                  <th scope="col" className="px-2 py-2 text-start">{tr('ডেস্ক ও বিষয়', 'Desk & topic', 'المكتب والموضوع')}</th>
                  <th scope="col" className="px-2 py-2 text-start">{tr('চেক-ইন', 'Checked in', 'وقت الدخول')}</th>
                  <th scope="col" className="px-2 py-2 text-start">{tr('স্ট্যাটাস', 'Status', 'الحالة')}</th>
                  <th scope="col" className="px-2 py-2 text-end">{tr('অ্যাকশন', 'Actions', 'إجراءات')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((s) => (
                  <tr key={s.id} data-testid={`virtual-office-session-${s.id}`} className="border-b border-slate-100 align-top last:border-0 dark:border-slate-800">
                    <td className="px-2 py-2.5 font-bold text-slate-900 dark:text-white">
                      {s.fullName}
                      {s.department && <div className="font-normal text-slate-500 dark:text-slate-400">{s.department}</div>}
                    </td>
                    <td className="px-2 py-2.5 text-slate-700 dark:text-slate-300">
                      <a href={`tel:${s.phone}`} dir="ltr" className="block font-semibold text-[#005a6e] hover:underline dark:text-teal-300">{s.phone}</a>
                      <a href={`mailto:${s.email}`} dir="ltr" className="block break-all hover:underline">{s.email}</a>
                    </td>
                    <td className="px-2 py-2.5 text-slate-700 dark:text-slate-300">
                      <div className="font-semibold">{language === 'bn' ? s.deskNameBn : s.deskName || s.deskNameBn}</div>
                      {s.topic && <div className="text-slate-500 dark:text-slate-400">{s.topic}</div>}
                      {s.preferredCallbackTime && (
                        <div className="text-amber-700 dark:text-amber-300">
                          {tr('কল ব্যাক:', 'Call back:', 'معاودة الاتصال:')} {s.preferredCallbackTime}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-slate-700 dark:text-slate-300">
                      <div>{formatTime(s.checkedInAt)}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {statusLabel(s.deskMode, tr)}
                        {s.platform ? ` · ${s.platform}` : ''}
                      </div>
                    </td>
                    <td className="px-2 py-2.5">
                      <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${SESSION_BADGES[s.sessionStatus] || SESSION_BADGES.Joined}`}>
                        {sessionStatusLabel(s.sessionStatus, tr)}
                      </span>
                      <select
                        value={s.sessionStatus}
                        onChange={(e) => updateVirtualOfficeSessionStatus(s.id, e.target.value as VirtualOfficeSessionStatus)}
                        aria-label={`${tr('স্ট্যাটাস পরিবর্তন', 'Change status', 'تغيير الحالة')}: ${s.fullName}`}
                        className={`${INPUT} min-w-[9.5rem] py-1.5`}
                      >
                        {SESSION_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {sessionStatusLabel(st, tr)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2.5 text-end">
                      {confirmDeleteId === s.id ? (
                        <span className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              deleteVirtualOfficeSession(s.id);
                              setConfirmDeleteId(null);
                            }}
                            className="rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700"
                          >
                            {tr('মুছুন', 'Delete', 'حذف')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                          >
                            {tr('বাতিল', 'Cancel', 'إلغاء')}
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(s.id)}
                          aria-label={`${tr('সেশন মুছুন', 'Delete session', 'حذف الجلسة')}: ${s.fullName}`}
                          className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-900/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
