import { AdmissionLead } from '../types/cms';

export const exportRegistrationsToCSV = (leads: AdmissionLead[], filenamePrefix = 'craft_institute_registrations') => {
  const headers = [
    'ক্রমিক (SL)',
    'আইডি (ID)',
    'শিক্ষার্থীর নাম (Student Name)',
    'অভিভাবকের নাম (Guardian Name)',
    'সম্পর্ক (Relation)',
    'মোবাইল নম্বর (Phone)',
    'ইমেইল (Email)',
    'বিভাগ (Department)',
    'কাঙ্ক্ষিত শ্রেণি (Class/Track)',
    'আবাসন ব্যবস্থা (Accommodation)',
    'ক্যাম্পাস ভিজিট তারিখ (Visit Date)',
    'আবেদনের অবস্থা (Status)',
    'জমার তারিখ (Submission Date)',
    'উৎস (Source)',
    'বার্তা বা নোট (Message/Notes)',
  ];

  const escapeCSV = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = leads.map((lead, index) => {
    const d = lead.detailedData || {};
    return [
      escapeCSV(index + 1),
      escapeCSV(lead.id),
      escapeCSV(d.studentNameBn || d.studentNameEn || lead.name),
      escapeCSV(lead.guardianName || d.fatherNameBn || d.fatherNameEn || 'অভিভাবক'),
      escapeCSV(lead.guardianRelation || 'পিতা/মাতা'),
      escapeCSV(lead.phone || d.fatherMobile || ''),
      escapeCSV(lead.email || ''),
      escapeCSV(lead.preferredDepartment || d.department || 'Academic'),
      escapeCSV(lead.targetClass || d.targetClass || lead.courseTitle),
      escapeCSV(lead.preferredAccommodation || d.academicCategory || 'অনাবাসিক'),
      escapeCSV(lead.campusVisitDate || 'ক্যাম্পাস ভিজিট আলোচনা সাপেক্ষে'),
      escapeCSV(lead.status),
      escapeCSV(lead.submittedAt),
      escapeCSV(lead.source),
      escapeCSV(lead.message),
    ].join(',');
  });

  // Prepend UTF-8 BOM for Microsoft Excel Bengali encoding support
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `${filenamePrefix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
