import React, { useEffect, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Headphones,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Video,
  X,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import { apiPostKeepalive } from '../lib/api/client';
import type { PublicVirtualOfficeStatus } from '../types/cms';
import { sanitizeVirtualOfficeForPublic } from '../utils/virtualOfficeLogic';

interface CheckinSuccessPayload {
  deskMode: 'ONLINE_LIVE' | 'BUSY_IN_SESSION' | 'OFFLINE';
  deskNameBn: string;
  deskNameEn: string;
  officerNameBn: string;
  dutyOfficerPhone: string;
  platform: string;
  roomUrl: string | null;
  zoomMeetingId?: string | null;
  zoomPasscode?: string | null;
  preferredCallbackTime?: string | null;
}

export const VirtualOfficeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  publicStatus: PublicVirtualOfficeStatus;
  initialDeskId?: string;
}> = ({ isOpen, onClose, publicStatus, initialDeskId }) => {
  const { language, pushToast, recordLocalVirtualOfficeSession, publicSubmitError } = useCMS();
  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deskId, setDeskId] = useState(
    initialDeskId || publicStatus.desks[0]?.id || 'desk-admission'
  );
  const [topic, setTopic] = useState('');
  const [preferredCallbackTime, setPreferredCallbackTime] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unlocked, setUnlocked] = useState<CheckinSuccessPayload | null>(null);

  useEffect(() => {
    if (initialDeskId) setDeskId(initialDeskId);
  }, [initialDeskId]);

  if (!isOpen) return null;

  const isLive = publicStatus.status === 'ONLINE_LIVE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanDigits = phone.replace(/[^0-9]/g, '');
    if (fullName.trim().length < 2) {
      setErrorMsg(
        tr('অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।', 'Please enter your full name (min 2 chars).', 'يرجى إدخال الاسم الكامل.')
      );
      return;
    }
    if (cleanDigits.length < 10 || cleanDigits.length > 15) {
      setErrorMsg(
        tr('সঠিক মোবাইল বা হোয়াটসঅ্যাপ নম্বর দিন (১০–১৫ সংখ্যা)।', 'Enter a valid mobile/WhatsApp number (10–15 digits).', 'أدخل رقم هاتف صحيح.')
      );
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setErrorMsg(
        tr('সঠিক ইমেইল ঠিকানা লিখুন।', 'Please enter a valid email address.', 'أدخل بريداً إلكترونياً صحيحاً.')
      );
      return;
    }

    setIsSubmitting(true);
    const res = await apiPostKeepalive<{
      join?: Partial<CheckinSuccessPayload>;
      session?: Parameters<typeof recordLocalVirtualOfficeSession>[0];
    }>('/api/public/virtual-office/checkin', {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      deskId,
      topic: topic.trim() || undefined,
      preferredCallbackTime: preferredCallbackTime.trim() || undefined,
    });
    setIsSubmitting(false);
    // Nothing is confirmed unless the server stored the check-in; the form keeps what was typed.
    if (!res.ok) {
      setErrorMsg(publicSubmitError(res));
      return;
    }

    // Offline / busy desks answer without join details: the form stays open and a toast confirms.
    const { join, session } = res.data;
    if (join) {
      setUnlocked({
        deskMode: join.deskMode || 'ONLINE_LIVE',
        deskNameBn: join.deskNameBn || '',
        deskNameEn: join.deskNameEn || '',
        officerNameBn: join.officerNameBn || '',
        dutyOfficerPhone: join.dutyOfficerPhone || publicStatus.dutyOfficerPhone || '',
        platform: join.platform || '',
        roomUrl: join.roomUrl || null,
        zoomMeetingId: join.zoomMeetingId,
        zoomPasscode: join.zoomPasscode,
      });
    }
    if (session) recordLocalVirtualOfficeSession(session);
    pushToast(
      isLive
        ? tr('ভার্চুয়াল অফিস রুম আনলক হয়েছে!', 'Virtual Office Room Unlocked!', 'تم فتح المكتب الافتراضي!')
        : tr('ভিডিও কলব্যাক বুকিং নিশ্চিত হয়েছে!', 'Video Callback Request Confirmed!', 'تم تأكيد طلب الاتصال!'),
      `${fullName.trim()} (${phone.trim()})`
    );
  };

  const handleCopyRoomLink = () => {
    if (!unlocked?.roomUrl) return;
    navigator.clipboard?.writeText(unlocked.roomUrl).catch(() => {});
    pushToast(
      tr('মিটিং লিংক কপি হয়েছে', 'Meeting Link Copied', 'تم نسخ رابط الاجتماع'),
      unlocked.platform,
      'info'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Top Branded Header */}
        <div className="relative bg-gradient-to-r from-[#0a1738] via-[#192f64] to-[#005a6e] p-5 text-white">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Virtual Office"
            className="absolute right-4 top-4 rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold">
            <span
              className={`h-2 w-2 rounded-full ${
                isLive
                  ? 'animate-pulse bg-emerald-400'
                  : publicStatus.status === 'BUSY_IN_SESSION'
                  ? 'bg-amber-400'
                  : 'bg-slate-300'
              }`}
            />
            {isLive
              ? tr('ভার্চুয়াল অফিস এখন সরাসরি চালু (LIVE)', 'Virtual Office LIVE Now', 'المكتب الافتراضي مباشر الآن')
              : publicStatus.status === 'BUSY_IN_SESSION'
              ? tr('কাউন্সেলর বর্তমানে সেশনে আছেন', 'Duty Officer In Session', 'المستشار في جلسة حالياً')
              : tr('অফিস সময়ের বাইরে — কলব্যাক বুক করুন', 'After Hours — Book Video Callback', 'خارج ساعات العمل')}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <img
              src={publicStatus.dutyOfficerPhotoUrl || '/assets/maharat/principal-munkadir-sadi.jpg'}
              alt={publicStatus.dutyOfficerNameEn}
              className="h-12 w-12 rounded-full border-2 border-[#f0c95e] object-cover"
            />
            <div>
              <h3 className="text-base font-bold leading-snug">
                {language === 'bn'
                  ? publicStatus.dutyOfficerNameBn
                  : publicStatus.dutyOfficerNameEn}
              </h3>
              <p className="text-xs text-slate-200">
                {language === 'bn'
                  ? publicStatus.dutyOfficerTitleBn
                  : publicStatus.dutyOfficerTitleEn}{' '}
                · {publicStatus.openTime}–{publicStatus.closeTime} ({publicStatus.timezone})
              </p>
            </div>
          </div>
        </div>

        {/* Body: Either Mandatory Lead Gate OR Unlocked Join Room */}
        <div className="p-5">
          {!unlocked ? (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="flex items-start gap-2 rounded-xl border border-[#005a6e]/20 bg-[#005a6e]/5 p-3 text-xs text-slate-700 dark:bg-teal-950/30 dark:text-slate-200">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#005a6e]" />
                <span>
                  {isLive
                    ? tr(
                        'নিরাপদ ভিডিও রুমে প্রবেশের জন্য আপনার নাম, মোবাইল নম্বর এবং ইমেইল প্রদান করুন। সাবমিট করার সাথে সাথেই লাইভ মিটিং লিংক উন্মুক্ত হবে।',
                        'Complete quick visitor verification (Name, Phone & Email) to unlock our live video office room immediately.',
                        'أكمل التحقق السريع (الاسم والهاتف والبريد) لفتح غرفة الفيديو المباشرة فوراً.'
                      )
                    : tr(
                        'বর্তমানে আমাদের লাইভ ডেস্ক ব্যস্ত/বন্ধ রয়েছে। আপনার তথ্য দিন—পরবর্তী সেশনে আমাদের কাউন্সিলর সরাসরি ভিডিও লিংক পাঠিয়ে যোগাযোগ করবেন।',
                        'Our live desk is currently busy or offline. Submit your details and our counselor will schedule a priority video callback.',
                        'المكتب غير متصل حالياً. أدخل بياناتك وسيتواصل معك المستشار قريباً.'
                      )}
                </span>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-200">
                  {tr('কোন ডেস্কে কথা বলতে চান?', 'Select Virtual Desk', 'اختر المكتب')}
                </label>
                <select
                  value={deskId}
                  onChange={(e) => setDeskId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {publicStatus.desks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {language === 'bn' ? d.nameBn : language === 'ar' ? d.nameAr || d.nameEn : d.nameEn} ({d.platform})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-200">
                  {tr('আপনার পূর্ণ নাম *', 'Full Name *', 'الاسم الكامل *')}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={tr('যেমন: মুহাম্মদ তানভীর আহমেদ', 'e.g., Muhammad Tanvir Ahmed', 'الاسم الكامل')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-200">
                    {tr('মোবাইল / হোয়াটসঅ্যাপ নম্বর *', 'Phone / WhatsApp *', 'رقم الهاتف *')}
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XX-XXXXXX"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-200">
                    {tr('ইমেইল ঠিকানা *', 'Email Address *', 'البريد الإلكتروني *')}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="guardian@email.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-200">
                  {tr('আলোচনার বিষয় (ঐচ্ছিক)', 'Topic / Target Class (Optional)', 'موضوع الاستشارة (اختياري)')}
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={tr('যেমন: ২০২৭ হিফজ আবাসিক ভর্তি ও ফি', 'e.g., 2027 Hifz Hostel Admission & Fees', 'القبول في التحفيظ 2027')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {!isLive && (
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <CalendarClock className="h-3.5 w-3.5 text-[#c4962c]" />
                    {tr('কলব্যাকের পছন্দের সময়', 'Preferred Video Callback Time', 'الوقت المفضل للاتصال')}
                  </label>
                  <input
                    type="text"
                    value={preferredCallbackTime}
                    onChange={(e) => setPreferredCallbackTime(e.target.value)}
                    placeholder={tr('যেমন: আগামীকাল সকাল ১০:৩০ টা', 'e.g., Tomorrow 10:30 AM BST', 'غداً الساعة 10:30 صباحاً')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              )}

              {errorMsg && (
                <div role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#192f64] py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#0a1738] disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#f0c95e]" />
                ) : (
                  <Video className="h-4 w-4 text-[#f0c95e]" />
                )}
                {isLive
                  ? tr('ভেরিফাই করুন ও লাইভ মিটিং লিংক আনলক করুন', 'Verify & Unlock Live Video Office', 'تحقق وافتح المكتب المباشر')
                  : tr('ভিডিও কলব্যাক বুকিং সাবমিট করুন', 'Book Priority Video Callback', 'حجز مكالمة فيديو')}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" />
                  {unlocked.roomUrl
                    ? tr('আপনার ভার্চুয়াল অফিস রুম প্রস্তুত!', 'Your Virtual Office Room Is Ready!', 'غرفة المكتب الافتراضي جاهزة!')
                    : tr('কলব্যাক রিকোয়েস্ট সফলভাবে নিবন্ধিত হয়েছে!', 'Callback Request Confirmed!', 'تم تسجيل طلب الاتصال!')}
                </div>
                <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-200">
                  {language === 'bn' ? unlocked.deskNameBn : unlocked.deskNameEn} ·{' '}
                  {unlocked.officerNameBn}
                </p>
              </div>

              {unlocked.roomUrl && (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span>Platform: {unlocked.platform}</span>
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified Session
                    </span>
                  </div>

                  {unlocked.platform === 'Zoom' && unlocked.zoomMeetingId && (
                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-white p-2.5 text-xs dark:bg-slate-900">
                      <div>
                        <div className="text-[10px] text-slate-500">Meeting ID</div>
                        <div className="font-mono font-bold">{unlocked.zoomMeetingId}</div>
                      </div>
                      {unlocked.zoomPasscode && (
                        <div>
                          <div className="text-[10px] text-slate-500">Passcode</div>
                          <div className="font-mono font-bold">{unlocked.zoomPasscode}</div>
                        </div>
                      )}
                    </div>
                  )}

                  <a
                    href={unlocked.roomUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-700"
                  >
                    <Video className="h-4 w-4" />
                    {tr(`এখনই ${unlocked.platform}-এ যোগ দিন`, `Join Live ${unlocked.platform} Room Now`, `انضم الآن عبر ${unlocked.platform}`)}
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyRoomLink}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {tr('মিটিং লিংক কপি করুন', 'Copy Meeting Link', 'نسخ رابط الاجتماع')}
                  </button>
                </div>
              )}

              {unlocked.dutyOfficerPhone && (
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://wa.me/88${unlocked.dutyOfficerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Assalamu Alaikum, I just checked in to Maharat Virtual Office (${fullName} - ${phone}).`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#005a6e] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#004555]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {tr('হোয়াটসঅ্যাপে পিং করুন', 'Ping Officer on WhatsApp', 'واتساب المستشار')}
                  </a>
                  <a
                    href={`tel:${unlocked.dutyOfficerPhone}`}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                  >
                    <Phone className="h-4 w-4 text-[#192f64] dark:text-[#f0c95e]" />
                    {unlocked.dutyOfficerPhone}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function usePublicVirtualOfficeStatus(): PublicVirtualOfficeStatus {
  const { state } = useCMS();
  const [status, setStatus] = useState<PublicVirtualOfficeStatus>(() =>
    sanitizeVirtualOfficeForPublic(state.virtualOfficeConfig)
  );

  useEffect(() => {
    let active = true;
    fetch('/api/public/virtual-office/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.ok && data.virtualOffice) {
          setStatus(data.virtualOffice);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [state.virtualOfficeConfig]);

  return status;
}

export const VirtualOfficeFloatingLauncher: React.FC = () => {
  const { language } = useCMS();
  const publicStatus = usePublicVirtualOfficeStatus();
  const [open, setOpen] = useState(false);

  if (!publicStatus.enabled) return null;

  const isLive = publicStatus.status === 'ONLINE_LIVE';
  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="virtual-office-launcher"
        className="fixed bottom-20 left-3 z-40 inline-flex items-center gap-2 rounded-full border border-[#f0c95e]/40 bg-[#0a1738]/95 backdrop-blur-sm px-3 py-2 text-[11px] sm:px-4 sm:py-2.5 sm:text-xs font-bold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-[#192f64] lg:bottom-6 lg:left-6"
      >
        <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
          {isLive && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ${
              isLive ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
        </span>
        <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#f0c95e]" />
        <span className="hidden sm:inline">
          {isLive
            ? tr('ভার্চুয়াল অফিস চালু (LIVE)', 'Virtual Office LIVE', 'المكتب الافتراضي مباشر')
            : tr('ভিডিও কলব্যাক বুক করুন', 'Book Video Callback', 'حجز مكالمة فيديو')}
        </span>
        <span className="sm:hidden">
          {tr('লাইভ ডেস্ক', 'Live Desk', 'مكتب مباشر')}
        </span>
      </button>

      <VirtualOfficeModal isOpen={open} onClose={() => setOpen(false)} publicStatus={publicStatus} />
    </>
  );
};

export const VirtualOfficeDeskCard: React.FC = () => {
  const { language } = useCMS();
  const publicStatus = usePublicVirtualOfficeStatus();
  const [open, setOpen] = useState(false);
  const [selectedDesk, setSelectedDesk] = useState<string | undefined>(undefined);

  if (!publicStatus.enabled) return null;

  const isLive = publicStatus.status === 'ONLINE_LIVE';
  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-[#005a6e]/25 bg-gradient-to-br from-[#0a1738] via-[#192f64] to-[#005a6e] p-6 text-white shadow-xl sm:p-8">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#f0c95e]">
              <Headphones className="h-3.5 w-3.5" />
              {tr(
                'অনলাইন-অফলাইন হাইব্রিড ক্যাম্পাস অফিস',
                'Online-Offline Hybrid Virtual Office',
                'المكتب الافتراضي والحضوري المباشر'
              )}
              <span
                className={`ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                  isLive ? 'bg-emerald-500/30 text-emerald-200' : 'bg-amber-500/30 text-amber-200'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-300' : 'bg-amber-300'}`} />
                {isLive ? 'LIVE NOW' : publicStatus.status}
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">
              {tr(
                'ঘরে বসেই সরাসরি আমাদের ভর্তি অফিস ও অধ্যক্ষের সাথে ভিডিও কলে কথা বলুন',
                'Speak Face-to-Face with Our Admission Desk & Principal Online',
                'تحدث وجهاً لوجه مع مكتب القبول والمدير عبر الفيديو'
              )}
            </h2>
            <p className="mt-2 text-sm text-slate-200">
              {tr(
                'ব্যস্ত অভিভাবক ও প্রবাসী বাংলাদেশিদের জন্য তাৎক্ষণিক ভার্চুয়াল কাউন্সেলিং, ২০২৭ ফি-গাইড ও ভর্তি নির্দেশনা—সপ্তাহে ৬ দিন (শনি–বৃহস্পতি)।',
                'Instant live counseling for busy parents & overseas (NRB) families—or visit our Uttara Sector-12 Campus directly.',
                'استشارة فورية عبر الفيديو لأولياء الأمور والمغتربين 6 أيام في الأسبوع.'
              )}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-200">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#f0c95e]" />
                {publicStatus.openTime} – {publicStatus.closeTime} ({publicStatus.timezone})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#f0c95e]" />
                {tr('উত্তরা সেক্টর-১২, রোড ১৫, হাউজ ০৪', 'House 04, Road 15, Sector-12, Uttara', 'أوتارا قطاع 12، دكا')}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 lg:col-span-5">
            {publicStatus.desks.map((desk) => (
              <button
                key={desk.id}
                type="button"
                onClick={() => {
                  setSelectedDesk(desk.id);
                  setOpen(true);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/10 p-3.5 text-left backdrop-blur-sm transition hover:border-[#f0c95e]/60 hover:bg-white/15"
              >
                <div>
                  <div className="text-xs font-bold text-white">
                    {language === 'bn'
                      ? desk.nameBn
                      : language === 'ar'
                      ? desk.nameAr || desk.nameEn
                      : desk.nameEn}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-300">
                    {language === 'bn' ? desk.officerNameBn : desk.officerNameEn} · {desk.platform}
                  </div>
                </div>
                <span className="shrink-0 rounded-xl bg-[#f0c95e] px-3 py-1.5 text-[11px] font-extrabold text-[#0a1738]">
                  {isLive ? tr('জয়েন করুন', 'Join Live', 'انضم') : tr('বুক করুন', 'Book', 'احجز')}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <VirtualOfficeModal
        isOpen={open}
        onClose={() => setOpen(false)}
        publicStatus={publicStatus}
        initialDeskId={selectedDesk}
      />
    </section>
  );
};
