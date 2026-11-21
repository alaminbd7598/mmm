import React, { useState } from 'react';
import {
  Bus,
  CheckCircle2,
  Clock,
  Compass,
  Layers,
  Lock,
  MessageSquareWarning,
  Percent,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import {
  AdmissionExtraConfig,
  DayCareRoutineConfig,
  EducationMethodConfig,
  MadrasahContextConfig,
  RoutineActivityItem,
  TenYearPlanConfig,
  TransportAndLandmarkConfig,
  TransportRouteItem,
  UniformGuideConfig,
} from '../types/cms';
import { localizeDynamicText } from '../utils/textLocalizer';
import { hasRolePermission } from '../utils/cmsLogic';

type SubTabId =
  | 'preset-context'
  | 'education-5050'
  | 'ten-year-plan'
  | 'daycare-routine'
  | 'transport-landmarks'
  | 'admission-uniform-complaints';

export const AdminMadrasahInfographicsTab: React.FC = () => {
  const {
    state,
    currentUser,
    language,
    updateEducationMethodConfig,
    updateTenYearPlanConfig,
    updateDayCareRoutineConfig,
    updateTransportConfig,
    updateAdmissionExtraConfig,
    updateUniformConfig,
    updateMadrasahContextConfig,
    updateComplaintStatus,
    deleteComplaint,
    applyTargetInstitutionPreset,
  } = useCMS();

  const [activeSubTab, setActiveSubTab] = useState<SubTabId>('preset-context');

  const userRole = currentUser?.role || 'Super Admin';
  const canEdit = hasRolePermission(
    userRole,
    'madrasah-infographics',
    'edit',
    state.rbacMatrix
  );
  const canDelete = hasRolePermission(
    userRole,
    'madrasah-infographics',
    'delete',
    state.rbacMatrix
  );

  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  const locVal = (val: string) =>
    language === 'bn' ? val : localizeDynamicText(val, language);

  // Local editable drafts synced with CMS state
  const [eduDraft, setEduDraft] = useState<EducationMethodConfig>(state.educationMethodConfig);
  const [planDraft, setPlanDraft] = useState<TenYearPlanConfig>(state.tenYearPlanConfig);
  const [routineDraft, setRoutineDraft] = useState<DayCareRoutineConfig>(
    state.dayCareRoutineConfig
  );
  const [transportDraft, setTransportDraft] = useState<TransportAndLandmarkConfig>(
    state.transportConfig
  );
  const [admissionExtraDraft, setAdmissionExtraDraft] = useState<AdmissionExtraConfig>(
    state.admissionExtraConfig
  );
  const [uniformDraft] = useState<UniformGuideConfig>(state.uniformConfig);
  const [contextDraft, setContextDraft] = useState<MadrasahContextConfig>(
    state.madrasahContextConfig
  );

  // Sync local drafts when preset changes
  const handlePresetSwitch = (preset: 'maharat' | 'craft') => {
    if (!canEdit) return;
    applyTargetInstitutionPreset(preset);
    setTimeout(() => {
      setContextDraft((prev) => ({ ...prev, activePresetId: preset }));
    }, 50);
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Banner: Craft International Institute Royal Purple, Fuchsia & Gold Gradient */}
      <div className="bg-gradient-to-r from-[#2e0249] via-[#4c0575] to-[#2e0249] text-white rounded-2xl p-6 shadow-xl border border-purple-500/30 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-fuchsia-500/15 blur-2xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-purple-950 text-xs font-black uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {tr(
                  'টার্গেট প্রজেক্ট ও ৪টি ইনফোগ্রাফিক মাস্টার কন্ট্রোলার',
                  'Target Project & 4 Infographics Master Controller',
                  'وحدة التحكم الرئيسية في إنفوجرافيك المدرسة والمشاريع'
                )}
              </span>
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              {tr(
                'মাহারাত মডেল মাদ্রাসা (EIIN: 140630) ইনফোগ্রাফিক ও রুট কন্ট্রোল প্যানেল',
                'Maharat Model Madrasah (EIIN: 140630) Infographics & Route Control Panel',
                'لوحة تحكم إنفوجرافيك ومسارات مدرسة المهارات النموذجية'
              )}
            </h2>
            <p className="text-xs sm:text-sm text-purple-200">
              {tr(
                'শিক্ষা পদ্ধতি ৫০/৫০ শতাংশ (%), ১০ বছরের পাঠ পরিকল্পনা, ডে-কেয়ার রুটিন, নিজস্ব পরিবহন রুট, দূরত্ব ও ভাড়া এখান থেকে ১০০% নিয়ন্ত্রণ করুন।',
                'Manage 100% of the 50/50 Education Method percentages, 10-Year Study Plan, Day-Care Routine, Transport Routes, Distances, and Fares from here.',
                'تحكم بنسبة ١٠٠٪ في منهج التعليم ٥٠/٥٠، والخطة الدراسية لـ ١٠ سنوات، والروتين اليومي للرعاية النهارية، ومسارات النقل والرسوم.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => handlePresetSwitch('maharat')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                state.madrasahContextConfig.activePresetId === 'maharat'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-purple-950 shadow-md ring-2 ring-white'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'
              } ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {tr(
                  'মাহারাত মডেল মাদ্রাসা অফিশিয়াল প্রিসেট সক্রিয়',
                  'Maharat Model Madrasah Official Preset',
                  'الإعداد الرسمي لمدرسة المهارات النموذجية'
                )}
              </span>
            </button>
          </div>
        </div>
      </div>

      {!canEdit && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-center gap-2.5 text-xs font-bold text-amber-800 dark:text-amber-300">
          <Lock className="w-4 h-4 shrink-0" />
          <span>
            {tr(
              'আপনার বর্তমান রোলে শুধুমাত্র দেখার (View Only) অনুমতি রয়েছে। তথ্য সম্পাদনা করতে সুপার অ্যাডমিন থেকে Edit পারমিশন নিন।',
              'Your current role has View-Only permission on this module. Request Edit permission from Super Admin to modify records.',
              'دورك الحالي يملك صلاحية العرض فقط. يرجى طلب صلاحية التعديل من المشرف العام.'
            )}
          </span>
        </div>
      )}

      {/* Sub-Navigation Pills */}
      <div className="flex flex-wrap gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-purple-100 dark:border-slate-800 shadow-xs">
        {[
          {
            id: 'preset-context' as SubTabId,
            label: tr(
              '১. প্রতিষ্ঠার প্রেক্ষাপট ও লক্ষ্য',
              '1. Founding Context & Mission',
              '١. سياق التأسيس والرسالة'
            ),
            icon: Compass,
          },
          {
            id: 'education-5050' as SubTabId,
            label: tr(
              '২. শিক্ষা পদ্ধতি ৫০/৫০ ও ভারসাম্য',
              '2. 50/50 Education Method & Balance',
              '٢. منهج التعليم ٥٠/٥٠ والتوازن'
            ),
            icon: Percent,
          },
          {
            id: 'ten-year-plan' as SubTabId,
            label: tr(
              '৩. ১০ বছরের পাঠ পরিকল্পনা',
              '3. 10-Year Study Plan (Nursery–XI)',
              '٣. الخطة الدراسية لـ ١٠ سنوات'
            ),
            icon: Layers,
          },
          {
            id: 'daycare-routine' as SubTabId,
            label: tr(
              '৪. ডে-কেয়ারের দিন ও সময়সূচি',
              '4. Day-Care Daily Routine & Schedule',
              '٤. الروتين اليومي للرعاية النهارية'
            ),
            icon: Clock,
          },
          {
            id: 'transport-landmarks' as SubTabId,
            label: tr(
              '৫. নিজস্ব পরিবহন ও দূরত্ব',
              '5. Campus Transport & Landmarks',
              '٥. النقل المدرسي والمسافات'
            ),
            icon: Bus,
          },
          {
            id: 'admission-uniform-complaints' as SubTabId,
            label: tr(
              `৬. ফি তুলনা, ইউনিফর্ম ও অভিযোগ বক্স (${state.complaints?.length || 0})`,
              `6. Fee Comparison, Uniform & Feedback (${state.complaints?.length || 0})`,
              `٦. مقارنة الرسوم والزي والشكاوى (${state.complaints?.length || 0})`
            ),
            icon: MessageSquareWarning,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                active
                  ? 'bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          SUB-TAB 1: মাদ্রাসা প্রতিষ্ঠার প্রেক্ষাপট ও লক্ষ্য
         ===================================================================== */}
      {activeSubTab === 'preset-context' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-slate-800 p-6 space-y-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {tr(
                  'মাদ্রাসা প্রতিষ্ঠার প্রেক্ষাপট, লক্ষ্য ও উদ্দেশ্য এডিটর',
                  'Founding Context, Mission & Vision Editor',
                  'محرر سياق تأسيس المدرسة والرسالة والرؤية'
                )}
              </h3>
              <p className="text-xs text-slate-500">
                {tr(
                  'প্রতিষ্ঠানের বিস্তারিত প্রেক্ষাপট ও মিশন-ভিশন পরিবর্তন করুন',
                  'Customize the institutional founding background, mission points, and vision statements',
                  'تخصيص خلفية التأسيس ونقاط الرسالة والرؤية للمؤسسة'
                )}
              </p>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => updateMadrasahContextConfig(contextDraft)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>
                  {tr('প্রেক্ষাপট সংরক্ষণ করুন', 'Save Founding Context', 'حفظ سياق التأسيس')}
                </span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {tr('সেকশন ব্যাজ (Badge)', 'Section Badge', 'شارة القسم')}
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={locVal(contextDraft.badgeBn)}
                onChange={(e) => setContextDraft({ ...contextDraft, badgeBn: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {tr('প্রধান শিরোনাম (Heading)', 'Main Heading', 'العنوان الرئيسي')}
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={locVal(contextDraft.headingBn)}
                onChange={(e) => setContextDraft({ ...contextDraft, headingBn: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {tr(
                'প্রেক্ষাপট অনুচ্ছেদসমূহ (প্রতি লাইনে একটি অনুচ্ছেদ)',
                'Context Paragraphs (One paragraph per line)',
                'فقرات السياق (فقرة واحدة في كل سطر)'
              )}
            </label>
            <textarea
              rows={4}
              disabled={!canEdit}
              value={contextDraft.paragraphsBn.map((p) => locVal(p)).join('\n')}
              onChange={(e) =>
                setContextDraft({
                  ...contextDraft,
                  paragraphsBn: e.target.value.split('\n').filter((l) => l.trim().length > 0),
                })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {tr(
                  'আমাদের লক্ষ্য (Mission Points - প্রতি লাইনে একটি)',
                  'Our Mission Points (One item per line)',
                  'نقاط رسالتنا (عنصر واحد في كل سطر)'
                )}
              </label>
              <textarea
                rows={4}
                disabled={!canEdit}
                value={contextDraft.missionPointsBn.map((m) => locVal(m)).join('\n')}
                onChange={(e) =>
                  setContextDraft({
                    ...contextDraft,
                    missionPointsBn: e.target.value.split('\n').filter(Boolean),
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {tr(
                  'আমাদের উদ্দেশ্য ও কর্মপদ্ধতি (Vision Points - প্রতি লাইনে একটি)',
                  'Our Vision & Methodology Points (One item per line)',
                  'نقاط رؤيتنا ومنهجيتنا (عنصر واحد في كل سطر)'
                )}
              </label>
              <textarea
                rows={4}
                disabled={!canEdit}
                value={contextDraft.visionPointsBn.map((v) => locVal(v)).join('\n')}
                onChange={(e) =>
                  setContextDraft({
                    ...contextDraft,
                    visionPointsBn: e.target.value.split('\n').filter(Boolean),
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 2: শিক্ষা পদ্ধতি ৫০/৫০ ও স্তরভেদে বিষয়ের ভারসাম্য
         ===================================================================== */}
      {activeSubTab === 'education-5050' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-slate-800 p-6 space-y-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {tr(
                  'শিক্ষা পদ্ধতি ৫০/৫০ ও স্তরভেদে বিষয়ের ভারসাম্য',
                  '50/50 Education Method & Stage-wise Subject Balance',
                  'منهج التعليم ٥٠/٥٠ وتوازن المواد حسب المرحلة'
                )}
              </h3>
              <p className="text-xs text-slate-500">
                {tr(
                  'কুরআন, আরবি ও সাধারণ শিক্ষার শতকরা হার (%) এবং স্তরের সময়সূচি কাস্টমাইজ করুন',
                  'Customize the percentages (%) of Quran, Arabic, and General Education and stage timings',
                  'تخصيص النسب المئوية للقرآن والعربية والتعليم العام وأوقات المراحل'
                )}
              </p>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => updateEducationMethodConfig(eduDraft)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{tr('সংরক্ষণ করুন', 'Save 50/50 Method', 'حفظ الإعدادات')}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">
                {tr('সেকশন শিরোনাম', 'Section Heading', 'عنوان القسم')}
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={locVal(eduDraft.sectionTitleBn)}
                onChange={(e) => setEduDraft({ ...eduDraft, sectionTitleBn: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">
                {tr('বাম অনুপাত সংখ্যা (যেমন: ৫০)', 'Left Ratio (e.g. 50)', 'النسبة اليسرى (٥٠)')}
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={locVal(eduDraft.ratioLeftBn)}
                onChange={(e) => setEduDraft({ ...eduDraft, ratioLeftBn: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">
                {tr('ডান অনুপাত সংখ্যা (যেমন: ৫০)', 'Right Ratio (e.g. 50)', 'النسبة اليمنى (٥٠)')}
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={locVal(eduDraft.ratioRightBn)}
                onChange={(e) => setEduDraft({ ...eduDraft, ratioRightBn: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">
                {tr('ইসলামি শিক্ষা বিষয়সমূহ', 'Islamic Studies Subjects', 'مواد الدراسات الإسلامية')}
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={locVal(eduDraft.islamicSubjectsBn)}
                onChange={(e) => setEduDraft({ ...eduDraft, islamicSubjectsBn: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">
                {tr('সাধারণ শিক্ষা বিষয়সমূহ', 'General Academic Subjects', 'مواد التعليم العام')}
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={locVal(eduDraft.generalSubjectsBn)}
                onChange={(e) => setEduDraft({ ...eduDraft, generalSubjectsBn: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>
          </div>

          {/* 3 Stages Editor */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              {tr(
                'স্তরভেদে বিষয়ের ভারসাম্য (প্রি-হিফজ, হিফজ, আফটার হিফজ):',
                'Stage-wise Subject Balance (Pre-Hifz, Hifz, After-Hifz):',
                'توازن المواد حسب المرحلة (ما قبل الحفظ، الحفظ، ما بعد الحفظ):'
              )}
            </h4>
            {eduDraft.stages.map((stage, idx) => (
              <div
                key={stage.id}
                className="p-4 rounded-xl bg-purple-50/50 dark:bg-slate-800/60 border border-purple-100 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end"
              >
                <div>
                  <label className="block text-[11px] font-bold mb-1">
                    {tr('স্তরের নাম', 'Stage Name', 'اسم المرحلة')}
                  </label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={locVal(stage.stageNameBn)}
                    onChange={(e) => {
                      const next = [...eduDraft.stages];
                      next[idx] = { ...stage, stageNameBn: e.target.value };
                      setEduDraft({ ...eduDraft, stages: next });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">
                    {tr('শ্রেণি পরিসর', 'Class Range', 'نطاق الصفوف')}
                  </label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={locVal(stage.classRangeBn)}
                    onChange={(e) => {
                      const next = [...eduDraft.stages];
                      next[idx] = { ...stage, classRangeBn: e.target.value };
                      setEduDraft({ ...eduDraft, stages: next });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">
                    {tr('মাদরাসার সময়', 'Class Timing', 'وقت الدراسة')}
                  </label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={locVal(stage.timingBn)}
                    onChange={(e) => {
                      const next = [...eduDraft.stages];
                      next[idx] = { ...stage, timingBn: e.target.value };
                      setEduDraft({ ...eduDraft, stages: next });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">
                    {tr('কুরআন (%)', 'Quran (%)', 'القرآن (%)')}
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={90}
                    disabled={!canEdit}
                    value={stage.quranPercent}
                    onChange={(e) => {
                      const next = [...eduDraft.stages];
                      next[idx] = { ...stage, quranPercent: Number(e.target.value) };
                      setEduDraft({ ...eduDraft, stages: next });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">
                    {tr('আরবি (%)', 'Arabic (%)', 'العربية (%)')}
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={90}
                    disabled={!canEdit}
                    value={stage.arabicPercent}
                    onChange={(e) => {
                      const next = [...eduDraft.stages];
                      next[idx] = { ...stage, arabicPercent: Number(e.target.value) };
                      setEduDraft({ ...eduDraft, stages: next });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">
                    {tr('সাধারণ (%)', 'General (%)', 'العام (%)')}
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={90}
                    disabled={!canEdit}
                    value={stage.generalPercent}
                    onChange={(e) => {
                      const next = [...eduDraft.stages];
                      next[idx] = { ...stage, generalPercent: Number(e.target.value) };
                      setEduDraft({ ...eduDraft, stages: next });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 3: ১০ বছরের পাঠ পরিকল্পনা
         ===================================================================== */}
      {activeSubTab === 'ten-year-plan' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-slate-800 p-6 space-y-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {tr(
                  'নার্সারি থেকে একাদশ: ১০ বছরের পাঠ পরিকল্পনা এডিটর',
                  'Nursery to Class XI: 10-Year Study Plan Editor',
                  'محرر الخطة الدراسية لـ ١٠ سنوات (من الحضانة إلى الصف الحادي عشر)'
                )}
              </h3>
              <p className="text-xs text-slate-500">
                {tr(
                  'স্তরের নাম, শ্রেণির বয়স, কুরআন/আরবি/ইসলাম/সাধারণ ট্র্যাকের বিষয় ও দাখিল/মুতাওয়াসসিতা কার্ড এডিট করুন',
                  'Edit stage names, class ages, and Quran, Arabic, Islamic Studies, and General track blocks',
                  'تعديل أسماء المراحل والأعمار ومسارات القرآن والعربية والدراسات الإسلامية والتعليم العام'
                )}
              </p>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => updateTenYearPlanConfig(planDraft)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>
                  {tr('পাঠ পরিকল্পনা সংরক্ষণ করুন', 'Save 10-Year Plan', 'حفظ الخطة الدراسية')}
                </span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">
                {tr('প্রধান শিরোনাম', 'Main Heading', 'العنوان الرئيسي')}
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={locVal(planDraft.headingBn)}
                onChange={(e) => setPlanDraft({ ...planDraft, headingBn: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">
                {tr('কার্ড শিরোনাম', 'Card Title', 'عنوان البطاقة')}
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={locVal(planDraft.cardTitleBn)}
                onChange={(e) => setPlanDraft({ ...planDraft, cardTitleBn: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>
          </div>

          {/* Track Blocks Editor */}
          <div className="space-y-4">
            <h4 className="text-sm font-extrabold">
              {tr(
                '৪টি মূল ট্র্যাকের বিষয়বস্তু (কুরআন, আরবি, ইসলাম, সাধারণ):',
                '4 Core Curriculum Tracks (Quran, Arabic, Islam, General):',
                'مسارات المنهج الأربعة (القرآن، العربية، الإسلام، العام):'
              )}
            </h4>
            {planDraft.tracks.map((track, tIdx) => (
              <div
                key={track.id}
                className="p-4 rounded-xl bg-purple-50/50 dark:bg-slate-800/60 border border-purple-100 dark:border-slate-700 space-y-3"
              >
                <div className="font-extrabold text-sm text-purple-950 dark:text-white">
                  {tr('ট্র্যাক:', 'Track:', 'المسار:')} {locVal(track.trackNameBn)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  {track.blocks.map((blk, bIdx) => (
                    <div
                      key={blk.id}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        disabled={!canEdit}
                        value={locVal(blk.labelBn)}
                        onChange={(e) => {
                          const nextTracks = [...planDraft.tracks];
                          const nextBlocks = [...track.blocks];
                          nextBlocks[bIdx] = { ...blk, labelBn: e.target.value };
                          nextTracks[tIdx] = { ...track, blocks: nextBlocks };
                          setPlanDraft({ ...planDraft, tracks: nextTracks });
                        }}
                        className="w-full text-xs font-bold bg-transparent border-b border-slate-200 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 shrink-0">
                        Span:{blk.colSpan}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 4: হিফজ ডে-কেয়ারের একটি দিন ও ধাপভেদে সময়
         ===================================================================== */}
      {activeSubTab === 'daycare-routine' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-slate-800 p-6 space-y-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {tr(
                  'হিফজ ডে-কেয়ারের একটি দিন ও সময়সূচি এডিটর',
                  'Hifz Day-Care Daily Routine & Timeline Editor',
                  'محرر الروتين اليومي والجدول الزمني للرعاية النهارية والتحفيظ'
                )}
              </h3>
              <p className="text-xs text-slate-500">
                {tr(
                  'সকাল, দুপুর, বিকাল এবং সন্ধ্যা ও রাতের রুটিন এবং নিচের গ্যান্ট চার্টের সময় পরিবর্তন করুন',
                  'Customize Morning, Noon, Afternoon, and Evening/Night schedule blocks and timeline bars',
                  'تخصيص فترات الصباح والظهر والعصر والمساء والجدول الزمني'
                )}
              </p>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => updateDayCareRoutineConfig(routineDraft)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{tr('রুটিন সংরক্ষণ করুন', 'Save Routine', 'حفظ الروتين')}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {routineDraft.periods.map((period, pIdx) => (
              <div
                key={period.id}
                className="p-4 rounded-xl bg-purple-50/50 dark:bg-slate-800/60 border border-purple-100 dark:border-slate-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-purple-950 dark:text-white">
                    {tr('প্রহর:', 'Period:', 'الفترة:')} {locVal(period.periodNameBn)}
                  </h4>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        const newItem: RoutineActivityItem = {
                          id: `rt-${Date.now()}`,
                          timeBn: '10:00',
                          titleBn: tr('নতুন কার্যক্রম', 'New Activity', 'نشاط جديد'),
                          subtitleBn: '',
                          iconType: 'book',
                        };
                        const nextPeriods = [...routineDraft.periods];
                        nextPeriods[pIdx] = { ...period, items: [...period.items, newItem] };
                        setRoutineDraft({ ...routineDraft, periods: nextPeriods });
                      }}
                      className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />{' '}
                      {tr('আইটেম যোগ করুন', 'Add Activity', 'إضافة نشاط')}
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {period.items.map((item, iIdx) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 grid grid-cols-12 gap-2 items-center"
                    >
                      <input
                        type="text"
                        disabled={!canEdit}
                        value={locVal(item.timeBn)}
                        onChange={(e) => {
                          const nextPeriods = [...routineDraft.periods];
                          const nextItems = [...period.items];
                          nextItems[iIdx] = { ...item, timeBn: e.target.value };
                          nextPeriods[pIdx] = { ...period, items: nextItems };
                          setRoutineDraft({ ...routineDraft, periods: nextPeriods });
                        }}
                        className="col-span-3 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs font-bold"
                        placeholder={tr('সময়', 'Time', 'الوقت')}
                      />
                      <input
                        type="text"
                        disabled={!canEdit}
                        value={locVal(item.titleBn)}
                        onChange={(e) => {
                          const nextPeriods = [...routineDraft.periods];
                          const nextItems = [...period.items];
                          nextItems[iIdx] = { ...item, titleBn: e.target.value };
                          nextPeriods[pIdx] = { ...period, items: nextItems };
                          setRoutineDraft({ ...routineDraft, periods: nextPeriods });
                        }}
                        className="col-span-8 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs"
                        placeholder={tr('কাজের বিবরণ', 'Activity Title', 'وصف النشاط')}
                      />
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextPeriods = [...routineDraft.periods];
                            nextPeriods[pIdx] = {
                              ...period,
                              items: period.items.filter((_, idx) => idx !== iIdx),
                            };
                            setRoutineDraft({ ...routineDraft, periods: nextPeriods });
                          }}
                          className="col-span-1 text-rose-500 hover:text-rose-700 flex justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 5: নিজস্ব পরিবহন রুট, দূরত্ব ও ল্যান্ডমার্ক
         ===================================================================== */}
      {activeSubTab === 'transport-landmarks' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-slate-800 p-6 space-y-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {tr(
                  'নিজস্ব পরিবহন রুট, দূরত্ব, ভাড়া ও ল্যান্ডমার্ক এডিটর',
                  'Campus Transport Routes, Distances, Fares & Landmarks Editor',
                  'محرر مسارات النقل المدرسي والمسافات والرسوم والمعالم'
                )}
              </h3>
              <p className="text-xs text-slate-500">
                {tr(
                  'প্রতিটি রুটের স্টপেজ, দূরত্ব (কি.মি.), মাসিক ভাড়া, গাড়ির ছবি এবং প্রধান স্টেশন থেকে দূরত্ব পরিবর্তন করুন',
                  'Update route stops, distances (km), monthly fares, vehicle image, and landmark distances',
                  'تحديث محطات المسارات والمسافات والرسوم الشهرية وصورة الحافلة'
                )}
              </p>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => updateTransportConfig(transportDraft)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>
                  {tr('পরিবহন তথ্য সংরক্ষণ করুন', 'Save Transport Info', 'حفظ بيانات النقل')}
                </span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">
                {tr(
                  'পরিবহন ছবির লিংক (Vehicle Photo URL)',
                  'Vehicle Photo URL',
                  'رابط صورة الحافلة المدرسية'
                )}
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={transportDraft.vehicleImageUrl}
                onChange={(e) =>
                  setTransportDraft({ ...transportDraft, vehicleImageUrl: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">
                {tr(
                  'প্রতি কি.মি. মাসিক হার (BDT/km)',
                  'Monthly Rate per KM (BDT/km)',
                  'التكلفة الشهرية لكل كيلومتر'
                )}
              </label>
              <input
                type="number"
                disabled={!canEdit}
                value={transportDraft.perKmRate}
                onChange={(e) =>
                  setTransportDraft({ ...transportDraft, perKmRate: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">
                {tr(
                  'প্রধান ল্যান্ডমার্ক ব্যানার',
                  'Primary Landmark Banner',
                  'لافتة المعلم الرئيسي'
                )}
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={locVal(transportDraft.primaryLandmarkBannerBn)}
                onChange={(e) =>
                  setTransportDraft({
                    ...transportDraft,
                    primaryLandmarkBannerBn: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-xs"
              />
            </div>
          </div>

          {/* Routes List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold">
                {tr(
                  `পরিবহন রুট ও স্টপেজ তালিকা (${transportDraft.routes.length}টি):`,
                  `Transport Routes & Stops (${transportDraft.routes.length}):`,
                  `قائمة مسارات النقل والمحطات (${transportDraft.routes.length}):`
                )}
              </h4>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    const newRoute: TransportRouteItem = {
                      id: `route-${Date.now()}`,
                      routeNameBn: tr('নতুন পরিবহন রুট', 'New Transport Route', 'مسار نقل جديد'),
                      vehicleTypeBn: tr('মাইক্রো', 'Microbus', 'حافلة صغيرة'),
                      monthlyFee: 2500,
                      distanceKm: 5,
                      stopsBn: [
                        tr('স্টপেজ ১', 'Stop 1', 'محطة ١'),
                        tr('স্টপেজ ২', 'Stop 2', 'محطة ٢'),
                        tr('স্টপেজ ৩', 'Stop 3', 'محطة ٣'),
                      ],
                      destinationBn: state.settings.instituteNameBn,
                    };
                    setTransportDraft({
                      ...transportDraft,
                      routes: [...transportDraft.routes, newRoute],
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-purple-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />{' '}
                  {tr('নতুন রুট যোগ করুন', 'Add New Route', 'إضافة مسار جديد')}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transportDraft.routes.map((route, rIdx) => (
                <div
                  key={route.id}
                  className="p-4 rounded-xl bg-purple-50/50 dark:bg-slate-800/60 border border-purple-100 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={locVal(route.routeNameBn)}
                      onChange={(e) => {
                        const next = [...transportDraft.routes];
                        next[rIdx] = { ...route, routeNameBn: e.target.value };
                        setTransportDraft({ ...transportDraft, routes: next });
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-extrabold flex-1"
                    />
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setTransportDraft({
                            ...transportDraft,
                            routes: transportDraft.routes.filter((_, idx) => idx !== rIdx),
                          });
                        }}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold">
                        {tr('মাসিক ভাড়া (BDT)', 'Monthly Fare (BDT)', 'الرسوم الشهرية')}
                      </label>
                      <input
                        type="number"
                        disabled={!canEdit}
                        value={route.monthlyFee}
                        onChange={(e) => {
                          const next = [...transportDraft.routes];
                          next[rIdx] = { ...route, monthlyFee: Number(e.target.value) };
                          setTransportDraft({ ...transportDraft, routes: next });
                        }}
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold">
                        {tr('দূরত্ব (কি.মি.)', 'Distance (km)', 'المسافة (كم)')}
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        disabled={!canEdit}
                        value={route.distanceKm}
                        onChange={(e) => {
                          const next = [...transportDraft.routes];
                          next[rIdx] = { ...route, distanceKm: Number(e.target.value) };
                          setTransportDraft({ ...transportDraft, routes: next });
                        }}
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold">
                        {tr('গন্তব্যের নাম', 'Destination', 'الوجهة')}
                      </label>
                      <input
                        type="text"
                        disabled={!canEdit}
                        value={locVal(route.destinationBn)}
                        onChange={(e) => {
                          const next = [...transportDraft.routes];
                          next[rIdx] = { ...route, destinationBn: e.target.value };
                          setTransportDraft({ ...transportDraft, routes: next });
                        }}
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold mb-1">
                      {tr(
                        'স্টপেজসমূহ (কমা `,` দিয়ে আলাদা করুন)',
                        'Stops (Comma `,` separated)',
                        'المحطات (مفصولة بفاصلة)'
                      )}
                    </label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={route.stopsBn.map((s) => locVal(s)).join(', ')}
                      onChange={(e) => {
                        const next = [...transportDraft.routes];
                        next[rIdx] = {
                          ...route,
                          stopsBn: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        };
                        setTransportDraft({ ...transportDraft, routes: next });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 6: ফি তুলনা, ভাইবোন ছাড়, ইউনিফর্ম ও অভিভাবক অভিযোগ বক্স
         ===================================================================== */}
      {activeSubTab === 'admission-uniform-complaints' && (
        <div className="space-y-6">
          {/* Sibling Discount & Fee Comparison Editor */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-slate-800 p-6 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {tr(
                  'সহোদর / ভাইবোন ছাড় ও ইউনিফর্ম গাইড এডিটর',
                  'Sibling Discount & Uniform Guide Editor',
                  'محرر خصم الأشقاء ودليل الزي المدرسي'
                )}
              </h3>
              {canEdit && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateAdmissionExtraConfig(admissionExtraDraft);
                      updateUniformConfig(uniformDraft);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />{' '}
                    {tr('সংরক্ষণ করুন', 'Save Changes', 'حفظ التغييرات')}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">
                  {tr(
                    'ভাইবোন ভর্তি ফি ছাড় (%)',
                    'Sibling Admission Fee Discount (%)',
                    'خصم رسوم القبول للأشقاء (%)'
                  )}
                </label>
                <input
                  type="number"
                  disabled={!canEdit}
                  value={admissionExtraDraft.siblingAdmissionDiscountPercent}
                  onChange={(e) =>
                    setAdmissionExtraDraft({
                      ...admissionExtraDraft,
                      siblingAdmissionDiscountPercent: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  {tr(
                    'ভাইবোন মাসিক টিউশন ফি ছাড় (%)',
                    'Sibling Monthly Tuition Discount (%)',
                    'خصم الرسوم الشهرية للأشقاء (%)'
                  )}
                </label>
                <input
                  type="number"
                  disabled={!canEdit}
                  value={admissionExtraDraft.siblingTuitionDiscountPercent}
                  onChange={(e) =>
                    setAdmissionExtraDraft({
                      ...admissionExtraDraft,
                      siblingTuitionDiscountPercent: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  {tr(
                    'ভাইবোন ছাড়ের শিরোনাম',
                    'Sibling Discount Heading',
                    'عنوان خصم الأشقاء'
                  )}
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={locVal(admissionExtraDraft.siblingDiscountTitleBn)}
                  onChange={(e) =>
                    setAdmissionExtraDraft({
                      ...admissionExtraDraft,
                      siblingDiscountTitleBn: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* Guardian Complaints & Suggestions List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-100 dark:border-slate-800 p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {tr(
                `অভিভাবক অভিযোগ ও পরামর্শ বক্স ইনবক্স (${state.complaints?.length || 0}টি)`,
                `Guardian Feedback & Suggestions Inbox (${state.complaints?.length || 0})`,
                `صندوق شكاوى ومقترحات أولياء الأمور (${state.complaints?.length || 0})`
              )}
            </h3>

            <div className="space-y-3">
              {(state.complaints || []).map((comp) => (
                <div
                  key={comp.id}
                  className="p-4 rounded-xl bg-purple-50/50 dark:bg-slate-800/60 border border-purple-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {locVal(comp.guardianName)}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-900 dark:text-purple-200 font-bold">
                        {locVal(comp.category)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {tr('শিক্ষার্থী:', 'Student:', 'الطالب:')}{' '}
                        {locVal(comp.studentName || '—')} ({locVal(comp.studentClass || '—')}) ·{' '}
                        {tr('ফোন:', 'Phone:', 'الهاتف:')} {comp.phone}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      {locVal(comp.message)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      disabled={!canEdit}
                      value={comp.status}
                      onChange={(e) =>
                        updateComplaintStatus(
                          comp.id,
                          e.target.value as 'New' | 'Reviewed' | 'Resolved'
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
                    >
                      <option value="New">{tr('নতুন (New)', 'New', 'جديد')}</option>
                      <option value="Reviewed">
                        {tr('পর্যালোচিত (Reviewed)', 'Reviewed', 'تمت المراجعة')}
                      </option>
                      <option value="Resolved">
                        {tr('সমাধানকৃত (Resolved)', 'Resolved', 'تم الحل')}
                      </option>
                    </select>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => deleteComplaint(comp.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
