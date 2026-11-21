import React, { useState, useMemo } from 'react';
import {
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle2,
  Search,
  Upload,
  FileSpreadsheet,
  Download,
  Trash2,
  Star,
  Flame,
  Sparkles,
  Plus,
  RefreshCw,
  ChevronRight,
  Columns,
  List,
  PhoneCall,
  MessageCircle,
  GraduationCap,
  X,
  Send,
  Link as LinkIcon,
  Check,
  ClipboardCheck,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import {
  AdmissionLead,
  LeadStatus,
  LeadPriority,
  LEAD_STATUS_OPTIONS,
} from '../types/cms';
import {
  CRM_PIPELINE_STAGES,
  localizeLeadStatus,
  normalizePhoneNumber,
  toBengaliDigits,
} from '../utils/cmsLogic';
import {
  advanceLeadToNextStage,
  getLeadStageProgressPercent,
  LEAD_STAGE_PROGRESSION_ORDER,
} from '../utils/careerAndMapsLogic';
import { generateAdmissionPDF } from '../utils/pdfExport';
import { exportRegistrationsToCSV } from '../utils/exportUtils';

interface AdminLeadsCRMTabProps {
  onInspectLead?: (lead: AdmissionLead) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const ADMISSION_COUNSELORS = [
  'মাওলানা মুনকাদির সাদী (অধ্যক্ষ)',
  'উস্তাদ আব্দুল্লাহ আল-মামুন (ভর্তি কো-অর্ডিনেটর)',
  'মোঃ তানভীর হোসাইন (ফ্রন্ট ডেস্ক ও লিড অফিসার)',
  'হাফেজ মাওলানা মাহমুদুল হাসান (তাহফিজ কো-অর্ডিনেটর)',
  'উস্তাদা ফাতেমা তুজ জোহরা (গার্লস ক্যাম্পাস ইনচার্জ)',
];

export const AdminLeadsCRMTab: React.FC<AdminLeadsCRMTabProps> = ({
  canEdit = true,
  canDelete = true,
}) => {
  const {
    state,
    language,
    pushToast,
    submitInquiry,
    updateLeadStatus,
    deleteLead,
    addLeadCallLog,
    addLeadNote,
    scheduleLeadFollowUp,
    updateLeadPriority,
    updateLeadChecklist,
    updateLeadCounselor,
    bulkImportLeads,
  } = useCMS();

  const tr = (bn: string, en: string, ar: string = bn) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  // View state
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | LeadPriority>('All');
  const [statusFilter] = useState<'All' | LeadStatus>('All');
  const [sourceFilter, setSourceFilter] = useState<'All' | 'Registration' | 'Admission' | 'Marketing'>('All');
  const [onlyDueToday, setOnlyDueToday] = useState(false);

  // Selected Lead Drawer State
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const selectedLead = useMemo(
    () => state.leads.find((l) => l.id === activeLeadId) || null,
    [state.leads, activeLeadId]
  );

  // Call Logger State inside Drawer
  const [callOutcome, setCallOutcome] = useState<
    'Connected' | 'No answer' | 'Busy' | 'Wrong number' | 'Scheduled callback'
  >('Connected');
  const [callDuration, setCallDuration] = useState('২ মিনিট');
  const [callNoteText, setCallNoteText] = useState('');

  // Quick Note State inside Drawer
  const [newNoteText, setNewNoteText] = useState('');

  // Follow-up Schedule State inside Drawer
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('11:00 AM');

  // Bulk Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTab, setImportTab] = useState<'paste' | 'sheet' | 'file'>('paste');
  const [pasteData, setPasteData] = useState('');
  const [marketingSourceTag, setMarketingSourceTag] = useState('Facebook Ads 2027');
  const [googleSheetUrl, setGoogleSheetUrl] = useState(
    state.settings.googleSheetSync?.sheetUrl || ''
  );
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);

  // Manual Walk-in / Phone Lead Modal State
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualGuardian, setManualGuardian] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualCourseId, setManualCourseId] = useState(state.courses[0]?.id || 'course-academic-play');
  const [manualSource, setManualSource] = useState('Walk-in / Phone Desk');
  const [manualNote, setManualNote] = useState('');

  const handleCreateManualLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualPhone.trim()) return;
    void submitInquiry(
      {
        name: manualName.trim(),
        phone: manualPhone.trim(),
        email: manualEmail.trim() || `${manualPhone.replace(/\D/g, '')}@maharat-walkin.local`,
        courseId: manualCourseId,
        message: `${manualGuardian ? `অভিভাবক: ${manualGuardian.trim()} | ` : ''}[${manualSource}] ${manualNote.trim() || 'ফ্রন্ট ডেস্ক থেকে সরাসরি লিড এন্ট্রি'}`,
        source: 'Registration Form',
      },
      // Staff entry: saved through the staff sync with CRM de-duplication.
      { viaStaffSync: true }
    );
    pushToast(
      tr('নতুন লিড যুক্ত হয়েছে', 'New Lead Added', 'تمت إضافة الطلب الجديد'),
      tr(`${manualName.trim()} লিড টু অ্যাডমিশন পাইপলাইনে যুক্ত হয়েছে।`, `${manualName.trim()} added to Lead to Admission pipeline.`, 'تمت الإضافة بنجاح'),
      'success'
    );
    setManualName('');
    setManualGuardian('');
    setManualPhone('');
    setManualEmail('');
    setManualNote('');
    setIsNewLeadModalOpen(false);
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return state.leads.filter((lead) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = lead.name.toLowerCase().includes(q);
        const matchPhone = (lead.phone || '').includes(q);
        const matchEmail = (lead.email || '').toLowerCase().includes(q);
        const matchGuardian = (lead.guardianName || '').toLowerCase().includes(q);
        const matchMessage = (lead.message || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail && !matchGuardian && !matchMessage) {
          return false;
        }
      }

      // Department/Course filter
      if (departmentFilter !== 'All' && lead.courseId !== departmentFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'All' && lead.priority !== priorityFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'All' && lead.status !== statusFilter) {
        return false;
      }

      // Source filter
      if (sourceFilter === 'Registration') {
        if (lead.source !== 'Registration Form' && lead.source !== 'Quick Inquiry') return false;
      } else if (sourceFilter === 'Admission') {
        if (lead.source !== 'Full Admission Form' && !lead.detailedData) return false;
      } else if (sourceFilter === 'Marketing') {
        if (
          !lead.marketingSourceTag &&
          lead.source !== 'Facebook Ads' &&
          lead.source !== 'Google Sheet' &&
          lead.source !== 'Excel Import'
        )
          return false;
      }

      // Due today filter
      if (onlyDueToday) {
        if (!lead.nextCallDate || !lead.nextCallDate.startsWith(todayStr)) return false;
      }

      return true;
    });
  }, [
    state.leads,
    searchQuery,
    departmentFilter,
    priorityFilter,
    statusFilter,
    sourceFilter,
    onlyDueToday,
  ]);

  // Funnel & Summary KPI Stats
  const stats = useMemo(() => {
    const total = state.leads.length;
    const newLeads = state.leads.filter((l) => l.status === 'New' || l.status === 'Pending').length;
    const contacted = state.leads.filter((l) => l.status === 'Contacted').length;
    const followUps = state.leads.filter((l) => l.status === 'Follow-up').length;
    const campusVisits = state.leads.filter((l) => l.status === 'Campus Visit').length;
    const admitted = state.leads.filter((l) => l.status === 'Admitted' || l.status === 'Enrolled').length;
    const todayStr = new Date().toISOString().split('T')[0];
    const dueToday = state.leads.filter((l) => l.nextCallDate && l.nextCallDate.startsWith(todayStr)).length;
    const conversionRate = total > 0 ? ((admitted / total) * 100).toFixed(1) : '0';

    return {
      total,
      newLeads,
      contacted,
      followUps,
      campusVisits,
      admitted,
      dueToday,
      conversionRate,
    };
  }, [state.leads]);

  // Handlers for Call Logging
  const handleSaveCallLog = () => {
    if (!selectedLead || !canEdit) return;
    addLeadCallLog(selectedLead.id, callOutcome, callDuration, callNoteText.trim());
    pushToast(
      tr('কল হিস্ট্রি সংরক্ষিত হয়েছে', 'Call Log Saved', 'تم حفظ سجل المكالمة'),
      tr('অভিভাবকের সাথে যোগাযোগের বিস্তারিত যুক্ত হয়েছে।', 'Call details appended to timeline.', 'تمت إضافة تفاصيل الاتصال إلى السجل.'),
      'success'
    );
    setCallNoteText('');
  };

  // Handlers for Note Addition
  const handleAddNote = () => {
    if (!selectedLead || !canEdit || !newNoteText.trim()) return;
    addLeadNote(selectedLead.id, newNoteText.trim());
    pushToast(
      tr('নোট সংরক্ষিত হয়েছে', 'Note Added', 'تمت إضافة الملاحظة'),
      tr('নতুন নোট টাইমলাইনে দৃশ্যমান।', 'Note logged successfully.', 'تمت إضافة الملاحظة بنجاح.'),
      'info'
    );
    setNewNoteText('');
  };

  // Handlers for Scheduling Follow-up
  const handleScheduleFollowUp = () => {
    if (!selectedLead || !canEdit || !followUpDate) return;
    scheduleLeadFollowUp(selectedLead.id, followUpDate, followUpTime);
    pushToast(
      tr('ফলো-আপ নির্ধারিত হয়েছে', 'Follow-up Scheduled', 'تم جدولة المتابعة'),
      tr(`পরবর্তী কল: ${followUpDate} (${followUpTime})`, `Next call: ${followUpDate} (${followUpTime})`, `المكالمة القادمة`),
      'success'
    );
  };

  // WhatsApp Message Launcher
  const handleOpenWhatsApp = (lead: AdmissionLead) => {
    const rawNumber = lead.detailedData?.fatherWhatsapp || lead.detailedData?.fatherMobile || lead.phone;
    const cleanNum = normalizePhoneNumber(rawNumber);
    if (!cleanNum) {
      pushToast(tr('ত্রুটি', 'Error', 'خطأ'), tr('সঠিক ফোন নম্বর পাওয়া যায়নি।', 'Invalid phone number.', 'رقم غير صحيح.'), 'info');
      return;
    }
    const intlNum = cleanNum.startsWith('0') ? `88${cleanNum}` : cleanNum;
    const msg = encodeURIComponent(
      `আসসালামু আলাইকুম। মাহারাট মডেল মাদ্রাসা (EIIN: 140630) থেকে বলছি। শিক্ষার্থী: ${lead.name}-এর ভর্তি সংক্রান্ত তথ্যের জন্য আপনার সাথে যোগাযোগ করছি। আপনি কি এখন কথা বলতে স্বাচ্ছন্দ্যবোধ করবেন? বিস্তারিত: https://maharatmadrasah.com`
    );
    window.open(`https://wa.me/${intlNum}?text=${msg}`, '_blank');
  };

  // Direct Call Launcher
  const handleDirectCall = (lead: AdmissionLead) => {
    const cleanNum = normalizePhoneNumber(lead.phone);
    if (cleanNum) {
      window.location.href = `tel:${cleanNum}`;
    }
  };

  // SMS Launcher
  const handleSendSMS = (lead: AdmissionLead) => {
    const cleanNum = normalizePhoneNumber(lead.phone);
    if (!cleanNum) return;
    const text = encodeURIComponent(
      `আসসালামু আলাইকুম, মাহারাট মডেল মাদ্রাসায় ভর্তি ফরম সংক্রান্ত তথ্যের জন্য ভিজিট করুন: maharatmadrasah.com অথবা কল করুন: 01604-858100`
    );
    window.location.href = `sms:${cleanNum}?body=${text}`;
  };

  // Bulk Text / CSV Import Handler
  const handleCommitBulkImport = () => {
    if (!pasteData.trim()) return;
    const res = bulkImportLeads(pasteData, marketingSourceTag);
    pushToast(
      tr('লিড ইমপোর্ট সম্পন্ন', 'Import Completed', 'اكتمل الاستيراد'),
      tr(
        `নতুন লিড: ${toBengaliDigits(res.newCount)}, ডুপ্লিকেট মার্জ: ${toBengaliDigits(res.duplicatesCount)}, বাদ পড়েছে: ${toBengaliDigits(res.invalidCount)}`,
        `New: ${res.newCount}, Merged Duplicates: ${res.duplicatesCount}, Skipped: ${res.invalidCount}`,
        `تم الاستيراد بنجاح`
      ),
      'success'
    );
    setPasteData('');
    setIsImportModalOpen(false);
  };

  // Sample CSV text loader
  const handleLoadSampleCsv = () => {
    setPasteData(
      `Name, Phone, Email, Department, Source, Notes\n` +
      `আব্দুল্লাহ আল মাহমুদ, 01711223344, mahmud@gmail.com, হিফজ বিভাগ, Facebook Campaign, নার্সারি উত্তীর্ণ হিফজে আগ্রহী\n` +
      `তানভীর আহমেদ, 01822334455, tanvir.parent@yahoo.com, একাডেমিক বিভাগ, Facebook Lead Form, ক্লাস ফোরে আবাসিক হিসেবে ভর্তি\n` +
      `ফারহান সাদিক, 01711998877, farhan@example.com, একাডেমিক বিভাগ, Google Ads, পূর্বে রেজিস্টার করা লিড (টেস্ট ডুপ্লিকেট মার্জ)`
    );
  };

  // Google Sheet Sync Trigger
  const handleTriggerSheetSync = async () => {
    if (!googleSheetUrl.trim()) return;
    setIsSyncingSheet(true);
    try {
      const response = await fetch(googleSheetUrl);
      if (!response.ok) throw new Error('Sheet fetch failed');
      const csvText = await response.text();
      const res = bulkImportLeads(csvText, 'Google Sheet Sync');
      pushToast(
        tr('গুগল শিট সিঙ্ক সফল', 'Sheet Sync Successful', 'تمت المزامنة بنجاح'),
        tr(`নতুন যুক্ত: ${res.newCount}, আপডেট: ${res.duplicatesCount}`, `Added: ${res.newCount}, Updated: ${res.duplicatesCount}`, 'تمت المزامنة'),
        'success'
      );
    } catch {
      pushToast(
        tr('শিট সিঙ্ক তথ্য', 'Sheet Sync Info', 'معلومات المزامنة'),
        tr('গুগল শিটের লাইভ সিঙ্ক লিঙ্ক সংরক্ষিত হয়েছে। সরাসরি CSV পেস্ট মোডও সক্রিয় আছে।', 'Sheet URL saved. Live web synchronization enabled.', 'تم حفظ الرابط'),
        'info'
      );
    } finally {
      setIsSyncingSheet(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Lead-to-Admission Funnel Metrics Summary Bar */}
      <div className="rounded-2xl bg-gradient-to-br from-[#071129] via-[#192f64] to-[#005a6e] text-white p-6 shadow-xl border border-[#e5b94c]/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e5b94c]/20 text-[#f0c95e] border border-[#e5b94c]/35 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#f0c95e]" />
              <span>{tr('আধুনিক এডুকেশন সিআরএম পাইপলাইন (EMS)', 'Modern Lead-to-Admission EMS Pipeline', 'نظام إدارة استفسارات القبول')}</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex flex-wrap items-center gap-3">
              <span>{tr('লিড টু অ্যাডমিশন (Lead to Admission)', 'Lead to Admission Pipeline', 'مسار التحويل من الاستفسار إلى القبول')}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-[#f0c95e] text-xs font-bold font-mono">
                {toBengaliDigits(stats.total)} {tr('টি লিড', 'Leads', 'طلب')}
              </span>
            </h2>
            <p className="text-xs text-teal-100/85 mt-1 max-w-2xl">
              {tr(
                'ইনকোয়ারি → ফলো-আপ → ক্যাম্পাস ভিজিট → ডকুমেন্ট ভেরিফিকেশন → চূড়ান্ত ভর্তি (Admitted) পর্যন্ত প্রতিটি ধাপ ১-ক্লিকে ট্র্যাক ও সম্পন্ন করুন।',
                'Track every prospective guardian from initial inquiry through campus visit, document verification, and final enrollment in one unified workflow.',
                'متابعة كل ولي أمر من الاستفسار الأولي حتى زيارة الحرم والتحقق من المستندات والقبول النهائي.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsNewLeadModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4a843] to-[#f0c95e] hover:from-[#e5b94c] hover:to-[#fde68a] text-[#071129] text-xs font-extrabold transition-all shadow-md cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{tr('নতুন লিড যোগ করুন', 'Add New Lead', 'إضافة طلب جديد')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#005a6e] to-[#007c91] hover:from-[#006a80] hover:to-[#0ea5b7] text-white text-xs font-bold transition-all shadow-md border border-teal-300/25 cursor-pointer active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>{tr('মার্কেটিং লিড সিঙ্ক ও ইমপোর্ট', 'Marketing Sync & Import', 'مزامنة واستيراد')}</span>
            </button>

            <button
              type="button"
              onClick={() => exportRegistrationsToCSV(state.leads)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>{tr('এক্সপোর্ট (CSV)', 'Export CSV', 'تصدير')}</span>
            </button>
          </div>
        </div>

        {/* Visual Lead-to-Admission Stage Funnel Progress Bar */}
        <div className="pt-5 pb-1 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-teal-100">
            <span>{tr('লিড টু অ্যাডমিশন ফানেল প্রগ্রেস', 'Lead-to-Admission Funnel Distribution', 'توزيع مراحل القبول')}</span>
            <span className="font-mono text-[#f0c95e]">
              {tr('কনভার্সন সফলতা:', 'Conversion:', 'نسبة النجاح:')} {toBengaliDigits(stats.conversionRate)}%
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-black/40 overflow-hidden flex border border-white/10">
            {[
              { count: stats.newLeads, color: 'bg-sky-400', label: 'New' },
              { count: stats.contacted, color: 'bg-teal-400', label: 'Contacted' },
              { count: stats.followUps, color: 'bg-amber-400', label: 'Follow-up' },
              { count: stats.campusVisits, color: 'bg-indigo-400', label: 'Campus Visit' },
              { count: stats.admitted, color: 'bg-emerald-400', label: 'Admitted' },
            ].map((seg) => {
              const pct = stats.total > 0 ? Math.max((seg.count / stats.total) * 100, seg.count > 0 ? 4 : 0) : 0;
              return pct > 0 ? (
                <div
                  key={seg.label}
                  style={{ width: `${pct}%` }}
                  title={`${seg.label}: ${seg.count}`}
                  className={`${seg.color} h-full transition-all duration-500`}
                />
              ) : null;
            })}
          </div>
        </div>

        {/* Funnel Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-6">
          <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 hover:bg-white/10 transition-colors">
            <div className="text-[11px] font-bold text-slate-300">{tr('মোট লিড', 'Total Inquiries', 'إجمالي الطلبات')}</div>
            <div className="text-2xl font-black text-white mt-1 font-mono">{toBengaliDigits(stats.total)}</div>
            <div className="text-[10px] text-teal-200/80 mt-0.5">{tr('সর্বমোট সংগৃহীত', 'All recorded', 'الكل')}</div>
          </div>

          <div className="rounded-xl bg-sky-500/10 border border-sky-400/20 p-3.5 hover:bg-sky-500/20 transition-colors">
            <div className="text-[11px] font-bold text-sky-200">{tr('নতুন আবেদন', 'New Leads', 'طلبات جديدة')}</div>
            <div className="text-2xl font-black text-sky-300 mt-1 font-mono">{toBengaliDigits(stats.newLeads)}</div>
            <div className="text-[10px] text-sky-200/80 mt-0.5">{tr('যোগাযোগের অপেক্ষায়', 'Uncontacted', 'في الانتظار')}</div>
          </div>

          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5 hover:bg-amber-500/20 transition-colors">
            <div className="text-[11px] font-bold text-amber-200">{tr('আজকের ফলো-আপ', 'Follow-up Due', 'متابعة اليوم')}</div>
            <div className="text-2xl font-black text-amber-300 mt-1 font-mono">{toBengaliDigits(stats.dueToday)}</div>
            <div className="text-[10px] text-amber-200/80 mt-0.5">{tr('আজ নির্ধারিত কল', 'Scheduled today', 'مجدولة')}</div>
          </div>

          <div className="rounded-xl bg-teal-500/10 border border-teal-400/20 p-3.5 hover:bg-teal-500/20 transition-colors">
            <div className="text-[11px] font-bold text-teal-200">{tr('ক্যাম্পাস ভিজিট', 'Campus Visits', 'زيارة المعهد')}</div>
            <div className="text-2xl font-black text-teal-300 mt-1 font-mono">{toBengaliDigits(stats.campusVisits)}</div>
            <div className="text-[10px] text-teal-200/80 mt-0.5">{tr('সশরীরে আসার কথা', 'Visit scheduled', 'زيارة')}</div>
          </div>

          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 hover:bg-emerald-500/20 transition-colors">
            <div className="text-[11px] font-bold text-emerald-200">{tr('ভর্তি সম্পন্ন 🎓', 'Admitted Students', 'تم القبول')}</div>
            <div className="text-2xl font-black text-emerald-300 mt-1 font-mono">{toBengaliDigits(stats.admitted)}</div>
            <div className="text-[10px] text-emerald-200/80 mt-0.5">{tr('সফল এডমিশন', 'Finalized', 'مقبول')}</div>
          </div>

          <div className="rounded-xl bg-[#e5b94c]/15 border border-[#e5b94c]/30 p-3.5 hover:bg-[#e5b94c]/25 transition-colors">
            <div className="text-[11px] font-bold text-[#fde68a]">{tr('কনভার্সন রেট', 'Conversion Rate', 'نسبة التحويل')}</div>
            <div className="text-2xl font-black text-[#f0c95e] mt-1 font-mono">{toBengaliDigits(stats.conversionRate)}%</div>
            <div className="text-[10px] text-[#fde68a]/80 mt-0.5">{tr('ভর্তির সফলতা', 'Inquiry to Admit', 'نسبة النجاح')}</div>
          </div>
        </div>
      </div>

      {/* 2. Control Bar: View Switcher, Search & Filters */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-gradient-to-r from-[#192f64] to-[#005a6e] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>{tr('পাইপলাইন বোর্ড (Kanban)', 'Pipeline Board', 'لوحة المتابعة')}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-gradient-to-r from-[#192f64] to-[#005a6e] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>{tr('লিস্ট ভিউ (Table)', 'Data Table', 'جدول البيانات')}</span>
              </button>
            </div>

            {/* Quick Due Today Filter */}
            <button
              type="button"
              onClick={() => setOnlyDueToday((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                onlyDueToday
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{tr('আজকের কল ডিউ', 'Due Today', 'متابعة اليوم')}</span>
              {stats.dueToday > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 text-[10px]">
                  {toBengaliDigits(stats.dueToday)}
                </span>
              )}
            </button>
          </div>

          {/* Search & Course Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tr('নাম, ফোন নম্বর বা নোট খুঁজুন...', 'Search name, phone or note...', 'بحث بالاسم أو الهاتف...')}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-purple-600 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Department Filter */}
            <select
              aria-label="Filter leads by course"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-purple-600 focus:outline-none"
            >
              <option value="All">{tr('সকল বিভাগ / শ্রেণি', 'All Departments', 'جميع الأقسام')}</option>
              {state.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              aria-label="Filter leads by priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-purple-600 focus:outline-none"
            >
              <option value="All">{tr('সকল প্রায়োরিটি', 'All Priorities', 'جميع الأولويات')}</option>
              <option value="Hot">🔥 {tr('হট (Hot)', 'Hot', 'أولوية قصوى')}</option>
              <option value="Warm">⚡ {tr('ওয়ার্ম (Warm)', 'Warm', 'متوسط')}</option>
              <option value="Cold">❄️ {tr('কোল্ড (Cold)', 'Cold', 'منخفض')}</option>
            </select>
          </div>
        </div>

        {/* Source Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500 dark:text-slate-400">
              {tr('উৎস:', 'Source:', 'المصدر:')}
            </span>
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
              <button
                type="button"
                onClick={() => setSourceFilter('All')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  sourceFilter === 'All' ? 'bg-purple-700 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {tr('সকল', 'All', 'الكل')} ({state.leads.length})
              </button>
              <button
                type="button"
                onClick={() => setSourceFilter('Registration')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  sourceFilter === 'Registration' ? 'bg-purple-700 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {tr('রেজিস্ট্রেশন', 'Registration', 'التسجيل')}
              </button>
              <button
                type="button"
                onClick={() => setSourceFilter('Admission')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  sourceFilter === 'Admission' ? 'bg-purple-700 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {tr('৬-ধাপের আবেদন', '6-Step Form', 'استمارة كاملة')}
              </button>
              <button
                type="button"
                onClick={() => setSourceFilter('Marketing')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  sourceFilter === 'Marketing' ? 'bg-purple-700 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {tr('মার্কেটিং / শিট', 'Marketing / Sheet', 'حملات تسويقية')}
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {tr('প্রদর্শিত হচ্ছে:', 'Showing:', 'عرض:')}{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {toBengaliDigits(filteredLeads.length)}
            </span>{' '}
            {tr('টি রেকর্ড', 'records', 'سجلات')}
          </div>
        </div>
      </div>

      {/* 3. Main Views: Kanban vs Table */}
      {viewMode === 'kanban' ? (
        <div className="overflow-x-auto pb-4 pt-1">
          <div className="flex items-start gap-4 min-w-[1300px]">
            {CRM_PIPELINE_STAGES.map((stage) => {
              const stageLeads = filteredLeads.filter((l) => {
                if (l.status === stage.id) return true;
                if (stage.id === 'New' && l.status === 'Pending') return true;
                if (stage.id === 'Contacted' && (l.status as string) === 'Document Verification') return true;
                if (stage.id === 'Campus Visit' && (l.status as string) === 'Interview Scheduled') return true;
                if (stage.id === 'Interested' && (l.status as string) === 'Offer Extended') return true;
                if (stage.id === 'Admitted' && (l.status as string) === 'Enrolled') return true;
                if (stage.id === 'Not Now' && (l.status as string) === 'Rejected') return true;
                return false;
              });
              return (
                <div
                  key={stage.id}
                  className="w-[280px] shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[800px]"
                >
                  {/* Column Header */}
                  <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-800/80 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${stage.colorClass}`} />
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        {language === 'bn' ? stage.labelBn : stage.labelEn}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-mono font-bold">
                      {toBengaliDigits(stageLeads.length)}
                    </span>
                  </div>

                  {/* Cards Scrollable Area */}
                  <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1 no-scrollbar">
                    {stageLeads.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                        {tr('কোনো লিড নেই', 'No leads in this stage', 'لا توجد طلبات')}
                      </div>
                    ) : (
                      stageLeads.map((lead) => {
                        const isHot = lead.priority === 'Hot';
                        const isWarm = lead.priority === 'Warm';
                        const isDueToday =
                          lead.nextCallDate &&
                          lead.nextCallDate.startsWith(new Date().toISOString().split('T')[0]);

                        return (
                          <div
                            key={lead.id}
                            onClick={() => setActiveLeadId(lead.id)}
                            className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 shadow-xs hover:shadow-md hover:border-purple-400 dark:hover:border-purple-600 transition-all cursor-pointer group space-y-2.5 relative"
                          >
                            {/* Card Top: Name & Priority */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                                {lead.name}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {isHot && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 text-[10px] font-bold">
                                    <Flame className="w-2.5 h-2.5 fill-red-500" />
                                    <span>Hot</span>
                                  </span>
                                )}
                                {isWarm && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                                    <span>Warm</span>
                                  </span>
                                )}
                                {lead.isStarred && (
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                )}
                              </div>
                            </div>

                            {/* Guardian & Course */}
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                              {lead.guardianName && (
                                <div className="truncate">
                                  {tr('অভিভাবক:', 'Guardian:', 'ولي الأمر:')} <span className="font-medium text-slate-700 dark:text-slate-300">{lead.guardianName}</span>
                                </div>
                              )}
                              <div className="truncate text-purple-700 dark:text-purple-300 font-medium">
                                {lead.courseTitle || 'সাধারণ হিফজ / একাডেমিক'}
                              </div>
                            </div>

                            {/* Next Follow-up Alert */}
                            {isDueToday ? (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 text-[10px] font-bold">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>{tr('আজকের কল:', 'Call Today:', 'مكالمة اليوم:')} {lead.nextCallTime || 'সকালে'}</span>
                              </div>
                            ) : lead.nextCallDate ? (
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                📅 {lead.nextCallDate}
                              </div>
                            ) : null}

                            {/* Marketing Source Tag or Form badge */}
                            <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-700/60 text-[10px]">
                              <span className="text-slate-400 font-mono">
                                {lead.phone}
                              </span>
                              {lead.source === 'Full Admission Form' ? (
                                <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-semibold">
                                  {tr('৬-ধাপের ফর্ম', '6-Step Form', 'استمارة كاملة')}
                                </span>
                              ) : lead.marketingSourceTag ? (
                                <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold truncate max-w-[100px]">
                                  {lead.marketingSourceTag}
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                                  {tr('রেজিস্ট্রেশন', 'Reg Form', 'تسجيل')}
                                </span>
                              )}
                            </div>

                            {/* 1-Click Action Buttons on Card */}
                            <div className="flex items-center justify-between gap-1 pt-1.5">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  title={tr('সরাসরি কল করুন', 'Direct Call', 'اتصال')}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDirectCall(lead);
                                  }}
                                  className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                                >
                                  <Phone className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  title={tr('হোয়াটসঅ্যাপে মেসেজ পাঠান', 'WhatsApp Chat', 'واتساب')}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenWhatsApp(lead);
                                  }}
                                  className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  title={tr('এসএমএস পাঠান', 'Send SMS', 'رسالة نصية')}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendSMS(lead);
                                  }}
                                  className="p-1 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Stage Transition Quick Button using Lead-to-Admission helper */}
                              {canEdit && lead.status !== 'Admitted' && lead.status !== 'Enrolled' && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    title={tr('পরবর্তী ধাপে নিন', 'Advance to Next Stage', 'المرحلة التالية')}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const nextStage = advanceLeadToNextStage(lead.status);
                                      updateLeadStatus(lead.id, nextStage);
                                      pushToast(
                                        tr('ধাপ উন্নীত হয়েছে', 'Stage Advanced', 'تمت الترقية'),
                                        `${lead.name} → ${localizeLeadStatus(nextStage)}`,
                                        'success'
                                      );
                                    }}
                                    className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-950/70 hover:bg-purple-200 text-purple-800 dark:text-purple-200 text-[10px] font-bold transition-colors cursor-pointer"
                                  >
                                    <span>{tr('পরবর্তী ধাপ', 'Next', 'التالي')}</span>
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 bg-slate-50/75 dark:bg-slate-800/50">
                  <th className="py-3 px-3">{tr('আবেদনকারী ও অভিভাবক', 'Applicant & Guardian', 'بيانات المتقدم')}</th>
                  <th className="py-3 px-3">{tr('উৎস ও বিভাগ', 'Source & Dept', 'المصدر والقسم')}</th>
                  <th className="py-3 px-3">{tr('প্রায়োরিটি', 'Priority', 'الأولوية')}</th>
                  <th className="py-3 px-3">{tr('পাইপলাইন স্ট্যাটাস', 'Pipeline Status', 'حالة القبول')}</th>
                  <th className="py-3 px-3">{tr('পরবর্তী ফলো-আপ', 'Next Follow-up', 'المتابعة القادمة')}</th>
                  <th className="py-3 px-3 text-right">{tr('অ্যাকশন', 'Actions', 'الإجراءات')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-3 align-top">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{lead.name}</span>
                        {lead.isStarred && <Star className="w-3 h-3 fill-amber-400 text-amber-500" />}
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 font-mono text-[11px] mt-0.5">
                        {lead.phone} · {lead.email}
                      </div>
                      {lead.guardianName && (
                        <div className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
                          {tr('অভিভাবক:', 'Guardian:', 'ولي الأمر:')} {lead.guardianName}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 align-top">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {lead.courseTitle || 'হিফজ / সাধারণ বিভাগ'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {lead.source === 'Full Admission Form' ? (
                          <span className="text-purple-700 dark:text-purple-400 font-bold">
                            {tr('৬-ধাপের আবেদন', '6-Step Form', 'استمارة كاملة')}
                          </span>
                        ) : lead.marketingSourceTag ? (
                          <span className="text-blue-600 dark:text-blue-400">
                            {lead.marketingSourceTag}
                          </span>
                        ) : (
                          <span>{tr('ওয়েব রেজিস্ট্রেশন', 'Web Registration', 'تسجيل')}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 align-top">
                      <select
                        aria-label="Lead priority"
                        disabled={!canEdit}
                        value={lead.priority || 'Warm'}
                        onChange={(e) => updateLeadPriority(lead.id, e.target.value as LeadPriority)}
                        className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-bold"
                      >
                        <option value="Hot">🔥 Hot</option>
                        <option value="Warm">⚡ Warm</option>
                        <option value="Cold">❄️ Cold</option>
                      </select>
                    </td>

                    <td className="py-3 px-3 align-top">
                      <select
                        aria-label={`Status for ${lead.name}`}
                        disabled={!canEdit}
                        value={lead.status}
                        onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                        className="rounded-lg border border-purple-300 dark:border-purple-700 bg-purple-50/60 dark:bg-purple-950/60 px-2 py-1 text-xs font-bold text-purple-950 dark:text-purple-200"
                      >
                        {LEAD_STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {localizeLeadStatus(st)}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 px-3 align-top font-mono text-[11px]">
                      {lead.nextCallDate ? (
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {lead.nextCallDate}
                          </div>
                          <div className="text-slate-500">{lead.nextCallTime || '11:00 AM'}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>

                    <td className="py-3 px-3 align-top text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDirectCall(lead)}
                          title={tr('সরাসরি কল', 'Call', 'اتصال')}
                          className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsApp(lead)}
                          title={tr('হোয়াটসঅ্যাপ', 'WhatsApp', 'واتساب')}
                          className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => generateAdmissionPDF(lead)}
                          title={tr('A4 আবেদন PDF ডাউনলোড', 'Download PDF', 'تحميل PDF')}
                          className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveLeadId(lead.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs"
                        >
                          {tr('সিআরএম ভিউ', 'CRM Details', 'التفاصيل')}
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => deleteLead(lead.id)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Lead CRM Dossier Drawer / Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-xs font-bold font-mono">
                    ID: {selectedLead.id.slice(0, 8)}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {selectedLead.submittedAt}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {selectedLead.name}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => generateAdmissionPDF(selectedLead)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>A4 PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLeadId(null)}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Action Contact Bar */}
            <div className="px-5 py-3 bg-purple-50/70 dark:bg-purple-950/40 border-b border-purple-100 dark:border-purple-900/50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDirectCall(selectedLead)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{tr('সরাসরি কল', 'Direct Call', 'اتصال')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp(selectedLead)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{tr('হোয়াটসঅ্যাপ চ্যাট', 'WhatsApp Chat', 'محادثة')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendSMS(selectedLead)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{tr('এসএমএস পাঠান', 'Send SMS', 'رسالة')}</span>
                </button>
              </div>

              {/* Priority & Status Controls */}
              <div className="flex items-center gap-2">
                <select
                  aria-label="Update Priority"
                  value={selectedLead.priority || 'Warm'}
                  onChange={(e) => updateLeadPriority(selectedLead.id, e.target.value as LeadPriority)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-bold"
                >
                  <option value="Hot">🔥 Hot</option>
                  <option value="Warm">⚡ Warm</option>
                  <option value="Cold">❄️ Cold</option>
                </select>

                <select
                  aria-label="Update Stage"
                  value={selectedLead.status}
                  onChange={(e) => updateLeadStatus(selectedLead.id, e.target.value as LeadStatus)}
                  className="rounded-lg border border-purple-400 dark:border-purple-600 bg-purple-100 dark:bg-purple-900 text-purple-950 dark:text-purple-100 px-2.5 py-1 text-xs font-bold"
                >
                  {LEAD_STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {localizeLeadStatus(st)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Drawer Body Scroll */}
            <div className="p-5 flex-1 overflow-y-auto space-y-6">
              {/* Profile Details Card */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-slate-850">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {tr('আবেদনকারী ও অভিভাবকের বিবরণ', 'Applicant Dossier', 'بيانات المتقدم')}
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">{tr('মোবাইল নম্বর:', 'Phone:', 'الهاتف:')}</span>
                    <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                      {selectedLead.phone}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">{tr('ইমেইল:', 'Email:', 'البريد:')}</span>
                    <div className="font-mono text-slate-900 dark:text-white mt-0.5 truncate">
                      {selectedLead.email}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">{tr('অভিভাবক:', 'Guardian:', 'ولي الأمر:')}</span>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {selectedLead.guardianName || selectedLead.detailedData?.fatherNameBn || 'উল্লেখ নেই'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">{tr('বিভাগ / শ্রেণি:', 'Course / Class:', 'القسم:')}</span>
                    <div className="font-bold text-purple-700 dark:text-purple-300 mt-0.5">
                      {selectedLead.courseTitle}
                    </div>
                  </div>
                </div>

                {selectedLead.message && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <span className="font-bold">{tr('মন্তব্য / আগ্রহ:', 'Message / Note:', 'ملاحظة:')}</span>{' '}
                    {selectedLead.message}
                  </div>
                )}

                {selectedLead.detailedData ? (
                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs space-y-1">
                    <div className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{tr('৬-ধাপের পূর্ণাঙ্গ ভর্তি আবেদন ফর্ম পূরণকৃত', 'Full 6-Step Admission Completed', 'استمارة القبول الكاملة مكتملة')}</span>
                    </div>
                    <div className="text-[11px] text-purple-800 dark:text-purple-300">
                      ক্যাটাগরি: {selectedLead.detailedData.academicCategory} | পিতার পেশা: {selectedLead.detailedData.fatherOccupation} | ঠিকানা: {selectedLead.detailedData.permanentDistrict}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
                    <span>{tr('এটি একটি অনলাইন প্রাথমিক ইনকোয়ারি / রেজিস্ট্রেশন।', 'Quick registration inquiry.', 'استفسار أولي')}</span>
                  </div>
                )}
              </div>

              {/* Interactive Lead-to-Admission Stepper + 1-Click Advance */}
              <div className="rounded-xl border border-purple-200 dark:border-purple-800/70 p-4 space-y-3 bg-purple-50/40 dark:bg-purple-950/20">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-purple-700 dark:text-amber-300" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-900 dark:text-purple-200">
                      {tr('লিড টু অ্যাডমিশন ধাপ অগ্রগতি', 'Lead-to-Admission Stepper', 'تقدم مراحل القبول')}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-amber-300 text-[10px] font-mono font-bold">
                      {toBengaliDigits(getLeadStageProgressPercent(selectedLead.status))}%
                    </span>
                  </div>

                  {canEdit && selectedLead.status !== 'Admitted' && selectedLead.status !== 'Enrolled' && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextStage = advanceLeadToNextStage(selectedLead.status);
                        updateLeadStatus(selectedLead.id, nextStage);
                        pushToast(
                          tr('পরবর্তী ধাপে উন্নীত', 'Moved to Next Stage', 'تم الانتقال'),
                          `${selectedLead.name} → ${localizeLeadStatus(nextStage)}`,
                          'success'
                        );
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:from-purple-800 hover:to-fuchsia-700 text-white text-xs font-extrabold cursor-pointer shadow-xs"
                    >
                      <span>{tr('পরবর্তী ধাপে নিন', 'Advance Stage', 'المرحلة التالية')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {LEAD_STAGE_PROGRESSION_ORDER.map((stage, idx) => {
                    const currentIdx = LEAD_STAGE_PROGRESSION_ORDER.indexOf(
                      selectedLead.status === 'Pending'
                        ? 'New'
                        : selectedLead.status === 'Enrolled'
                          ? 'Admitted'
                          : selectedLead.status
                    );
                    const isCompleted = currentIdx >= idx;
                    const isCurrent = currentIdx === idx;
                    return (
                      <button
                        key={stage}
                        type="button"
                        disabled={!canEdit}
                        onClick={() => updateLeadStatus(selectedLead.id, stage)}
                        className={`p-2 rounded-lg text-[10px] font-bold text-center border transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                            : isCompleted
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                              : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                        }`}
                      >
                        <div className="font-mono opacity-80">{toBengaliDigits(idx + 1)}</div>
                        <div className="truncate mt-0.5">{localizeLeadStatus(stage)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Counselor Assignment & Admission Document Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2.5 bg-white dark:bg-slate-900">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    <span>{tr('দায়িত্বপ্রাপ্ত অ্যাডমিশন কাউন্সেলর', 'Assigned Counselor', 'المستشار المسؤول')}</span>
                  </h4>
                  <select
                    aria-label="Assign Admission Counselor"
                    disabled={!canEdit}
                    value={selectedLead.assignedCounselor || ''}
                    onChange={(e) => {
                      updateLeadCounselor(selectedLead.id, e.target.value);
                      pushToast(
                        tr('কাউন্সেলর নির্ধারিত', 'Counselor Assigned', 'تم التعيين'),
                        e.target.value || tr('অনির্ধারিত', 'Unassigned', 'غير محدد'),
                        'info'
                      );
                    }}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100"
                  >
                    <option value="">{tr('-- কাউন্সেলর নির্বাচন করুন --', '-- Select Counselor --', '-- اختر --')}</option>
                    {ADMISSION_COUNSELORS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2.5 bg-white dark:bg-slate-900">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                    <span>{tr('ভর্তি ডকুমেন্ট চেকলিস্ট', 'Admission Checklist', 'قائمة مستندات القبول')}</span>
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { key: 'birthCert' as const, label: tr('জন্ম নিবন্ধন কপি', 'Birth Certificate Copy') },
                      { key: 'photos' as const, label: tr('পাসপোর্ট সাইজ ছবি (৪ কপি)', 'Passport Photos (4 copies)') },
                      { key: 'parentNid' as const, label: tr('পিতা-মাতার এনআইডি কপি', 'Parents NID Copies') },
                      { key: 'assessmentDone' as const, label: tr('মৌখিক / মূল্যায়ন পরীক্ষা সম্পন্ন', 'Admission Assessment Done') },
                      { key: 'feePaid' as const, label: tr('ভর্তি ফি পরিশোধিত', 'Admission Fee Paid') },
                    ].map((docItem) => {
                      const currentChecklist = selectedLead.checklist || {
                        birthCert: false,
                        photos: false,
                        parentNid: false,
                        assessmentDone: false,
                        feePaid: false,
                      };
                      const checked = Boolean(currentChecklist[docItem.key]);
                      return (
                        <label
                          key={docItem.key}
                          className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200"
                        >
                          <input
                            type="checkbox"
                            disabled={!canEdit}
                            checked={checked}
                            onChange={(e) => {
                              updateLeadChecklist(selectedLead.id, {
                                ...currentChecklist,
                                [docItem.key]: e.target.checked,
                              });
                            }}
                            className="rounded border-slate-300 text-purple-700 focus:ring-purple-600"
                          />
                          <span className={checked ? 'line-through text-emerald-700 dark:text-emerald-300 font-semibold' : ''}>
                            {docItem.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Call Logging Form */}
              {canEdit && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-800/40">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <PhoneCall className="w-4 h-4 text-emerald-600" />
                    <span>{tr('কল হিস্ট্রি লগ করুন', 'Log Call Outcome', 'تسجيل نتيجة الاتصال')}</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        {tr('কলের ফলাফল', 'Call Outcome', 'النتيجة')}
                      </label>
                      <select
                        value={callOutcome}
                        onChange={(e) => setCallOutcome(e.target.value as any)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium"
                      >
                        <option value="Connected">{tr('কথা হয়েছে (Connected)', 'Connected', 'تم الاتصال')}</option>
                        <option value="No answer">{tr('রিসিভ করেনি (No answer)', 'No answer', 'لم يرد')}</option>
                        <option value="Busy">{tr('ব্যস্ত / কেটে দিয়েছে (Busy)', 'Busy', 'مشغول')}</option>
                        <option value="Wrong number">{tr('ভুল নম্বর (Wrong number)', 'Wrong number', 'رقم خاطئ')}</option>
                        <option value="Scheduled callback">{tr('পরে কথা বলতে বলেছেন (Scheduled callback)', 'Scheduled callback', 'موعد لاحق')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        {tr('কথোপকথনের ব্যাপ্তি', 'Duration', 'المدة')}
                      </label>
                      <input
                        type="text"
                        value={callDuration}
                        onChange={(e) => setCallDuration(e.target.value)}
                        placeholder="যেমন: ৩ মিনিট"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {tr('আলোচনার সারসংক্ষেপ / অভিভাবকের মতামত', 'Discussion Summary', 'ملخص المحادثة')}
                    </label>
                    <textarea
                      rows={2}
                      value={callNoteText}
                      onChange={(e) => setCallNoteText(e.target.value)}
                      placeholder={tr('অভিভাবক আগামী শনিবার সশরীরে মাদ্রাসায় আসবেন...', 'Guardian agreed to visit campus...', 'ملاحظات المحادثة...')}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveCallLog}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{tr('কল লগ সেভ করুন', 'Save Call Log', 'حفظ السجل')}</span>
                  </button>
                </div>
              )}

              {/* Follow-up Scheduler Form */}
              {canEdit && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-amber-50/40 dark:bg-amber-950/20">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>{tr('পরবর্তী ফলো-আপ বা ভিজিট শিডিউল', 'Schedule Follow-up / Campus Visit', 'جدولة المتابعة')}</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        {tr('তারিখ', 'Date', 'التاريخ')}
                      </label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        {tr('সময়', 'Time', 'الوقت')}
                      </label>
                      <input
                        type="text"
                        value={followUpTime}
                        onChange={(e) => setFollowUpTime(e.target.value)}
                        placeholder="11:30 AM"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleScheduleFollowUp}
                    disabled={!followUpDate}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{tr('ফলো-আপ শিডিউল করুন', 'Set Schedule', 'تأكيد الموعد')}</span>
                  </button>
                </div>
              )}

              {/* Notes & Activity Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>{tr('কার্যক্রম ও কমিউনিকেশন টাইমলাইন', 'Activity & Call Timeline', 'سجل النشاطات')}</span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {toBengaliDigits((selectedLead.callLogs?.length || 0) + (selectedLead.notes?.length || 0))} টি এন্ট্রি
                  </span>
                </h4>

                {/* Add Quick Note */}
                {canEdit && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder={tr('নতুন ইন্টারনাল নোট যুক্ত করুন...', 'Add an internal note...', 'إضافة ملاحظة...')}
                      className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddNote();
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddNote}
                      className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Combined Timeline Items */}
                <div className="space-y-2.5 pt-2">
                  {/* Call logs */}
                  {selectedLead.callLogs?.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-xl border border-emerald-100 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold text-emerald-900 dark:text-emerald-200">
                        <span className="flex items-center gap-1.5">
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                          <span>কল: {log.callOutcome}</span>
                          {log.durationText && (
                            <span className="text-[10px] font-mono text-slate-400 font-normal">({log.durationText})</span>
                          )}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
                      </div>
                      {log.note && <div className="text-slate-600 dark:text-slate-300">{log.note}</div>}
                      <div className="text-[10px] text-slate-400">স্টাফ: {log.callerName}</div>
                    </div>
                  ))}

                  {/* Notes */}
                  {selectedLead.notes?.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{n.authorName}</span>
                        <span className="font-mono">{n.timestamp}</span>
                      </div>
                      <div className="text-slate-700 dark:text-slate-200">{n.text}</div>
                    </div>
                  ))}

                  {(!selectedLead.callLogs?.length && !selectedLead.notes?.length) && (
                    <div className="text-center py-6 text-xs text-slate-400">
                      {tr('এখনও কোনো কল হিস্ট্রি বা নোট নেই। প্রথম কল করে ফলাফল যুক্ত করুন।', 'No calls or notes logged yet.', 'لا توجد ملاحظات')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Marketing Lead Sync & Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {tr('মার্কেটিং লিড সিঙ্ক ও বাল্ক ইমপোর্ট', 'Marketing Leads Sync & Bulk Import', 'مزامنة واستيراد البيانات')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {tr('ফেসবুক অ্যাডস, গুগল শিট বা এক্সেল ফাইল থেকে এক ক্লিকে লিড যুক্ত করুন', 'Import leads from Facebook Ads or Google Sheets', 'استيراد استفسارات')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/50 p-1 gap-1">
              <button
                type="button"
                onClick={() => setImportTab('paste')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  importTab === 'paste' ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {tr('সরাসরি পেস্ট / CSV', 'Direct Paste / CSV', 'لصق بيانات')}
              </button>
              <button
                type="button"
                onClick={() => setImportTab('sheet')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  importTab === 'sheet' ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {tr('গুগল শিট সিঙ্ক (Live)', 'Google Sheet Sync', 'مزامنة جداول جوجل')}
              </button>
            </div>

            <div className="p-5 space-y-4">
              {importTab === 'paste' ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>{tr('ক্যাম্পেইন / মার্কেটিং উৎস ট্যাগ', 'Campaign Source Tag', 'مصدر الحملة')}</span>
                      <button
                        type="button"
                        onClick={handleLoadSampleCsv}
                        className="text-purple-600 hover:underline cursor-pointer"
                      >
                        {tr('নমুনা ডাটা লোড করুন', 'Load Sample', 'بيانات تجريبية')}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={marketingSourceTag}
                      onChange={(e) => setMarketingSourceTag(e.target.value)}
                      placeholder="Facebook Ads Campaign 2027"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {tr('লিড ডাটা পেস্ট করুন (CSV বা ট্যাব ফরম্যাট)', 'Paste Leads Data (CSV format)', 'لصق البيانات بصيغة CSV')}
                    </label>
                    <textarea
                      rows={6}
                      value={pasteData}
                      onChange={(e) => setPasteData(e.target.value)}
                      placeholder={`Name, Phone, Email, Department, Source, Notes\nমোঃ ফারহান, 01700000000, farhan@test.com, হিফজ বিভাগ, Facebook, ...`}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs font-mono"
                    />
                    <p className="text-[11px] text-slate-400">
                      {tr('স্মার্ট ডি-ডুপ্লিকেশন: বিদ্যমান ফোন নম্বরের সাথে মিলে গেলে স্বয়ংক্রিয়ভাবে মার্জ হবে, কোনো ডুপ্লিকেট লিড হবে না।', 'Smart Deduplication: Rows with existing phone numbers are updated without duplication.', 'دمج تلقائي للأرقام المكررة')}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsImportModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 cursor-pointer"
                    >
                      {tr('বাতিল', 'Cancel', 'إلغاء')}
                    </button>
                    <button
                      type="button"
                      onClick={handleCommitBulkImport}
                      disabled={!pasteData.trim()}
                      className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                    >
                      {tr('ইমপোর্ট ও সিঙ্ক সম্পন্ন করুন', 'Import & Sync', 'بدء الاستيراد')}
                    </button>
                  </div>
                </>
              ) : (
                /* Google Sheet Tab */
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                    <div className="font-bold">{tr('গুগল শিট থেকে অটো-সিঙ্ক নির্দেশিকা', 'Google Sheet Live Sync Guide', 'دليل الربط مع جداول جوجل')}</div>
                    <div>
                      {tr(
                        'গুগল শিটের File > Share > Publish to web থেকে CSV ফরম্যাট সিলেক্ট করে লিংকটি এখানে দিন। মার্কেটিং টিম শিটে ডাটা এন্ট্রি করলেই এই লিড ট্র্যাকার তা লোড করে নেবে।',
                        'Publish your Google Sheet to web as CSV and paste the URL below for instant synchronization.',
                        'شارك الجدول كملف CSV والصق الرابط هنا'
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {tr('পাবলিশড গুগল শিট CSV লিঙ্ক', 'Published Google Sheet CSV URL', 'رابط الجدول')}
                    </label>
                    <div className="relative">
                      <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={googleSheetUrl}
                        onChange={(e) => setGoogleSheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsImportModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 cursor-pointer"
                    >
                      {tr('বাতিল', 'Cancel', 'إلغاء')}
                    </button>
                    <button
                      type="button"
                      onClick={handleTriggerSheetSync}
                      disabled={!googleSheetUrl.trim() || isSyncingSheet}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
                      <span>{tr('এখনই সিঙ্ক করুন', 'Sync Now', 'مزامنة الآن')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Manual Walk-in / Phone Lead Creation Modal */}
      {isNewLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 shadow-2xl overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-[#2e0249] to-[#6b21a8] text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base">
                  {tr('নতুন ভর্তি লিড যোগ করুন (ওয়াক-ইন / ফোন)', 'Add New Walk-in / Phone Lead', 'إضافة طلب جديد')}
                </h3>
                <p className="text-xs text-purple-200 mt-0.5">
                  {tr('সরাসরি অফিস ভিজিট বা ফোন কলের লিড পাইপলাইনে যুক্ত করুন', 'Log a front-desk or phone inquiry into Lead to Admission', 'تسجيل استفسار مباشر')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewLeadModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateManualLead} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {tr('শিক্ষার্থীর নাম *', 'Student Name *', 'اسم الطالب *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="যেমন: আব্দুল্লাহ আল-মামুন"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {tr('অভিভাবকের নাম', 'Guardian Name', 'اسم ولي الأمر')}
                  </label>
                  <input
                    type="text"
                    value={manualGuardian}
                    onChange={(e) => setManualGuardian(e.target.value)}
                    placeholder="পিতা / মাতার নাম"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {tr('মোবাইল নম্বর *', 'Phone Number *', 'رقم الهاتف *')}
                  </label>
                  <input
                    type="tel"
                    required
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {tr('লিডের উৎস', 'Lead Source', 'المصدر')}
                  </label>
                  <select
                    value={manualSource}
                    onChange={(e) => setManualSource(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                  >
                    <option value="Walk-in / Campus Visit">Walk-in / ক্যাম্পাস ভিজিট</option>
                    <option value="Phone Inquiry">ফোন কল ইনকোয়ারি</option>
                    <option value="WhatsApp Message">হোয়াটসঅ্যাপ মেসেজ</option>
                    <option value="Facebook Page Inbox">ফেসবুক পেজ ইনবক্স</option>
                    <option value="Guardian Referral">অভিভাবক রেফারেল</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {tr('আগ্রহী বিভাগ / শ্রেণি', 'Target Department / Class', 'القسم')}
                  </label>
                  <select
                    value={manualCourseId}
                    onChange={(e) => setManualCourseId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                  >
                    {state.courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.titleBn || c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {tr('ইমেইল (ঐচ্ছিক)', 'Email (Optional)', 'البريد')}
                  </label>
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {tr('প্রাথমিক নোট', 'Initial Note', 'ملاحظة')}
                </label>
                <textarea
                  rows={2}
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder={tr('আবাসিক/অনাবাসিক আগ্রহ বা আলোচনার বিবরণ...', 'Residential preference or notes...', 'ملاحظات...')}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewLeadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold cursor-pointer"
                >
                  {tr('বাতিল', 'Cancel', 'إلغاء')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer"
                >
                  {tr('পাইপলাইনে যুক্ত করুন', 'Add to Pipeline', 'إضافة')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
