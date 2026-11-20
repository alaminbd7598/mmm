import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  FileText,
  Link as LinkIcon,
  Loader2,
  Megaphone,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import {
  classifyContentDeterministically,
  SmartPublishSuggestion,
} from '../utils/admissionToken2027Logic';
import { generateHafizCertificatePdf } from '../utils/certificatePdf';

export const AdminAIPublisherTab: React.FC = () => {
  const {
    state,
    currentUser,
    language,
    addHafizGraduate,
    addNotice,
    addBlogPost,
    addEvent,
    addCalendarEvent,
    addNews,
    pushToast,
  } = useCMS();

  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  const [sourceUrl, setSourceUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestion, setSuggestion] = useState<SmartPublishSuggestion | null>(null);
  const [publishedHafizReady, setPublishedHafizReady] = useState<{
    nameBn: string;
    nameEn: string;
    serialNumber: number;
    completionYear: string;
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = () => {
        setRawText((prev) => `${prev ? prev + '\n\n' : ''}${String(reader.result || '')}`);
      };
      reader.readAsText(file);
    } else {
      setRawText((prev) =>
        prev
          ? prev
          : `Uploaded Document: ${file.name}\n(Add summary or paste Facebook post text for exact AI extraction.)`
      );
    }
  };

  const handleAnalyze = async () => {
    if (!rawText.trim() && !sourceUrl.trim()) {
      pushToast(
        tr('তথ্য দিন', 'Input Required', 'مطلوب إدخال'),
        tr(
          'ফেসবুক পোস্টের লিংক, লেখা বা ডকুমেন্ট দিন।',
          'Paste a Facebook post link/text or upload a document first.',
          'أدخل رابطاً أو نصاً أولاً.'
        ),
        'info'
      );
      return;
    }

    setIsAnalyzing(true);
    setPublishedHafizReady(null);
    const currentHuffazCount = (state.hifzTreeConfig?.graduates || []).length;
    try {
      const res = await fetch('/api/ai-smart-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          sourceUrl,
          currentHuffazCount,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.suggestion) {
          setSuggestion(data.suggestion);
          setIsAnalyzing(false);
          return;
        }
      }
      setSuggestion(classifyContentDeterministically(rawText || sourceUrl, sourceUrl, currentHuffazCount));
    } catch {
      setSuggestion(classifyContentDeterministically(rawText || sourceUrl, sourceUrl, currentHuffazCount));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOneClickPublish = () => {
    if (!suggestion) return;

    if (suggestion.targetSection === 'hifz-tree') {
      const nextSerial =
        suggestion.hafizCandidate?.serialNumber ||
        Math.max(31, (state.hifzTreeConfig?.graduates || []).length + 1);
      const nameBn = suggestion.hafizCandidate?.nameBn || suggestion.suggestedTitleBn;
      const nameEn = suggestion.hafizCandidate?.nameEn || suggestion.suggestedTitleEn;
      const year = suggestion.hafizCandidate?.completionYear || String(new Date().getFullYear());

      addHafizGraduate({
        serialNumber: nextSerial,
        serialLabelBn: `${nextSerial}তম হাফেজ`,
        nameBn,
        nameEn,
        classNameBn: suggestion.hafizCandidate?.classNameBn || 'তাহফিজুল কুরআন বিভাগ',
        completionDate: year,
        completionYear: year,
        durationNoteBn: suggestion.hafizCandidate?.durationNoteBn || 'পূর্ণাঙ্গ ৩০ পারা হিফজ সম্পন্ন',
        badgeTextBn: 'হাফেজে কুরআন',
        descriptionBn: suggestion.suggestedBodyBn,
        photoUrl: '',
        biographyBn: suggestion.suggestedBodyBn,
        biographyEn: suggestion.suggestedBodyEn,
        facebookPostUrl: suggestion.hafizCandidate?.facebookPostUrl || sourceUrl || undefined,
        certificateCode: `MMM-HFZ-${year}-${String(nextSerial).padStart(2, '0')}`,
      });

      setPublishedHafizReady({ nameBn, nameEn, serialNumber: nextSerial, completionYear: year });
      pushToast(
        tr(`${nextSerial}তম হাফেজ হিফজ ট্রি-তে যুক্ত হয়েছে!`, `#${nextSerial} Hafez Added to Hifz Tree!`, 'تمت الإضافة إلى شجرة الحفاظ!'),
        tr('এখনই QR ভেরিফাইড সার্টিফিকেট ডাউনলোড করতে পারবেন।', 'You can now download the QR-verified certificate.', 'يمكنك الآن تحميل الشهادة.')
      );
    } else if (suggestion.targetSection === 'notice') {
      const cat =
        suggestion.category === 'Admission' ||
        suggestion.category === 'Exam' ||
        suggestion.category === 'Holiday'
          ? suggestion.category
          : 'Academic';
      addNotice({
        title: suggestion.suggestedTitleBn,
        publishDate: new Date().toISOString().slice(0, 10),
        category: cat,
        description: suggestion.suggestedBodyBn,
      });
    } else if (suggestion.targetSection === 'blog') {
      addBlogPost({
        slug: `ai-post-${Date.now()}`,
        titleBn: suggestion.suggestedTitleBn,
        titleEn: suggestion.suggestedTitleEn,
        excerptBn: suggestion.suggestedBodyBn.slice(0, 150),
        excerptEn: suggestion.suggestedBodyEn.slice(0, 150),
        bodyMarkdownBn: suggestion.suggestedBodyBn,
        bodyMarkdownEn: suggestion.suggestedBodyEn,
        category: suggestion.category || 'Education & Tarbiyah',
        tags: ['Maharat', 'AI Published'],
        authorName: currentUser?.fullName || 'Maharat AI Desk',
        status: 'Published',
        publishedAt: new Date().toISOString().slice(0, 10),
        source: 'ai-assistant',
      });
    } else if (suggestion.targetSection === 'event') {
      const evDate = suggestion.eventDate || new Date().toISOString().slice(0, 10);
      addEvent({
        title: suggestion.suggestedTitleBn,
        date: evDate,
        time: '09:00 AM',
        venue: 'মাহারাত মডেল মাদ্রাসা ক্যাম্পাস, উত্তরা সেক্টর-১২',
        type: 'On-Campus',
        description: suggestion.suggestedBodyBn,
        registrationOpen: true,
      });
      addCalendarEvent({
        titleBn: suggestion.suggestedTitleBn,
        titleEn: suggestion.suggestedTitleEn,
        date: evDate,
        category: 'institutional',
        descriptionBn: suggestion.suggestedBodyBn,
        source: 'local',
      });
    } else if (suggestion.targetSection === 'news-ticker') {
      addNews(suggestion.suggestedTitleBn);
    }

    setSuggestion(null);
    setRawText('');
    setSourceUrl('');
    setUploadedFileName('');
  };

  const loadSampleHafezPost = () => {
    setSourceUrl('https://www.facebook.com/maharatmodelmadrasah/posts/31st-hafez-announcement');
    setRawText(
      'আলহামদুলিল্লাহ! মাহারাত মডেল মাদ্রাসার তাহফিজুল কুরআন বিভাগ থেকে ৩১তম হাফেজ হিসেবে পবিত্র কুরআনের ৩০ পারা হিফজ সম্পন্ন করেছে প্রিয় শিক্ষার্থী হাফেজ মুয়াজ বিন আব্দুল্লাহ (শ্রেণি: ৬ষ্ঠ)। মহান আল্লাহ তাকে দ্বীনের খাদেম হিসেবে কবুল করুন।'
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-[#0a1738] via-[#192f64] to-[#005a6e] p-6 text-white shadow-lg">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#f0c95e]">
          <Sparkles className="h-3.5 w-3.5" />
          {tr(
            'এমএমএম এআই স্মার্ট পাবলিশিং অ্যাসিস্ট্যান্ট',
            'MMM AI Smart Publishing Assistant',
            'مساعد النشر الذكي بالذكاء الاصطناعي'
          )}
        </div>
        <h2 className="mt-2 text-xl font-bold sm:text-2xl">
          {tr(
            'ফেসবুক পোস্ট বা ডকুমেন্ট থেকে অটোমেটিক সেকশন শনাক্ত ও ১-ক্লিক পাবলিশ',
            'Auto-Detect Website Section & 1-Click Publish from Facebook Posts or Documents',
            'اكتشاف القسم تلقائياً والنشر بنقرة واحدة'
          )}
        </h2>
        <p className="mt-1 max-w-2xl text-xs text-slate-200 sm:text-sm">
          {tr(
            'নতুন হাফেজ (যেমন ৩১তম হাফেজ), জরুরি নোটিশ, ইভেন্ট বা ব্লগ প্রবন্ধের ফেসবুক পোস্ট/ডকুমেন্ট এখানে পেস্ট করুন—AI স্বয়ংক্রিয়ভাবে সঠিক সেকশন শনাক্ত করে পাবলিশের জন্য প্রস্তুত করবে।',
            'Paste a Facebook post (e.g., new 31st Hafez completion), announcement, or upload a document—AI detects the right section (Hifz Tree, Notice Board, Blog, Calendar, or News Ticker) for instant publishing.',
            'الصق منشوراً من فيسبوك أو ارفع مستنداً ليقوم الذكاء الاصطناعي بتحديد القسم المناسب ونشره فوراً.'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Input Column */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#192f64] dark:text-white">
              {tr('১. ফেসবুক লিংক / ঘোষণা / ডকুমেন্ট দিন', '1. Input Source Content', '١. أدخل المحتوى أو الرابط')}
            </h3>
            <button
              type="button"
              onClick={loadSampleHafezPost}
              className="rounded-lg bg-[#c4962c]/15 px-2.5 py-1 text-[11px] font-bold text-[#8a6510] hover:bg-[#c4962c]/25 dark:text-[#f0c95e]"
            >
              {tr('নমুনা ৩১তম হাফেজ পোস্ট লোড করুন', 'Load Sample 31st Hafez Post', 'تحميل مثال الحافظ 31')}
            </button>
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <LinkIcon className="h-3.5 w-3.5 text-[#005a6e]" />
              {tr('ফেসবুক পোস্ট বা ডকুমেন্ট লিংক (ঐচ্ছিক)', 'Facebook Post / Source URL (Optional)', 'رابط فيسبوك (اختياري)')}
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://www.facebook.com/maharatmodelmadrasah/posts/..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
              {tr('পোস্টের মূল লেখা / ঘোষণা পেস্ট করুন *', 'Paste Post Text / Announcement *', 'نص المنشور أو الإعلان *')}
            </label>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={tr(
                'এখানে ফেসবুক পোস্ট, নতুন হাফেজের বিবরণ, ছুটির নোটিশ বা অনুষ্ঠানের তথ্য পেস্ট করুন...',
                'Paste Facebook post text, new Hafez announcement, notice, or article here...',
                'الصق نص المنشور هنا...'
              )}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 outline-none focus:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:border-[#005a6e] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Upload className="h-4 w-4 text-[#005a6e]" />
              {uploadedFileName || tr('ম্যানুয়াল ডকুমেন্ট আপলোড (.txt/.pdf)', 'Upload Document (.txt/.pdf)', 'رفع مستند')}
              <input type="file" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-2 rounded-xl bg-[#192f64] px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-[#0a1738] disabled:opacity-60"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#f0c95e]" />
              ) : (
                <Sparkles className="h-4 w-4 text-[#f0c95e]" />
              )}
              {isAnalyzing
                ? tr('AI বিশ্লেষণ করছে...', 'Analyzing with AI...', 'جارٍ التحليل...')
                : tr('AI দিয়ে সেকশন শনাক্ত করুন', 'Analyze & Suggest Section', 'تحليل واقتراح القسم')}
            </button>
          </div>
        </div>

        {/* AI Suggestion Preview & 1-Click Publish */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-6">
          <h3 className="mb-3 text-sm font-bold text-[#192f64] dark:text-white">
            {tr('২. AI সাজেশন ও ১-ক্লিক পাবলিশ প্রিভিউ', '2. AI Routing Preview & 1-Click Publish', '٢. معاينة الاقتراح والنشر')}
          </h3>

          {publishedHafizReady && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                {tr(
                  `${publishedHafizReady.serialNumber}তম হাফেজ সফলভাবে যুক্ত হয়েছে!`,
                  `#${publishedHafizReady.serialNumber} Hafez Published to Hifz Tree!`,
                  'تم نشر الحافظ الجديد بنجاح!'
                )}
              </div>
              <button
                type="button"
                onClick={() =>
                  generateHafizCertificatePdf({
                    grad: {
                      id: `hafiz-${publishedHafizReady.serialNumber}`,
                      serialNumber: publishedHafizReady.serialNumber,
                      serialLabelBn: `${publishedHafizReady.serialNumber}তম হাফেজ`,
                      nameBn: publishedHafizReady.nameBn,
                      nameEn: publishedHafizReady.nameEn,
                      classNameBn: 'তাহফিজুল কুরআন বিভাগ',
                      completionDate: publishedHafizReady.completionYear,
                      completionYear: publishedHafizReady.completionYear,
                      durationNoteBn: 'পূর্ণাঙ্গ ৩০ পারা হিফজ সম্পন্ন',
                      badgeTextBn: 'হাফেজে কুরআন',
                      descriptionBn: 'মাহারাত মডেল মাদ্রাসার তাহফিজুল কুরআন বিভাগ থেকে সম্পূর্ণ কুরআন হিফজ সম্পন্ন করেছে।',
                      photoUrl: '',
                      certificateCode: `MMM-HFZ-${publishedHafizReady.completionYear}-${String(publishedHafizReady.serialNumber).padStart(2, '0')}`,
                    },
                    totalHuffaz: (state.hifzTreeConfig?.graduates || []).length,
                    users: state.users,
                  })
                }
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-[#192f64] px-3.5 py-2 text-xs font-bold text-white"
              >
                <Award className="h-4 w-4 text-[#f0c95e]" />
                {tr('QR সার্টিফিকেট PDF ডাউনলোড করুন', 'Download QR-Verified Certificate PDF', 'تحميل الشهادة PDF')}
              </button>
            </div>
          )}

          {!suggestion ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-700">
              <Sparkles className="h-8 w-8 text-[#c4962c]/70" />
              <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                {tr(
                  'বাম পাশে কোনো ফেসবুক পোস্ট বা ঘোষণা দিয়ে "AI দিয়ে সেকশন শনাক্ত করুন" বাটনে ক্লিক করুন।',
                  'Enter a Facebook post or announcement on the left and click "Analyze & Suggest Section".',
                  'أدخل النص على اليسار واضغط على تحليل واقتراح القسم.'
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#005a6e]/10 p-3 dark:bg-teal-900/30">
                <div className="flex items-center gap-2 text-xs font-bold text-[#005a6e] dark:text-teal-200">
                  {suggestion.targetSection === 'hifz-tree' && <Award className="h-4 w-4" />}
                  {suggestion.targetSection === 'notice' && <FileText className="h-4 w-4" />}
                  {suggestion.targetSection === 'blog' && <BookOpen className="h-4 w-4" />}
                  {suggestion.targetSection === 'event' && <Calendar className="h-4 w-4" />}
                  {suggestion.targetSection === 'news-ticker' && <Megaphone className="h-4 w-4" />}
                  <span>Target: {suggestion.targetSection.toUpperCase()}</span>
                </div>
                <span className="rounded-full bg-[#192f64] px-2.5 py-0.5 text-[11px] font-bold text-[#f0c95e]">
                  {Math.round((suggestion.confidence || 0.9) * 100)}% Match
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                {language === 'bn' ? suggestion.rationaleBn : suggestion.rationaleEn}
              </p>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">
                  Suggested Title (Editable)
                </label>
                <input
                  type="text"
                  value={suggestion.suggestedTitleBn}
                  onChange={(e) =>
                    setSuggestion({ ...suggestion, suggestedTitleBn: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              {suggestion.targetSection === 'hifz-tree' && suggestion.hafizCandidate && (
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300">
                      Hafez Serial #
                    </label>
                    <input
                      type="number"
                      value={suggestion.hafizCandidate.serialNumber}
                      onChange={(e) =>
                        setSuggestion({
                          ...suggestion,
                          hafizCandidate: {
                            ...suggestion.hafizCandidate!,
                            serialNumber: Number(e.target.value) || 31,
                          },
                        })
                      }
                      className="mt-0.5 w-full rounded-lg border border-amber-200 bg-white px-2 py-1 text-xs font-bold dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300">
                      Hafez Name (Bn)
                    </label>
                    <input
                      type="text"
                      value={suggestion.hafizCandidate.nameBn}
                      onChange={(e) =>
                        setSuggestion({
                          ...suggestion,
                          hafizCandidate: {
                            ...suggestion.hafizCandidate!,
                            nameBn: e.target.value,
                          },
                        })
                      }
                      className="mt-0.5 w-full rounded-lg border border-amber-200 bg-white px-2 py-1 text-xs font-bold dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">
                  Target Section Override
                </label>
                <select
                  value={suggestion.targetSection}
                  onChange={(e) =>
                    setSuggestion({
                      ...suggestion,
                      targetSection: e.target.value as SmartPublishSuggestion['targetSection'],
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="hifz-tree">Hifz Tree (New Hafez + Certificate)</option>
                  <option value="notice">Notice Board</option>
                  <option value="blog">Blog Article</option>
                  <option value="event">Event & Institutional Calendar</option>
                  <option value="news-ticker">Top Scrolling News Ticker</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleOneClickPublish}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                {tr('১-ক্লিকে ওয়েবসাইটে পাবলিশ করুন', '1-Click Publish to Live Website', 'نشر بنقرة واحدة')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
