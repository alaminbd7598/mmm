import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Download,
  ExternalLink,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import type { InstitutionalCalendarCategory, InstitutionalCalendarEvent } from '../types/cms';
import { buildIcsCalendarFile } from '../utils/admissionToken2027Logic';
import {
  deleteEventFromGoogleCalendar,
  fetchGoogleCalendarEvents,
  getConnectedGoogleUser,
  getGoogleCalendarToken,
  pushEventToGoogleCalendar,
  signInWithGoogleWorkspace,
} from '../lib/googleWorkspaceAuth';

interface PendingConfirmAction {
  type: 'push' | 'delete';
  event: InstitutionalCalendarEvent;
}

const CATEGORY_STYLES: Record<
  InstitutionalCalendarCategory,
  { badge: string; dot: string; labelBn: string; labelEn: string }
> = {
  'govt-holiday': {
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
    dot: 'bg-rose-500',
    labelBn: 'সরকারি ছুটি',
    labelEn: 'Govt Holiday',
  },
  'islamic-holiday': {
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    dot: 'bg-emerald-500',
    labelBn: 'ইসলামী ছুটি',
    labelEn: 'Islamic Holiday',
  },
  academic: {
    badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
    dot: 'bg-indigo-500',
    labelBn: 'একাডেমিক ও পরীক্ষা',
    labelEn: 'Academic',
  },
  institutional: {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    dot: 'bg-amber-500',
    labelBn: 'প্রাতিষ্ঠানিক অনুষ্ঠান',
    labelEn: 'Institutional',
  },
  'google-sync': {
    badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
    dot: 'bg-sky-500',
    labelBn: 'গুগল ক্যালেন্ডার',
    labelEn: 'Google Synced',
  },
};

export const AdminCalendarTab: React.FC = () => {
  const {
    state,
    language,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    mergeGoogleCalendarEvents,
    pushToast,
  } = useCMS();

  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  const events = state.calendarEvents || [];
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [googleEmail, setGoogleEmail] = useState<string>(
    () => getConnectedGoogleUser()?.email || ''
  );
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);

  // Add event form
  const [titleBn, setTitleBn] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('09:00');
  const [category, setCategory] = useState<InstitutionalCalendarCategory>('institutional');
  const [descriptionBn, setDescriptionBn] = useState('');

  // Explicit Confirmation Modal before modifying user's Google Calendar (Mandatory Workspace Policy)
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmAction | null>(null);
  const [isExecutingGoogleWrite, setIsExecutingGoogleWrite] = useState(false);

  const combinedEvents = useMemo(() => {
    const leaveEvents: InstitutionalCalendarEvent[] = (state.leaveRequests || [])
      .filter((l) => l.status === 'Approved')
      .map((l) => ({
        id: `leave-${l.id}`,
        titleBn: `শিক্ষক ছুটি: ${l.teacherName} (${l.leaveType})`,
        titleEn: `Teacher Leave: ${l.teacherName}`,
        date: l.startDate,
        category: 'academic' as const,
        descriptionBn: `${l.startDate} থেকে ${l.endDate} — ${l.detailsNote || l.reasonDetails || l.reasonCategory}`,
        source: 'local' as const,
      }));
    return [...events, ...leaveEvents].sort((a, b) => a.date.localeCompare(b.date));
  }, [events, state.leaveRequests]);

  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'all') return combinedEvents;
    return combinedEvents.filter((e) => e.category === selectedCategory);
  }, [combinedEvents, selectedCategory]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthCells = useMemo(() => {
    const cells: Array<{ day: number | null; dateStr?: string }> = [];
    for (let i = 0; i < firstDayOfMonth; i++) cells.push({ day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      cells.push({ day: d, dateStr: `${year}-${mStr}-${dStr}` });
    }
    return cells;
  }, [year, month, firstDayOfMonth, daysInMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, InstitutionalCalendarEvent[]>();
    for (const ev of filteredEvents) {
      const list = map.get(ev.date) || [];
      list.push(ev);
      map.set(ev.date, list);
    }
    return map;
  }, [filteredEvents]);

  const handleConnectGoogle = async () => {
    setIsSyncingGoogle(true);
    try {
      const session = await signInWithGoogleWorkspace();
      setGoogleEmail(session.user.email);
      const fetched = await fetchGoogleCalendarEvents(session.accessToken);
      const added = mergeGoogleCalendarEvents(fetched);
      pushToast(
        tr('গুগল ক্যালেন্ডার যুক্ত হয়েছে!', 'Google Calendar Connected!', 'تم ربط تقويم Google!'),
        tr(
          `${session.user.email} থেকে ${added}টি নতুন ইভেন্ট/ছুটি সিঙ্ক হয়েছে।`,
          `Synced ${added} new events & Bangladesh holidays from ${session.user.email}.`,
          `تمت مزامنة ${added} حدثاً جديداً.`
        )
      );
    } catch (err) {
      pushToast(
        tr('গুগল ক্যালেন্ডার সংযোগ ব্যর্থ', 'Google Calendar Connection Failed', 'فشل الاتصال بتقويم Google'),
        err instanceof Error ? err.message : 'Unable to connect Google Calendar.',
        'info'
      );
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  const handleRefreshGoogleEvents = async () => {
    const token = getGoogleCalendarToken();
    if (!token) {
      await handleConnectGoogle();
      return;
    }
    setIsSyncingGoogle(true);
    try {
      const fetched = await fetchGoogleCalendarEvents(token);
      const added = mergeGoogleCalendarEvents(fetched);
      pushToast(
        tr('গুগল ক্যালেন্ডার রিফ্রেশ সম্পন্ন', 'Google Calendar Refreshed', 'تم تحديث تقويم Google'),
        tr(`${added}টি নতুন ইভেন্ট যুক্ত হয়েছে।`, `${added} new events imported.`, `تم استيراد ${added} حدثاً.`)
      );
    } catch (err) {
      pushToast(
        tr('রিফ্রেশ ব্যর্থ', 'Refresh Failed', 'فشل التحديث'),
        err instanceof Error ? err.message : 'Please reconnect Google Calendar.',
        'info'
      );
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleBn.trim() || !date) return;
    addCalendarEvent({
      titleBn: titleBn.trim(),
      titleEn: titleEn.trim() || titleBn.trim(),
      date,
      time: time || undefined,
      category,
      descriptionBn: descriptionBn.trim() || undefined,
      source: 'local',
    });
    setTitleBn('');
    setTitleEn('');
    setDescriptionBn('');
  };

  const handleConfirmGoogleAction = async () => {
    if (!pendingConfirm) return;
    let token = getGoogleCalendarToken();
    if (!token) {
      try {
        const session = await signInWithGoogleWorkspace();
        setGoogleEmail(session.user.email);
        token = session.accessToken;
      } catch (err) {
        pushToast(
          tr('গুগল অনুমোদন প্রয়োজন', 'Google Sign-In Required', 'مطلوب تسجيل الدخول'),
          err instanceof Error ? err.message : 'Sign in failed.',
          'info'
        );
        setPendingConfirm(null);
        return;
      }
    }

    setIsExecutingGoogleWrite(true);
    try {
      if (pendingConfirm.type === 'push') {
        const res = await pushEventToGoogleCalendar(token, pendingConfirm.event);
        updateCalendarEvent({
          ...pendingConfirm.event,
          googleEventId: res.id,
          htmlLink: res.htmlLink,
          source: 'google',
        });
        pushToast(
          tr('গুগল ক্যালেন্ডারে যুক্ত হয়েছে', 'Synced to Google Calendar', 'تمت المزامنة مع Google'),
          pendingConfirm.event.titleBn
        );
      } else if (pendingConfirm.type === 'delete' && pendingConfirm.event.googleEventId) {
        await deleteEventFromGoogleCalendar(token, pendingConfirm.event.googleEventId);
        updateCalendarEvent({
          ...pendingConfirm.event,
          googleEventId: undefined,
          htmlLink: undefined,
          source: 'local',
        });
        pushToast(
          tr('গুগল ক্যালেন্ডার থেকে সরানো হয়েছে', 'Removed from Google Calendar', 'تمت الإزالة من Google'),
          pendingConfirm.event.titleBn,
          'info'
        );
      }
    } catch (err) {
      pushToast(
        tr('গুগল ক্যালেন্ডার আপডেট ব্যর্থ', 'Google Calendar Error', 'خطأ في تقويم Google'),
        err instanceof Error ? err.message : 'Request failed.',
        'info'
      );
    } finally {
      setIsExecutingGoogleWrite(false);
      setPendingConfirm(null);
    }
  };

  const handleDownloadIcs = () => {
    const icsText = buildIcsCalendarFile(combinedEvents);
    const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Maharat-Model-Madrasah-Calendar-2027.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const monthLabel = viewDate.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header & Google Calendar Sync Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0a1738] via-[#192f64] to-[#005a6e] p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#f0c95e]">
              <CalendarIcon className="h-3.5 w-3.5" />
              {tr(
                'প্রাতিষ্ঠানিক ক্যালেন্ডার ও গুগল ক্যালেন্ডার সিঙ্ক',
                'Institutional Academic Calendar & Live Google Sync',
                'التقويم الأكاديمي والمزامنة مع تقويم Google'
              )}
            </div>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl">
              {tr(
                'সরকারি ছুটি, ইসলামী ছুটি ও মাদ্রাসা বাৎসরিক ক্যালেন্ডার',
                'Bangladesh Govt Holidays, Islamic Holidays & Madrasah Schedule',
                'العطلات الرسمية والإسلامية والجدول الأكاديمي'
              )}
            </h2>
            <p className="mt-1 text-xs text-slate-200 sm:text-sm">
              {tr(
                'গুগল ক্যালেন্ডারের সাথে সরাসরি যুক্ত করুন, সরকারি ও ইসলামী ছুটি সিঙ্ক করুন এবং .ICS ফাইল ডাউনলোড করুন।',
                'Connect Google Calendar to auto-fetch Bangladesh Govt & Islamic holidays, push institutional events with confirmation, or export .ICS.',
                'اربط تقويم Google لجلب العطلات الرسمية والإسلامية ومزامنة الفعاليات.'
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={googleEmail ? handleRefreshGoogleEvents : handleConnectGoogle}
              disabled={isSyncingGoogle}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#192f64] shadow transition hover:bg-slate-100 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 text-[#005a6e] ${isSyncingGoogle ? 'animate-spin' : ''}`} />
              {googleEmail
                ? tr('গুগল ক্যালেন্ডার রিফ্রেশ করুন', 'Sync Google Calendar Now', 'تحديث تقويم Google')
                : tr('গুগল ক্যালেন্ডার যুক্ত করুন', 'Connect Google Calendar', 'ربط تقويم Google')}
            </button>
            <button
              type="button"
              onClick={handleDownloadIcs}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4 text-[#f0c95e]" />
              .ICS Export
            </button>
          </div>
        </div>
        {googleEmail && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {tr(`সংযুক্ত গুগল অ্যাকাউন্ট: ${googleEmail}`, `Connected Google Account: ${googleEmail}`, `الحساب المتصل: ${googleEmail}`)}
          </div>
        )}
      </div>

      {/* Category Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
            selectedCategory === 'all'
              ? 'bg-[#192f64] text-white'
              : 'bg-white text-slate-600 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
          }`}
        >
          {tr(`সকল (${combinedEvents.length})`, `All (${combinedEvents.length})`, `الكل (${combinedEvents.length})`)}
        </button>
        {(Object.keys(CATEGORY_STYLES) as InstitutionalCalendarCategory[]).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              selectedCategory === cat
                ? 'bg-[#005a6e] text-white'
                : 'bg-white text-slate-600 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${CATEGORY_STYLES[cat].dot}`} />
            {language === 'bn' ? CATEGORY_STYLES[cat].labelBn : CATEGORY_STYLES[cat].labelEn}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Monthly Visual Grid */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#192f64] dark:text-white">{monthLabel}</h3>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month - 1, 1))}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewDate(new Date())}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
              >
                {tr('আজ', 'Today', 'اليوم')}
              </button>
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month + 1, 1))}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className={`py-1.5 ${d === 'Fri' ? 'text-rose-500' : ''}`}>
                {d}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {monthCells.map((cell, idx) => {
              const dayEvents = cell.dateStr ? eventsByDate.get(cell.dateStr) || [] : [];
              const isToday = cell.dateStr === new Date().toISOString().slice(0, 10);
              return (
                <div
                  key={idx}
                  className={`min-h-[76px] rounded-xl border p-1.5 transition ${
                    cell.day === null
                      ? 'border-transparent bg-transparent'
                      : isToday
                      ? 'border-[#005a6e] bg-[#005a6e]/5 dark:bg-teal-900/20'
                      : 'border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30'
                  }`}
                >
                  {cell.day !== null && (
                    <>
                      <div
                        className={`text-right text-xs font-bold ${
                          isToday ? 'text-[#005a6e] dark:text-teal-300' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {cell.day}
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            title={ev.titleBn}
                            className={`truncate rounded px-1 py-0.5 text-[10px] font-semibold ${
                              CATEGORY_STYLES[ev.category].badge
                            }`}
                          >
                            {language === 'bn' ? ev.titleBn : ev.titleEn || ev.titleBn}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[10px] font-bold text-slate-500">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Add Event Form + Upcoming List */}
        <div className="space-y-5 xl:col-span-5">
          <form
            onSubmit={handleAddEvent}
            className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <h3 className="flex items-center gap-2 text-sm font-bold text-[#192f64] dark:text-white">
              <Plus className="h-4 w-4 text-[#005a6e]" />
              {tr('নতুন প্রাতিষ্ঠানিক ইভেন্ট / ছুটি যুক্ত করুন', 'Add Institutional Event / Holiday', 'إضافة حدث جديد')}
            </h3>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <input
                type="text"
                required
                value={titleBn}
                onChange={(e) => setTitleBn(e.target.value)}
                placeholder={tr('ইভেন্টের শিরোনাম (বাংলা) *', 'Event Title (Bengali) *', 'عنوان الحدث *')}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:col-span-2"
              />
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="English Title (Optional)"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:col-span-2"
              />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InstitutionalCalendarCategory)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="institutional">{tr('প্রাতিষ্ঠানিক অনুষ্ঠান', 'Institutional', 'مؤسسي')}</option>
                <option value="academic">{tr('একাডেমিক ও পরীক্ষা', 'Academic / Exam', 'أكاديمي')}</option>
                <option value="islamic-holiday">{tr('ইসলামী ছুটি', 'Islamic Holiday', 'عطلة إسلامية')}</option>
                <option value="govt-holiday">{tr('সরকারি ছুটি', 'Govt Holiday', 'عطلة رسمية')}</option>
              </select>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <input
                type="text"
                value={descriptionBn}
                onChange={(e) => setDescriptionBn(e.target.value)}
                placeholder={tr('সংক্ষিপ্ত বিবরণ', 'Short Description', 'وصف قصير')}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-[#192f64] py-2.5 text-xs font-bold text-white shadow hover:bg-[#0a1738]"
            >
              {tr('ক্যালেন্ডারে সংরক্ষণ করুন', 'Save to Institutional Calendar', 'حفظ في التقويم')}
            </button>
          </form>

          {/* Upcoming Events & Google Sync Controls */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-3 text-sm font-bold text-[#192f64] dark:text-white">
              {tr('আসন্ন ছুটি ও প্রাতিষ্ঠানিক সময়সূচি', 'Upcoming Holidays & Institutional Events', 'الفعاليات والعطلات القادمة')}
            </h3>
            <div className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
              {filteredEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-[#005a6e] dark:text-teal-300">
                          {ev.date} {ev.time ? `· ${ev.time}` : ''}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            CATEGORY_STYLES[ev.category].badge
                          }`}
                        >
                          {language === 'bn'
                            ? CATEGORY_STYLES[ev.category].labelBn
                            : CATEGORY_STYLES[ev.category].labelEn}
                        </span>
                      </div>
                      <div className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                        {language === 'bn' ? ev.titleBn : ev.titleEn || ev.titleBn}
                      </div>
                      {ev.descriptionBn && (
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          {ev.descriptionBn}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {!ev.id.startsWith('leave-') && !ev.googleEventId && (
                        <button
                          type="button"
                          onClick={() => setPendingConfirm({ type: 'push', event: ev })}
                          title={tr('গুগল ক্যালেন্ডারে পুশ করুন', 'Push to Google Calendar', 'مزامنة مع Google')}
                          className="rounded-lg bg-sky-100 p-1.5 text-sky-700 hover:bg-sky-200 dark:bg-sky-900/40 dark:text-sky-300"
                        >
                          <CloudUpload className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {ev.googleEventId && (
                        <>
                          {ev.htmlLink && (
                            <a
                              href={ev.htmlLink}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700 hover:bg-emerald-200"
                              title="Open in Google Calendar"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setPendingConfirm({ type: 'delete', event: ev })}
                            title="Remove from Google Calendar"
                            className="rounded-lg bg-amber-100 p-1.5 text-amber-700 hover:bg-amber-200"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      {!ev.id.startsWith('leave-') && (
                        <button
                          type="button"
                          onClick={() => deleteCalendarEvent(ev.id)}
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                          title="Delete local event"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Explicit Confirmation Modal for Google Calendar Write/Delete */}
      {pendingConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#192f64] dark:text-white">
                  {pendingConfirm.type === 'push'
                    ? tr(
                        'গুগল ক্যালেন্ডারে ইভেন্ট যোগ করার নিশ্চিতকরণ',
                        'Confirm Push to Google Calendar',
                        'تأكيد الإضافة إلى تقويم Google'
                      )
                    : tr(
                        'গুগল ক্যালেন্ডার থেকে ইভেন্ট মোছার নিশ্চিতকরণ',
                        'Confirm Remove from Google Calendar',
                        'تأكيد الحذف من تقويم Google'
                      )}
                </h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {pendingConfirm.type === 'push'
                    ? tr(
                        'আপনি কি নিশ্চিত যে এই প্রাতিষ্ঠানিক ইভেন্টটি আপনার প্রাইমারি গুগল ক্যালেন্ডারে যুক্ত করবেন?',
                        'Are you sure you want to create this institutional event in your primary Google Calendar?',
                        'هل أنت متأكد من إنشاء هذا الحدث في تقويم Google الخاص بك؟'
                      )
                    : tr(
                        'আপনি কি নিশ্চিত যে এই ইভেন্টটি আপনার গুগল ক্যালেন্ডার থেকে মুছে ফেলবেন?',
                        'Are you sure you want to permanently remove this synced event from your Google Calendar?',
                        'هل أنت متأكد من حذف هذا الحدث من تقويم Google؟'
                      )}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800">
              <div className="font-bold text-slate-900 dark:text-white">
                {pendingConfirm.event.titleBn}
              </div>
              <div className="mt-0.5 text-slate-500">
                {pendingConfirm.event.date} {pendingConfirm.event.time || ''}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingConfirm(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                {tr('বাতিল করুন', 'Cancel', 'إلغاء')}
              </button>
              <button
                type="button"
                disabled={isExecutingGoogleWrite}
                onClick={handleConfirmGoogleAction}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow disabled:opacity-60 ${
                  pendingConfirm.type === 'push'
                    ? 'bg-[#005a6e] hover:bg-[#004555]'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isExecutingGoogleWrite
                  ? tr('সম্পন্ন হচ্ছে...', 'Working...', 'جارٍ التنفيذ...')
                  : pendingConfirm.type === 'push'
                  ? tr('হ্যাঁ, গুগলে যুক্ত করুন', 'Yes, Add to Google Calendar', 'نعم، أضف إلى Google')
                  : tr('হ্যাঁ, গুগল থেকে মুছুন', 'Yes, Delete from Google', 'نعم، احذف من Google')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
