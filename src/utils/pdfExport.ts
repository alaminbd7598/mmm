import { jsPDF } from 'jspdf';
import { AdmissionLead, SiteSettings, TeacherLeaveRequest } from '../types/cms';

export const generateAdmissionPDF = (lead: AdmissionLead) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const d = lead.detailedData || {};
  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Header Background Banner
  doc.setFillColor(36, 2, 61); // #24023d cosmic purple
  doc.rect(0, 0, pageWidth, 34, 'F');

  // Gold accent line
  doc.setFillColor(251, 191, 36); // #fbbf24 gold
  doc.rect(0, 34, pageWidth, 1.5, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MAHARAT MODEL MADRASAH', pageWidth / 2, 11, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(230, 215, 255);
  doc.text(
    'A Madrasah with Excellence | EIIN: 140630 | Madrasah Code: 21023',
    pageWidth / 2,
    17,
    { align: 'center' }
  );

  doc.setFontSize(7.5);
  doc.setTextColor(210, 195, 240);
  doc.text(
    'Girls Campus & Office: House #7, Road #17/A, Sector #12 | Boys: House #11, Road #19, Sector #12, Uttara | Tel: 01886-340308',
    pageWidth / 2,
    23,
    { align: 'center' }
  );
  doc.text('Email: info@maharatmadrasah.com | Web: maharatmadrasah.com', pageWidth / 2, 28, {
    align: 'center',
  });

  // Application Dossier Badge
  doc.setFillColor(243, 232, 255);
  doc.roundedRect(margin, 38, contentWidth, 10, 2, 2, 'F');
  doc.setDrawColor(192, 132, 252);
  doc.roundedRect(margin, 38, contentWidth, 10, 2, 2, 'D');

  doc.setTextColor(56, 6, 93);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('OFFICIAL ADMISSION APPLICATION DOSSIER', margin + 4, 44.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  const statusStr = `App ID: ${lead.id}  |  Status: ${lead.status.toUpperCase()}  |  Date: ${lead.submittedAt}`;
  doc.text(statusStr, pageWidth - margin - 4, 44.5, { align: 'right' });

  // Photo placeholder box on right
  const photoX = pageWidth - margin - 26;
  const photoY = 52;
  const photoW = 26;
  const photoH = 32;

  doc.setDrawColor(160, 160, 160);
  doc.setFillColor(250, 250, 252);
  doc.rect(photoX, photoY, photoW, photoH, 'FD');
  doc.setFontSize(6.5);
  doc.setTextColor(130, 130, 130);
  doc.text('STUDENT PHOTO', photoX + photoW / 2, photoY + 14, { align: 'center' });
  doc.text('(Passport Size)', photoX + photoW / 2, photoY + 18, { align: 'center' });

  let curY = 53;

  // Helper for section header
  const drawSectionHeader = (title: string, yPos: number) => {
    doc.setFillColor(76, 5, 117);
    doc.rect(margin, yPos, contentWidth - (yPos < 88 ? 30 : 0), 5.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(title, margin + 2.5, yPos + 3.8);
    return yPos + 7.5;
  };

  // Helper for 2-column or 3-column rows
  const drawRow = (
    y: number,
    fields: { label: string; value: string; widthRatio?: number }[]
  ) => {
    const totalW = contentWidth - (y < 88 ? 30 : 0);
    let startX = margin;
    doc.setFontSize(7.5);

    fields.forEach((f) => {
      const colW = totalW * (f.widthRatio || 1 / fields.length);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(90, 40, 120);
      doc.text(`${f.label}:`, startX, y);

      const labelWidth = doc.getTextWidth(`${f.label}: `);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      const val = f.value || 'N/A';
      doc.text(val, startX + labelWidth, y);

      startX += colW;
    });

    return y + 5;
  };

  // Section 1: Student Information
  curY = drawSectionHeader('1. STUDENT INFORMATION', curY);
  curY = drawRow(curY, [
    { label: 'Name (EN)', value: d.studentNameEn || lead.name, widthRatio: 0.55 },
    { label: 'Name (BN)', value: d.studentNameBn || lead.name, widthRatio: 0.45 },
  ]);
  curY = drawRow(curY, [
    { label: 'Date of Birth', value: d.dob || 'N/A', widthRatio: 0.35 },
    { label: 'Age', value: d.age ? `${d.age} Years` : 'N/A', widthRatio: 0.25 },
    { label: 'Gender', value: d.gender || 'N/A', widthRatio: 0.4 },
  ]);
  curY = drawRow(curY, [
    { label: 'Department', value: d.department || 'Academic', widthRatio: 0.38 },
    { label: 'Target Class', value: d.targetClass || lead.courseTitle, widthRatio: 0.38 },
    { label: 'Blood Group', value: d.bloodGroup || 'N/A', widthRatio: 0.24 },
  ]);
  curY = drawRow(curY, [
    { label: 'Session', value: d.session || '2027', widthRatio: 0.35 },
    { label: 'Nationality', value: d.nationality || 'Bangladeshi', widthRatio: 0.35 },
    { label: 'Birth Reg/NID', value: d.nidOrBirthReg || 'Provided', widthRatio: 0.3 },
  ]);

  curY = Math.max(curY + 2, 89);

  // Section 2: Previous Academic Record
  curY = drawSectionHeader('2. PREVIOUS ACADEMIC RECORD', curY);
  curY = drawRow(curY, [
    { label: 'Previous Institute', value: d.prevInstitute || 'None / First Time Enrolling', widthRatio: 0.5 },
    { label: 'Previous Class', value: d.prevClass || 'N/A', widthRatio: 0.25 },
    { label: 'GPA / Result', value: d.prevGpa || 'N/A', widthRatio: 0.25 },
  ]);

  curY += 2;

  // Section 3: Parents & Guardian Information
  curY = drawSectionHeader('3. PARENTS & GUARDIAN DETAILS', curY);
  curY = drawRow(curY, [
    { label: "Father's Name (EN)", value: d.fatherNameEn || d.fatherNameBn || 'N/A', widthRatio: 0.45 },
    { label: 'Occupation', value: d.fatherOccupation || 'N/A', widthRatio: 0.3 },
    { label: 'Contact/Mobile', value: d.fatherMobile || lead.phone, widthRatio: 0.25 },
  ]);
  curY = drawRow(curY, [
    { label: "Mother's Name (EN)", value: d.motherNameEn || d.motherNameBn || 'N/A', widthRatio: 0.45 },
    { label: 'Occupation', value: d.motherOccupation || 'Homemaker', widthRatio: 0.3 },
    { label: 'Contact/Mobile', value: d.motherMobile || 'N/A', widthRatio: 0.25 },
  ]);
  curY = drawRow(curY, [
    { label: 'Local Guardian', value: d.guardianNameEn || d.guardianNameBn || 'Parents', widthRatio: 0.4 },
    { label: 'Relation', value: d.guardianRelation || 'Father/Mother', widthRatio: 0.3 },
    { label: 'Guardian Phone', value: d.guardianMobile || lead.phone, widthRatio: 0.3 },
  ]);

  curY += 2;

  // Section 4: Family Environment & Islamic Values
  curY = drawSectionHeader('4. FAMILY ENVIRONMENT & VALUES', curY);
  curY = drawRow(curY, [
    { label: 'Halal Income', value: d.halalIncome || 'Yes', widthRatio: 0.33 },
    { label: 'Regular 5-Time Prayer', value: d.regularPrayer || 'Yes', widthRatio: 0.34 },
    { label: 'Purdah Maintained', value: d.purdahMaintenance || 'Yes', widthRatio: 0.33 },
  ]);
  curY = drawRow(curY, [
    { label: 'Quran Recitation in Family', value: d.quranRecitation || 'Yes', widthRatio: 0.38 },
    { label: 'Television at Home', value: d.hasTelevision || 'Controlled', widthRatio: 0.32 },
    { label: 'Drug Addiction in Family', value: d.drugAddictionInFamily || 'No', widthRatio: 0.3 },
  ]);

  curY += 2;

  // Section 5: Student Behavior & Character
  curY = drawSectionHeader('5. STUDENT BEHAVIOR & STUDY HABITS', curY);
  curY = drawRow(curY, [
    { label: 'Daily Screen/Mobile Use', value: d.mobileUsageHours || '< 1 Hour', widthRatio: 0.35 },
    { label: 'Obeys Parents', value: d.obeysParents || 'Yes', widthRatio: 0.32 },
    { label: 'Anger Control', value: d.angerControl || 'Normal', widthRatio: 0.33 },
  ]);
  curY = drawRow(curY, [
    { label: 'Manners with Elders', value: d.behaviorWithElders || 'Respectful', widthRatio: 0.35 },
    { label: 'Study Interest', value: d.studyInterest || 'Attentive', widthRatio: 0.32 },
    { label: 'Religious Zeal', value: d.religiousInterest || 'Interested', widthRatio: 0.33 },
  ]);

  curY += 2;

  // Section 6: Address & Submitted Documents
  curY = drawSectionHeader('6. ADDRESS & DOCUMENT CHECKLIST', curY);
  const permAddr = [
    d.permanentVillage,
    d.permanentPost,
    d.permanentThana,
    d.permanentDistrict,
  ]
    .filter(Boolean)
    .join(', ');
  const presAddr = d.presentAddressSame
    ? permAddr
    : [d.presentVillage, d.presentPost, d.presentThana, d.presentDistrict]
        .filter(Boolean)
        .join(', ');

  curY = drawRow(curY, [
    { label: 'Present Address', value: presAddr || 'Sector 12, Uttara, Dhaka-1230', widthRatio: 1 },
  ]);
  curY = drawRow(curY, [
    { label: 'Permanent Address', value: permAddr || 'Sector 12, Uttara, Dhaka-1230', widthRatio: 1 },
  ]);
  curY = drawRow(curY, [
    {
      label: 'Submitted Documents',
      value: (d.submittedDocuments || ['Birth Certificate', 'Passport Photos', 'Parent NID']).join(
        ' | '
      ),
      widthRatio: 1,
    },
  ]);

  // Applicant Pledge Statement Box
  curY += 3;
  doc.setFillColor(248, 245, 255);
  doc.roundedRect(margin, curY, contentWidth, 14, 1.5, 1.5, 'F');
  doc.setDrawColor(216, 180, 254);
  doc.roundedRect(margin, curY, contentWidth, 14, 1.5, 1.5, 'D');

  doc.setFontSize(6.8);
  doc.setTextColor(70, 70, 70);
  doc.setFont('helvetica', 'italic');
  const pledgeText =
    'Parent/Guardian Declaration: I hereby declare that all information provided in this admission form is true, correct, and complete to the best of my knowledge. I agree to abide by all the rules, codes of conduct, Islamic ethics, and financial regulations of Maharat Model Madrasah (EIIN: 140630).';
  doc.text(pledgeText, margin + 3, curY + 4.5, { maxWidth: contentWidth - 6 });

  // Official Signatures Area
  curY += 20;
  const sigColW = contentWidth / 3;

  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.3);

  // Sig 1: Guardian
  doc.line(margin + 5, curY + 12, margin + sigColW - 5, curY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  doc.text("Guardian's Signature & Date", margin + sigColW / 2, curY + 16, { align: 'center' });

  // Sig 2: Admission Officer
  doc.line(margin + sigColW + 5, curY + 12, margin + sigColW * 2 - 5, curY + 12);
  doc.text('Admissions Verification Officer', margin + (sigColW * 3) / 2, curY + 16, {
    align: 'center',
  });

  // Sig 3: Principal Approval Seal
  doc.line(margin + sigColW * 2 + 5, curY + 12, margin + sigColW * 3 - 5, curY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(56, 6, 93);
  doc.text("Principal's Approval & Seal", margin + (sigColW * 5) / 2, curY + 16, {
    align: 'center',
  });

  // Footer bar
  doc.setFillColor(36, 2, 61);
  doc.rect(0, 290, pageWidth, 7, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(240, 230, 255);
  doc.text(
    'Maharat Model Madrasah (EIIN: 140630 | Code: 21023) · Official Student Dossier Record',
    pageWidth / 2,
    294.5,
    { align: 'center' }
  );

  const rawName = (d.studentNameEn || lead.name || 'Applicant').trim();
  const asciiOnly = rawName.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  const cleanName = (asciiOnly || 'Applicant').substring(0, 25);
  doc.save(`Maharat_Madrasah_Admission_${cleanName}_${lead.id}.pdf`);
};

export const generateLeaveApprovalPDF = (
  leave: TeacherLeaveRequest,
  settings?: SiteSettings
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const instName = (settings?.instituteName || 'MAHARAT MODEL MADRASAH').toUpperCase();
  const instAddr =
    settings?.addressEn ||
    'House # 62/A, Road # 14, Sector # 13, Uttara, Dhaka-1230 (EIIN: 140630 | Code: 21023)';
  const instEmail = settings?.email || 'info@maharatmadrasah.com';

  // Royal Purple Header Banner
  doc.setFillColor(46, 2, 73); // #2e0249
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Warm Gold Accent Strip
  doc.setFillColor(245, 158, 11); // #f59e0b
  doc.rect(0, 38, pageWidth, 2, 'F');

  // Institution Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(instName, pageWidth / 2, 13, { align: 'center' });

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(233, 213, 255);
  doc.text(
    'Office of the Honorable Principal & Academic Administration',
    pageWidth / 2,
    20,
    { align: 'center' }
  );

  doc.setFontSize(8);
  doc.setTextColor(216, 180, 254);
  doc.text(instAddr, pageWidth / 2, 26.5, { align: 'center' });
  doc.text(`Official Email: ${instEmail}  |  Document Format: A4 Official Certificate`, pageWidth / 2, 32, {
    align: 'center',
  });

  // Document Title Banner
  doc.setFillColor(243, 232, 255);
  doc.roundedRect(margin, 46, contentWidth, 12, 2, 2, 'F');
  doc.setDrawColor(168, 85, 247);
  doc.roundedRect(margin, 46, contentWidth, 12, 2, 2, 'D');

  doc.setTextColor(59, 7, 100);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('OFFICIAL TEACHER LEAVE APPROVAL CERTIFICATE', margin + 4, 53.5);

  // Status Stamp Pill on the right
  const statusUpper = leave.status.toUpperCase();
  if (leave.status === 'Approved') {
    doc.setFillColor(22, 163, 74); // Emerald green
  } else if (leave.status === 'Rejected') {
    doc.setFillColor(220, 38, 38); // Red
  } else {
    doc.setFillColor(217, 119, 6); // Amber
  }
  doc.roundedRect(pageWidth - margin - 38, 48, 34, 8, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.text(statusUpper, pageWidth - margin - 21, 53.2, { align: 'center' });

  // Reference & Date Row
  let curY = 66;
  doc.setFontSize(8.5);
  doc.setTextColor(70, 70, 70);
  doc.setFont('helvetica', 'bold');
  doc.text(`Reference ID: ${leave.id}`, margin, curY);
  doc.setFont('helvetica', 'normal');
  doc.text(`Submitted On: ${leave.submittedAt}`, pageWidth - margin, curY, { align: 'right' });

  curY += 6;
  doc.setDrawColor(220, 210, 235);
  doc.line(margin, curY, pageWidth - margin, curY);
  curY += 8;

  // Section Helper
  const drawSectionBar = (title: string, y: number) => {
    doc.setFillColor(76, 5, 117); // #4c0575
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(title, margin + 3, y + 4.8);
    return y + 12;
  };

  const drawKeyValueRow = (y: number, label1: string, val1: string, label2?: string, val2?: string) => {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(88, 28, 135);
    doc.text(`${label1}:`, margin + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(25, 25, 25);
    doc.text(val1 || 'N/A', margin + 42, y);

    if (label2) {
      const col2X = margin + contentWidth / 2 + 4;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(88, 28, 135);
      doc.text(`${label2}:`, col2X, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(25, 25, 25);
      doc.text(val2 || 'N/A', col2X + 36, y);
    }
    return y + 7;
  };

  // Section 1: Applicant Teacher Details
  curY = drawSectionBar('1. APPLICANT FACULTY / TEACHER PROFILE', curY);
  curY = drawKeyValueRow(
    curY,
    'Teacher Name',
    leave.teacherName,
    'Staff Username',
    `@${leave.teacherUsername}`
  );
  curY = drawKeyValueRow(
    curY,
    'Department',
    leave.department,
    'Designation',
    leave.designation
  );
  curY = drawKeyValueRow(
    curY,
    'Emergency Contact',
    leave.emergencyPhone || 'On File',
    'Application Status',
    leave.status
  );

  curY += 3;

  // Section 2: Leave Schedule & Coverage Details
  curY = drawSectionBar('2. APPROVED LEAVE SCHEDULE & CLASS COVERAGE', curY);
  curY = drawKeyValueRow(
    curY,
    'Leave Category',
    leave.leaveType,
    'Total Duration',
    `${leave.totalDays} Day(s)`
  );
  curY = drawKeyValueRow(
    curY,
    'Start Date',
    leave.startDate,
    'End Date (Inclusive)',
    leave.endDate
  );
  curY = drawKeyValueRow(
    curY,
    'Primary Reason',
    leave.reasonCategory
  );
  curY = drawKeyValueRow(
    curY,
    'Substitute Teacher',
    leave.substituteTeacher
  );

  // Reason Details Box
  curY += 2;
  doc.setFillColor(250, 247, 255);
  doc.roundedRect(margin, curY, contentWidth, 20, 1.5, 1.5, 'F');
  doc.setDrawColor(216, 180, 254);
  doc.roundedRect(margin, curY, contentWidth, 20, 1.5, 1.5, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(88, 28, 135);
  doc.text('Applicant Detailed Statement / Notes:', margin + 3, curY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text(leave.reasonDetails || 'No additional remarks provided.', margin + 3, curY + 11, {
    maxWidth: contentWidth - 6,
  });

  curY += 26;

  // Section 3: Principal / Chairman Official Decision & Remarks
  curY = drawSectionBar('3. PRINCIPAL / CHAIRMAN OFFICIAL DECISION & REMARKS', curY);
  curY = drawKeyValueRow(
    curY,
    'Reviewed By',
    leave.reviewedBy || 'Honorable Principal / Chairman',
    'Decision Date',
    leave.reviewedAt || leave.submittedAt
  );

  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin, curY, contentWidth, 24, 1.5, 1.5, 'F');
  doc.setDrawColor(134, 239, 172);
  doc.roundedRect(margin, curY, contentWidth, 24, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(21, 128, 61);
  doc.text('Official Endorsement & Remarks from Principal / Chairman:', margin + 3, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text(
    leave.reviewerComment ||
      'This leave application has been reviewed by the administration. Substitute class coverage is mandatory for all scheduled periods.',
    margin + 3,
    curY + 12,
    { maxWidth: contentWidth - 6 }
  );

  curY += 34;

  // Official Terms Note
  doc.setFillColor(254, 252, 232);
  doc.roundedRect(margin, curY, contentWidth, 14, 1.5, 1.5, 'F');
  doc.setDrawColor(253, 224, 71);
  doc.roundedRect(margin, curY, contentWidth, 14, 1.5, 1.5, 'D');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(113, 63, 18);
  doc.text(
    'Note: Please present a printed or digital copy of this A4 Leave Approval Certificate to the Academic Coordinator prior to departure and upon rejoining duties.',
    margin + 3,
    curY + 6,
    { maxWidth: contentWidth - 6 }
  );

  // Signatures Block at bottom of A4
  const sigY = 252;
  const sigColW = contentWidth / 3;
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.35);

  // Col 1: Applicant Teacher
  doc.line(margin + 4, sigY, margin + sigColW - 4, sigY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text('Applicant Teacher Signature', margin + sigColW / 2, sigY + 5, { align: 'center' });

  // Col 2: Substitute Teacher
  doc.line(margin + sigColW + 4, sigY, margin + sigColW * 2 - 4, sigY);
  doc.text('Substitute Teacher Consent', margin + (sigColW * 3) / 2, sigY + 5, {
    align: 'center',
  });

  // Col 3: Principal / Chairman Official Seal
  doc.line(margin + sigColW * 2 + 4, sigY, margin + sigColW * 3 - 4, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 7, 100);
  doc.text('Principal / Chairman Seal & Sign', margin + (sigColW * 5) / 2, sigY + 5, {
    align: 'center',
  });

  // Footer Bar
  doc.setFillColor(46, 2, 73);
  doc.rect(0, 289, pageWidth, 8, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(240, 230, 255);
  doc.text(
    `${instName} · Official HR & Leave Management Record · Ref: ${leave.id}`,
    pageWidth / 2,
    294,
    { align: 'center' }
  );

  const safeTeacher = (leave.teacherName || 'Teacher')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 24);
  doc.save(`Leave_Approval_${safeTeacher}_${leave.id}.pdf`);
};

