import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Eraser,
  ImagePlus,
  PenLine,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  UserCircle2,
  X,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import type { AdminUser } from '../types/cms';
import { safeImageUrl } from '../utils/safeUrl';
import { normalizeAdminRole } from '../utils/cmsLogic';

type SignatorySlot = NonNullable<AdminUser['signatorySlot']>;

interface ProfileForm {
  fullName: string;
  designation: string;
  phone: string;
  email: string;
  googleEmail: string;
  bio: string;
  photoUrl: string;
  signatorySlot: SignatorySlot;
  signatureDataUrl: string;
}

// The whole users array is synced with the CMS state, so inline images stay small.
const SIGNATURE_MAX_BYTES = 300 * 1024;
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_SIZE = 256;
const PAD_WIDTH = 600;
const PAD_HEIGHT = 200;
const PEN_COLOR = '#192f64';
const SIGNATURE_TYPES = ['image/png', 'image/jpeg'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const buildForm = (user: AdminUser): ProfileForm => ({
  fullName: user.fullName || '',
  designation: user.designation || '',
  phone: user.phone || '',
  email: user.email || '',
  googleEmail: user.googleEmail || '',
  bio: user.bio || '',
  photoUrl: user.photoUrl || '',
  signatorySlot: user.signatorySlot || 'none',
  signatureDataUrl: user.signatureDataUrl || '',
});

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('read failed'));
    reader.readAsDataURL(file);
  });

/** Centre-crops a photo to a small square JPEG so the stored data URL stays light. */
const toSquareAvatar = (dataUrl: string) =>
  new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = PHOTO_SIZE;
      canvas.height = PHOTO_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('canvas unavailable'));
        return;
      }
      const side = Math.min(img.width, img.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, PHOTO_SIZE, PHOTO_SIZE);
      ctx.drawImage(
        img,
        (img.width - side) / 2,
        (img.height - side) / 2,
        side,
        side,
        0,
        0,
        PHOTO_SIZE,
        PHOTO_SIZE
      );
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('invalid image'));
    img.src = dataUrl;
  });

/** Re-encodes an uploaded signature as a PNG that fits the pad box (validates it is a real image). */
const toSignaturePng = (dataUrl: string) =>
  new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (!img.width || !img.height) {
        reject(new Error('invalid image'));
        return;
      }
      const scale = Math.min(1, PAD_WIDTH / img.width, PAD_HEIGHT / img.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('canvas unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('invalid image'));
    img.src = dataUrl;
  });

/** Photo links may be https/http, a site-relative asset path, or an inline raster image. */
const isSafePhotoUrl = (value: string) => !/\s/.test(value) && safeImageUrl(value) !== '';

const ROLE_LABELS: Record<string, [string, string, string]> = {
  'Super Admin': ['সুপার অ্যাডমিন', 'Super Admin', 'المشرف العام'],
  'Chairman / Managing Director': ['চেয়ারম্যান / ব্যবস্থাপনা পরিচালক', 'Chairman / Managing Director', 'رئيس مجلس الإدارة / المدير العام'],
  'Principal / Vice Principal': ['অধ্যক্ষ / উপাধ্যক্ষ', 'Principal / Vice Principal', 'المدير / نائب المدير'],
  'Coordinators / Teachers': ['কো-অর্ডিনেটর / শিক্ষক', 'Coordinators / Teachers', 'المنسقون / المعلمون'],
  'Content Managers': ['কনটেন্ট ম্যানেজার', 'Content Managers', 'مديرو المحتوى'],
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="file"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#005a6e] focus:ring-2 focus:ring-[#005a6e]/25 dark:border-slate-600 dark:bg-slate-800 dark:text-white';
const labelClass = 'mb-1 block text-xs font-bold text-slate-700 dark:text-slate-200';
const ghostBtnClass =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700';

export const AdminProfileModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { state, language, currentUser, updateCurrentUserProfile } = useCMS();

  const [form, setForm] = useState<ProfileForm | null>(null);
  const [error, setError] = useState('');
  const [sigMode, setSigMode] = useState<'draw' | 'upload'>('draw');
  const [padHasInk, setPadHasInk] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const sigFromPadRef = useRef(false);
  const sigBeforePadRef = useRef('');
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const sigInputRef = useRef<HTMLInputElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const userId = currentUser?.id;

  // Re-initialise the form from the logged-in user every time the modal opens.
  useEffect(() => {
    if (!isOpen || !currentUser) {
      setForm(null);
      return;
    }
    setForm(buildForm(currentUser));
    setError('');
    setSigMode('draw');
    setPadHasInk(false);
    sigFromPadRef.current = false;
    sigBeforePadRef.current = '';
    drawingRef.current = false;
    lastPointRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId]);

  // Escape to close, background scroll lock, and initial focus.
  const formReady = form !== null;
  useEffect(() => {
    if (!isOpen || !userId || !formReady) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!active || !panelRef.current.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen, userId, formReady]);

  if (!isOpen || !currentUser || !form) return null;

  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  const setField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setError('');
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const slotOptions: { value: SignatorySlot; label: string }[] = [
    { value: 'none', label: tr('কোনো স্বাক্ষরকারী পদ নয়', 'Not a certificate signatory', 'ليس موقّعاً على الشهادات') },
    { value: 'chairman', label: tr('চেয়ারম্যান', 'Chairman', 'رئيس مجلس الإدارة') },
    { value: 'principal', label: tr('অধ্যক্ষ', 'Principal', 'المدير') },
    { value: 'coordinator', label: tr('কো-অর্ডিনেটর', 'Coordinator', 'المنسّق') },
  ];

  // Signatory slots appear on public certificates, so only a Super Admin may assign them (server rule).
  const isSuperAdmin = normalizeAdminRole(currentUser.role) === 'Super Admin';

  const slotHolder =
    isSuperAdmin && form.signatorySlot !== 'none'
      ? (state.users || []).find(
          (u) => u.id !== currentUser.id && u.signatorySlot === form.signatorySlot
        )
      : undefined;

  /* ---------- Signature pad ---------- */

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / (rect.width || 1)) * canvas.width,
      y: ((e.clientY - rect.top) / (rect.height || 1)) * canvas.height,
    };
  };

  const preparePen = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = PEN_COLOR;
    ctx.fillStyle = PEN_COLOR;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = pointFromEvent(e);
    drawingRef.current = true;
    lastPointRef.current = p;
    preparePen(ctx);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !lastPointRef.current) return;
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    e.preventDefault();
    const p = pointFromEvent(e);
    preparePen(ctx);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPointRef.current = p;
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    // Each finished stroke becomes the pending signature (transparent PNG).
    if (!sigFromPadRef.current) sigBeforePadRef.current = form.signatureDataUrl;
    sigFromPadRef.current = true;
    setPadHasInk(true);
    setField('signatureDataUrl', e.currentTarget.toDataURL('image/png'));
  };

  const clearPad = () => {
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setPadHasInk(false);
    if (sigFromPadRef.current) {
      // Drop the drawn draft and fall back to whatever was pending before drawing.
      sigFromPadRef.current = false;
      setField('signatureDataUrl', sigBeforePadRef.current);
    }
  };

  const removeSignature = () => {
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setPadHasInk(false);
    sigFromPadRef.current = false;
    setField('signatureDataUrl', '');
  };

  const handleSignatureFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!SIGNATURE_TYPES.includes(file.type)) {
      setError(
        tr(
          'স্বাক্ষরের জন্য শুধু PNG বা JPG ছবি আপলোড করুন।',
          'Please upload a PNG or JPG image for the signature.',
          'يرجى رفع صورة بصيغة PNG أو JPG للتوقيع.'
        )
      );
      return;
    }
    if (file.size > SIGNATURE_MAX_BYTES) {
      setError(
        tr(
          'স্বাক্ষরের ছবি ৩০০ KB-এর বেশি হতে পারবে না।',
          'The signature image must be 300 KB or smaller.',
          'يجب ألا يتجاوز حجم صورة التوقيع 300 كيلوبايت.'
        )
      );
      return;
    }
    try {
      const dataUrl = await toSignaturePng(await readAsDataUrl(file));
      sigFromPadRef.current = false;
      setField('signatureDataUrl', dataUrl);
    } catch {
      setError(tr('ছবিটি পড়া যায়নি। আবার চেষ্টা করুন।', 'Could not read the image. Please try again.', 'تعذّرت قراءة الصورة. حاول مرة أخرى.'));
    }
  };

  /* ---------- Profile photo ---------- */

  const handlePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(tr('শুধু ছবি ফাইল আপলোড করুন।', 'Please upload an image file.', 'يرجى رفع ملف صورة.'));
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setError(tr('ছবি ৫ MB-এর বেশি হতে পারবে না।', 'The photo must be 5 MB or smaller.', 'يجب ألا يتجاوز حجم الصورة 5 ميغابايت.'));
      return;
    }
    try {
      setField('photoUrl', await toSquareAvatar(await readAsDataUrl(file)));
    } catch {
      setError(tr('ছবিটি পড়া যায়নি। আবার চেষ্টা করুন।', 'Could not read the image. Please try again.', 'تعذّرت قراءة الصورة. حاول مرة أخرى.'));
    }
  };

  /* ---------- Save ---------- */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = form.fullName.trim();
    const email = form.email.trim();
    const googleEmail = form.googleEmail.trim();
    if (!fullName) {
      setError(tr('পূর্ণ নাম আবশ্যক।', 'Full name is required.', 'الاسم الكامل مطلوب.'));
      return;
    }
    if (!EMAIL_RE.test(email) || (googleEmail && !EMAIL_RE.test(googleEmail))) {
      setError(tr('সঠিক ইমেইল ঠিকানা লিখুন।', 'Please enter a valid email address.', 'يرجى إدخال بريد إلكتروني صحيح.'));
      return;
    }
    const photoUrl = form.photoUrl.trim();
    if (photoUrl && !isSafePhotoUrl(photoUrl)) {
      setError(
        tr(
          'ছবির লিংক https:// দিয়ে শুরু হতে হবে, অথবা ছবি আপলোড করুন।',
          'The photo link must start with https://, or upload a photo instead.',
          'يجب أن يبدأ رابط الصورة بـ https://، أو ارفع صورة بدلاً من ذلك.'
        )
      );
      return;
    }
    // The store action updates the user list, enforces slot uniqueness and shows the toast.
    updateCurrentUserProfile({
      fullName,
      email,
      designation: form.designation.trim(),
      phone: form.phone.trim(),
      bio: form.bio.trim(),
      photoUrl,
      googleEmail: googleEmail || undefined,
      signatorySlot: isSuperAdmin ? form.signatorySlot : currentUser.signatorySlot,
      signatureDataUrl: form.signatureDataUrl || undefined,
    });
    onClose();
  };

  const photoIsInline = form.photoUrl.startsWith('data:');
  const createdLabel = (() => {
    const d = new Date(currentUser.createdAt);
    if (Number.isNaN(d.getTime())) return currentUser.createdAt || '—';
    const locale = language === 'bn' ? 'bn-BD' : language === 'ar' ? 'ar' : 'en-GB';
    return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  })();
  const roleLabel = ROLE_LABELS[currentUser.role]
    ? tr(...ROLE_LABELS[currentUser.role])
    : currentUser.role || '—';
  const previewPhoto = isSafePhotoUrl(form.photoUrl.trim()) ? form.photoUrl.trim() : '';
  const tabClass = (active: boolean) =>
    `inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
      active
        ? 'bg-[#192f64] text-white'
        : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="admin-profile-modal-overlay"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-profile-modal-title"
        data-testid="admin-profile-modal"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 bg-gradient-to-r from-[#0a1738] to-[#005a6e] px-5 py-4 text-white">
          <div className="flex min-w-0 items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 shrink-0 text-[#f0c95e]" />
            <div className="min-w-0">
              <h2 id="admin-profile-modal-title" className="truncate text-sm font-bold">
                {tr('স্টাফ প্রোফাইল ও ডিজিটাল স্বাক্ষর ভল্ট', 'Staff Profile & Digital Signature Vault', 'ملف الموظف وخزنة التوقيع الرقمي')}
              </h2>
              <p className="truncate text-[11px] text-white/75">
                {tr(
                  'আপনার তথ্য ও স্বাক্ষর সার্টিফিকেট ও টোকেন PDF-এ স্বয়ংক্রিয়ভাবে যুক্ত হয়',
                  'Your details and signature are embedded automatically in certificate and token PDFs',
                  'تُدرج بياناتك وتوقيعك تلقائياً في ملفات الشهادات والإيصالات'
                )}
              </p>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label={tr('বন্ধ করুন', 'Close', 'إغلاق')}
            data-testid="admin-profile-close-btn"
            className="shrink-0 cursor-pointer rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0c95e]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
            {/* Identity summary + photo */}
            <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-800/60">
              {previewPhoto ? (
                <img
                  src={previewPhoto}
                  alt={form.fullName}
                  className="h-20 w-20 shrink-0 rounded-full border-2 border-[#c4962c] object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800">
                  <UserCircle2 className="h-10 w-10 text-[#005a6e] dark:text-[#f0c95e]" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
                  <div className="min-w-0">
                    <dt className="text-slate-500 dark:text-slate-400">{tr('ইউজারনেম', 'Username', 'اسم المستخدم')}</dt>
                    <dd className="truncate font-mono font-bold text-[#192f64] dark:text-white" dir="ltr">
                      {currentUser.username}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-slate-500 dark:text-slate-400">{tr('ভূমিকা', 'Role', 'الدور')}</dt>
                    <dd className="truncate font-bold text-[#192f64] dark:text-white">{roleLabel}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-slate-500 dark:text-slate-400">{tr('যুক্ত হয়েছেন', 'Member since', 'عضو منذ')}</dt>
                    <dd className="truncate font-bold text-[#192f64] dark:text-white">{createdLabel}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoFile}
                    aria-label={tr('প্রোফাইল ছবি আপলোড', 'Upload profile photo', 'رفع صورة الملف الشخصي')}
                    data-testid="admin-profile-photo-input"
                  />
                  <button type="button" className={ghostBtnClass} onClick={() => photoInputRef.current?.click()}>
                    <ImagePlus className="h-3.5 w-3.5" />
                    {tr('ছবি আপলোড', 'Upload photo', 'رفع صورة')}
                  </button>
                  {form.photoUrl && (
                    <button type="button" className={ghostBtnClass} onClick={() => setField('photoUrl', '')}>
                      <Trash2 className="h-3.5 w-3.5" />
                      {tr('ছবি সরান', 'Remove photo', 'إزالة الصورة')}
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Profile fields */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="apm-fullName" className={labelClass}>
                  {tr('পূর্ণ নাম', 'Full name', 'الاسم الكامل')} <span className="text-rose-600">*</span>
                </label>
                <input
                  id="apm-fullName"
                  type="text"
                  required
                  maxLength={80}
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(e) => setField('fullName', e.target.value)}
                  className={inputClass}
                  data-testid="admin-profile-fullname"
                />
              </div>
              <div>
                <label htmlFor="apm-designation" className={labelClass}>
                  {tr('পদবি', 'Designation', 'المسمى الوظيفي')}
                </label>
                <input
                  id="apm-designation"
                  type="text"
                  maxLength={80}
                  autoComplete="organization-title"
                  value={form.designation}
                  onChange={(e) => setField('designation', e.target.value)}
                  className={inputClass}
                  data-testid="admin-profile-designation"
                />
              </div>
              <div>
                <label htmlFor="apm-phone" className={labelClass}>
                  {tr('মোবাইল নম্বর', 'Phone', 'رقم الهاتف')}
                </label>
                <input
                  id="apm-phone"
                  type="tel"
                  dir="ltr"
                  maxLength={24}
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  className={inputClass}
                  data-testid="admin-profile-phone"
                />
              </div>
              <div>
                <label htmlFor="apm-email" className={labelClass}>
                  {tr('ইমেইল', 'Email', 'البريد الإلكتروني')} <span className="text-rose-600">*</span>
                </label>
                <input
                  id="apm-email"
                  type="email"
                  dir="ltr"
                  required
                  maxLength={120}
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  className={inputClass}
                  data-testid="admin-profile-email"
                />
              </div>
              <div>
                <label htmlFor="apm-googleEmail" className={labelClass}>
                  {tr('গুগল ওয়ার্কস্পেস ইমেইল', 'Google Workspace email', 'بريد Google Workspace')}
                </label>
                <input
                  id="apm-googleEmail"
                  type="email"
                  dir="ltr"
                  maxLength={120}
                  value={form.googleEmail}
                  onChange={(e) => setField('googleEmail', e.target.value)}
                  className={inputClass}
                  data-testid="admin-profile-google-email"
                />
              </div>
              <div>
                <label htmlFor="apm-photoUrl" className={labelClass}>
                  {tr('ছবির লিংক (ঐচ্ছিক)', 'Photo URL (optional)', 'رابط الصورة (اختياري)')}
                </label>
                <input
                  id="apm-photoUrl"
                  type="url"
                  dir="ltr"
                  placeholder={
                    photoIsInline
                      ? tr('আপলোড করা ছবি ব্যবহৃত হচ্ছে', 'Using the uploaded photo', 'تُستخدم الصورة المرفوعة')
                      : 'https://'
                  }
                  value={photoIsInline ? '' : form.photoUrl}
                  onChange={(e) => setField('photoUrl', e.target.value)}
                  className={inputClass}
                  data-testid="admin-profile-photo-url"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="apm-bio" className={labelClass}>
                  {tr('সংক্ষিপ্ত পরিচিতি', 'Short bio', 'نبذة مختصرة')}
                </label>
                <textarea
                  id="apm-bio"
                  rows={3}
                  maxLength={500}
                  value={form.bio}
                  onChange={(e) => setField('bio', e.target.value)}
                  className={`${inputClass} resize-y`}
                  data-testid="admin-profile-bio"
                />
              </div>
            </section>

            {/* Signature vault */}
            <section className="rounded-2xl border border-[#c4962c]/40 bg-[#c4962c]/5 p-4 dark:border-[#c4962c]/40 dark:bg-[#c4962c]/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#192f64] dark:text-[#f0c95e]">
                  <PenLine className="h-4 w-4" />
                  {tr('ডিজিটাল স্বাক্ষর ভল্ট', 'Digital Signature Vault', 'خزنة التوقيع الرقمي')}
                </h3>
                <div
                  role="group"
                  aria-label={tr('স্বাক্ষর দেওয়ার পদ্ধতি', 'Signature input method', 'طريقة إدخال التوقيع')}
                  className="inline-flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800"
                >
                  <button type="button" aria-pressed={sigMode === 'draw'} className={tabClass(sigMode === 'draw')} onClick={() => setSigMode('draw')} data-testid="admin-profile-sig-draw-tab">
                    <PenLine className="h-3.5 w-3.5" />
                    {tr('এঁকে দিন', 'Draw', 'ارسم')}
                  </button>
                  <button type="button" aria-pressed={sigMode === 'upload'} className={tabClass(sigMode === 'upload')} onClick={() => setSigMode('upload')} data-testid="admin-profile-sig-upload-tab">
                    <Upload className="h-3.5 w-3.5" />
                    {tr('আপলোড', 'Upload', 'رفع')}
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-5">
                <div className="md:col-span-3">
                  {/* The pad stays mounted while uploading so a drawn draft is not lost. */}
                  <div className={sigMode === 'draw' ? '' : 'hidden'}>
                    <canvas
                      ref={canvasRef}
                      width={PAD_WIDTH}
                      height={PAD_HEIGHT}
                      role="img"
                      aria-label={tr('স্বাক্ষর আঁকার প্যাড', 'Signature drawing pad', 'لوحة رسم التوقيع')}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerEnd}
                      onPointerCancel={handlePointerEnd}
                      style={{ touchAction: 'none', aspectRatio: `${PAD_WIDTH} / ${PAD_HEIGHT}` }}
                      className="block w-full cursor-crosshair rounded-xl border-2 border-dashed border-slate-300 bg-white dark:border-slate-500"
                      data-testid="admin-profile-signature-pad"
                    />
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        {tr(
                          'মাউস, আঙুল বা স্টাইলাস দিয়ে বাক্সের ভেতরে স্বাক্ষর করুন।',
                          'Sign inside the box with a mouse, finger or stylus.',
                          'وقّع داخل المربع بالفأرة أو الإصبع أو القلم.'
                        )}
                      </p>
                      <button type="button" className={ghostBtnClass} onClick={clearPad} disabled={!padHasInk} data-testid="admin-profile-signature-clear">
                        <Eraser className="h-3.5 w-3.5" />
                        {tr('মুছুন', 'Clear', 'مسح')}
                      </button>
                    </div>
                  </div>

                  {sigMode === 'upload' && (
                    <div className="flex h-full min-h-[9rem] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white p-4 text-center dark:border-slate-500 dark:bg-slate-800">
                      <input
                        ref={sigInputRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={handleSignatureFile}
                        aria-label={tr('স্বাক্ষরের ছবি আপলোড', 'Upload signature image', 'رفع صورة التوقيع')}
                        data-testid="admin-profile-signature-input"
                      />
                      <button type="button" className={ghostBtnClass} onClick={() => sigInputRef.current?.click()}>
                        <Upload className="h-3.5 w-3.5" />
                        {tr('স্বাক্ষরের ছবি বাছাই করুন', 'Choose signature image', 'اختر صورة التوقيع')}
                      </button>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        {tr(
                          'স্বচ্ছ ব্যাকগ্রাউন্ডের PNG সবচেয়ে ভালো (JPG-ও চলবে), সর্বোচ্চ ৩০০ KB।',
                          'A transparent PNG works best (JPG also accepted), up to 300 KB.',
                          'يُفضّل PNG بخلفية شفافة (ويُقبل JPG)، بحد أقصى 300 كيلوبايت.'
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <p className={labelClass}>{tr('সংরক্ষণের জন্য স্বাক্ষর', 'Signature to be saved', 'التوقيع الذي سيُحفظ')}</p>
                  <div className="flex h-24 items-center justify-center rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-600" data-testid="admin-profile-signature-preview">
                    {form.signatureDataUrl ? (
                      <img
                        src={form.signatureDataUrl}
                        alt={tr('স্বাক্ষরের প্রিভিউ', 'Signature preview', 'معاينة التوقيع')}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">
                        {tr('এখনো কোনো স্বাক্ষর নেই', 'No signature yet', 'لا يوجد توقيع بعد')}
                      </span>
                    )}
                  </div>
                  {form.signatureDataUrl && (
                    <button type="button" className={`${ghostBtnClass} mt-2 text-rose-700 dark:text-rose-300`} onClick={removeSignature} data-testid="admin-profile-signature-remove">
                      <Trash2 className="h-3.5 w-3.5" />
                      {tr('স্বাক্ষর সরান', 'Remove signature', 'إزالة التوقيع')}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="apm-slot" className={labelClass}>
                  {tr('সার্টিফিকেটে স্বাক্ষরকারী পদ', 'Certificate signatory slot', 'خانة التوقيع في الشهادات')}
                </label>
                <select
                  id="apm-slot"
                  value={form.signatorySlot}
                  onChange={(e) => setField('signatorySlot', e.target.value as SignatorySlot)}
                  disabled={!isSuperAdmin}
                  className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-70`}
                  data-testid="admin-profile-signatory-slot"
                >
                  {slotOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                  {isSuperAdmin
                    ? tr(
                        'প্রতিটি পদে একজনই স্বাক্ষরকারী থাকেন। আপনি পদটি নিলে আগের ব্যক্তির কাছ থেকে তা সরে যাবে।',
                        'Each slot has a single signatory. Taking a slot removes it from whoever holds it now.',
                        'لكل خانة موقّع واحد فقط. اختيارك لخانة يسحبها ممن يشغلها حالياً.'
                      )
                    : tr(
                        'স্বাক্ষরকারী পদ শুধু সুপার অ্যাডমিন নির্ধারণ করতে পারেন।',
                        'Only a Super Admin can assign the signatory slot.',
                        'لا يمكن تعيين خانة التوقيع إلا من قِبل المشرف العام.'
                      )}
                </p>
                {slotHolder && (
                  <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-200" data-testid="admin-profile-slot-warning">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      {tr(
                        `এই পদটি এখন ${slotHolder.fullName}-এর কাছে আছে; সংরক্ষণ করলে তা আপনার কাছে চলে আসবে।`,
                        `This slot is currently held by ${slotHolder.fullName}; saving will move it to you.`,
                        `هذه الخانة يشغلها حالياً ${slotHolder.fullName}؛ الحفظ سينقلها إليك.`
                      )}
                    </span>
                  </p>
                )}
              </div>
            </section>
          </div>

          <div className="flex shrink-0 flex-col gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-700 dark:bg-slate-800/60">
            <p role="alert" aria-live="assertive" className="min-h-[1rem] text-xs font-bold text-rose-700 dark:text-rose-300" data-testid="admin-profile-error">
              {error}
            </p>
            <div className="flex shrink-0 items-center justify-end gap-2">
              <button type="button" className={ghostBtnClass} onClick={onClose} data-testid="admin-profile-cancel-btn">
                {tr('বাতিল', 'Cancel', 'إلغاء')}
              </button>
              <button
                type="submit"
                data-testid="admin-profile-save-btn"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#005a6e] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#192f64] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c4962c]"
              >
                <Save className="h-3.5 w-3.5" />
                {tr('প্রোফাইল সংরক্ষণ করুন', 'Save profile', 'حفظ الملف الشخصي')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
