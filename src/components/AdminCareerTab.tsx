import React, { useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  QrCode,
  Save,
  Trash2,
  Users,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import { CareerApplicationStatus } from '../types/cms';

const STATUS_OPTIONS: CareerApplicationStatus[] = [
  'Received',
  'Shortlisted',
  'Interview Scheduled',
  'Selected',
  'Rejected',
];

export const AdminCareerTab: React.FC = () => {
  const {
    state,
    addCareerJob,
    updateCareerJob,
    deleteCareerJob,
    updateCareerApplicationStatus,
    deleteCareerApplication,
  } = useCMS();

  const jobs = state.careerJobs || [];
  const applications = state.careerApplications || [];

  const [subTab, setSubTab] = useState<'jobs' | 'applications'>('jobs');
  const [statusFilter, setStatusFilter] = useState<'All' | CareerApplicationStatus>('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [hrNoteDrafts, setHrNoteDrafts] = useState<Record<string, string>>({});

  // Add Job Form state
  const [titleBn, setTitleBn] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [departmentBn, setDepartmentBn] = useState('জেনারেল সেকশন (প্লে – দাখিল)');
  const [campusBn, setCampusBn] = useState('বয়েজ ও গার্লস ক্যাম্পাস (সেক্টর-১২, উত্তরা)');
  const [employmentTypeBn, setEmploymentTypeBn] = useState('পূর্ণকালীন');
  const [salaryRangeBn, setSalaryRangeBn] = useState('৳ ১৮,০০০ – ২৮,০০০/-');
  const [vacancies, setVacancies] = useState(2);
  const [deadline, setDeadline] = useState('2026-12-31');
  const [summaryBn, setSummaryBn] = useState('');
  const [requirementsText, setRequirementsText] = useState('');
  const [responsibilitiesText, setResponsibilitiesText] = useState('');

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleBn.trim()) return;
    addCareerJob({
      titleBn: titleBn.trim(),
      titleEn: titleEn.trim() || titleBn.trim(),
      departmentBn: departmentBn.trim(),
      campusBn: campusBn.trim(),
      employmentTypeBn: employmentTypeBn.trim(),
      salaryRangeBn: salaryRangeBn.trim(),
      vacancies: Math.max(1, Number(vacancies) || 1),
      deadline: deadline || '2026-12-31',
      summaryBn: summaryBn.trim() || 'যোগ্য ও অভিজ্ঞ শিক্ষক/কর্মকর্তা আবশ্যক।',
      requirementsBn: requirementsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      responsibilitiesBn: responsibilitiesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      active: true,
    });
    setTitleBn('');
    setTitleEn('');
    setSummaryBn('');
    setRequirementsText('');
    setResponsibilitiesText('');
    setShowAddForm(false);
  };

  const filteredApps = applications.filter(
    (a) => statusFilter === 'All' || a.status === statusFilter
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#140126] via-[#2e0249] to-[#6b21a8] text-white p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">
            <Briefcase className="w-4 h-4" />
            <span>HR & Recruitment Control Center</span>
          </span>
          <h2 className="text-2xl font-extrabold">ক্যারিয়ার ও নিয়োগ ব্যবস্থাপনা</h2>
          <p className="text-sm text-purple-200 mt-1">
            সক্রিয় নিয়োগ বিজ্ঞপ্তি ({jobs.filter((j) => j.active).length}টি) এবং মোট আবেদন ({applications.length}টি) সরাসরি নিয়ন্ত্রণ করুন।
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubTab('jobs')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              subTab === 'jobs'
                ? 'bg-amber-400 text-[#140126]'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            নিয়োগ বিজ্ঞপ্তি ({jobs.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('applications')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              subTab === 'applications'
                ? 'bg-amber-400 text-[#140126]'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            আবেদনকারী তালিকা ({applications.length})
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Job Circulars CRUD */}
      {subTab === 'jobs' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              প্রকাশিত নিয়োগ বিজ্ঞপ্তিসমূহ
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2e0249] to-fuchsia-700 text-white text-sm font-bold inline-flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'ফরম বন্ধ করুন' : 'নতুন নিয়োগ বিজ্ঞপ্তি যোগ করুন'}</span>
            </button>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleCreateJob}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 p-6 space-y-4 shadow-sm"
            >
              <h4 className="font-extrabold text-slate-900 dark:text-white">
                নতুন পদ যুক্ত করুন (পাবলিক /career পেইজে লাইভ হবে)
              </h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  placeholder="পদের নাম (বাংলা) *"
                  value={titleBn}
                  onChange={(e) => setTitleBn(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
                <input
                  type="text"
                  placeholder="Job Title (English)"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
                <input
                  type="text"
                  placeholder="বিভাগ"
                  value={departmentBn}
                  onChange={(e) => setDepartmentBn(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
                <input
                  type="text"
                  placeholder="ক্যাম্পাস"
                  value={campusBn}
                  onChange={(e) => setCampusBn(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
                <input
                  type="text"
                  placeholder="বেতন স্কেল"
                  value={salaryRangeBn}
                  onChange={(e) => setSalaryRangeBn(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min={1}
                    placeholder="পদসংখ্যা"
                    value={vacancies}
                    onChange={(e) => setVacancies(Number(e.target.value))}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
              </div>
              <textarea
                rows={2}
                placeholder="সংক্ষিপ্ত বিবরণ"
                value={summaryBn}
                onChange={(e) => setSummaryBn(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <textarea
                  rows={3}
                  placeholder="প্রয়োজনীয় যোগ্যতা (প্রতি লাইনে একটি করে)"
                  value={requirementsText}
                  onChange={(e) => setRequirementsText(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
                <textarea
                  rows={3}
                  placeholder="দায়িত্বসমূহ (প্রতি লাইনে একটি করে)"
                  value={responsibilitiesText}
                  onChange={(e) => setResponsibilitiesText(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold cursor-pointer"
              >
                বিজ্ঞপ্তি প্রকাশ করুন
              </button>
            </form>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200">
                      {job.departmentBn}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        job.active
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {job.active ? 'সক্রিয় (Live)' : 'বন্ধ (Hidden)'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {job.titleBn}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {job.campusBn} · বেতন: {job.salaryRangeBn} · শেষ তারিখ: {job.deadline}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => updateCareerJob({ ...job, active: !job.active })}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {job.active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{job.active ? 'হাইড করুন' : 'পাবলিশ করুন'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCareerJob(job.id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>মুছুন</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Applicant Tracking */}
      {subTab === 'applications' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-700" />
              <span>জমাকৃত চাকরির আবেদন ({filteredApps.length})</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(['All', ...STATUS_OPTIONS] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#2e0249] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredApps.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
                এই ক্যাটাগরিতে কোনো আবেদন পাওয়া যায়নি।
              </div>
            ) : (
              filteredApps.map((app) => (
                <div
                  key={app.id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                          {app.applicantName}
                        </h4>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-amber-300">
                          {app.jobTitleBn}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {app.isGuestApplication ? 'Guest Apply' : 'Registered Account'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 mt-1.5">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {app.phone}
                        </span>
                        {app.whatsapp && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                            <MessageSquare className="w-3.5 h-3.5" /> WA: {app.whatsapp}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" /> {app.email}
                        </span>
                        {app.paymentTrxId && (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-[#005a6e] dark:text-[#f0c95e]">
                            <QrCode className="w-3.5 h-3.5" /> TrxID: {app.paymentTrxId}
                          </span>
                        )}
                        <span>জমা: {app.submittedAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={app.status}
                        onChange={(e) =>
                          updateCareerApplicationStatus(
                            app.id,
                            e.target.value as CareerApplicationStatus,
                            hrNoteDrafts[app.id] ?? app.hrNote
                          )
                        }
                        className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-slate-800 border border-purple-200 dark:border-slate-700 text-xs font-bold text-purple-900 dark:text-amber-300"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => deleteCareerApplication(app.id)}
                        className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 cursor-pointer"
                        aria-label={`Delete application from ${app.applicantName}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-slate-700 dark:text-slate-300">
                    <p>
                      <strong>শিক্ষা:</strong> {app.educationBn}
                    </p>
                    <p>
                      <strong>অভিজ্ঞতা:</strong> {app.experienceYearsBn}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 truncate">
                        <FileText className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                        <span className="truncate">{app.cvLinkOrFileName || 'N/A'}</span>
                      </span>
                      {app.cvFileDataUrl && (
                        <a
                          href={app.cvFileDataUrl}
                          download={app.cvFileName || `${app.applicantName}-CV.pdf`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#005a6e] text-white text-[11px] font-bold hover:opacity-90"
                        >
                          <Download className="w-3 h-3" />
                          <span>সিভি ডাউনলোড</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {app.coverLetterBn && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                      “{app.coverLetterBn}”
                    </p>
                  )}

                  {/* Inline HR Note Editor (visible in Public No-Login Tracker) */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={hrNoteDrafts[app.id] ?? app.hrNote ?? ''}
                      onChange={(e) =>
                        setHrNoteDrafts((prev) => ({ ...prev, [app.id]: e.target.value }))
                      }
                      placeholder="HR নোট লিখুন (যেমন: আগামী শনিবার সকাল ১০টায় ডেমো ক্লাস)..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateCareerApplicationStatus(
                          app.id,
                          app.status,
                          (hrNoteDrafts[app.id] ?? app.hrNote ?? '').trim()
                        )
                      }
                      className="inline-flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>HR নোট সেভ করুন</span>
                    </button>
                  </div>

                  {app.hrNote && (
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>HR Note: {app.hrNote}</span>
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
