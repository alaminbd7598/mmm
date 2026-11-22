import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bed,
  Calculator,
  Check,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Home,
  Image as ImageIcon,
  Percent,
  Printer,
  Sun,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import { AccommodationMode } from '../types/cms';
import { calculateAdmissionFeeSummary, toBengaliDigits } from '../utils/cmsLogic';
import { formatCurrencyByLang, localizeDigits, localizeDynamicText } from '../utils/i18nContent';

interface InteractiveFeeCalculatorProps {
  onApplyWithSelection?: (department: string, classNameBn: string, accommodation: string) => void;
}

export const InteractiveFeeCalculator: React.FC<InteractiveFeeCalculatorProps> = ({
  onApplyWithSelection,
}) => {
  const { state, pushToast, language, t } = useCMS();
  const { feeCalculatorConfig, settings } = state;

  const [selectedDept, setSelectedDept] = useState<'General' | 'Hifz'>('General');

  const deptItems = useMemo(
    () => feeCalculatorConfig.items.filter((i) => i.department === selectedDept),
    [feeCalculatorConfig.items, selectedDept]
  );

  const [selectedItemId, setSelectedItemId] = useState<string>(
    () => feeCalculatorConfig.items.find((i) => i.department === 'General')?.id || ''
  );

  // Discount toggles: 25% Early Bird, 10% Special, + Extra 5%
  const [apply25Discount, setApply25Discount] = useState<boolean>(true);
  const [apply10Discount, setApply10Discount] = useState<boolean>(false);
  const [apply5ExtraDiscount, setApply5ExtraDiscount] = useState<boolean>(false);

  // Mutually exclusive accommodation mode: 'non-residential' | 'residential' | 'daycare'
  const [accommodationMode, setAccommodationMode] =
    useState<AccommodationMode>('non-residential');

  // Optional Own Transport Route & Sibling Tuition Discount
  const [selectedTransportRouteId, setSelectedTransportRouteId] = useState<string>('none');
  const [applySiblingDiscount, setApplySiblingDiscount] = useState<boolean>(false);

  // Optional guardian/student personalization for the A4 summary
  const [studentNameForSheet, setStudentNameForSheet] = useState('');
  const [guardianPhoneForSheet, setGuardianPhoneForSheet] = useState('');
  const [showA4Preview, setShowA4Preview] = useState(false);

  const activeItem = useMemo(() => {
    const found = deptItems.find((i) => i.id === selectedItemId);
    return found || deptItems[0] || feeCalculatorConfig.items[0];
  }, [deptItems, selectedItemId, feeCalculatorConfig.items]);

  const handleDepartmentChange = (dept: 'General' | 'Hifz') => {
    setSelectedDept(dept);
    const firstInDept = feeCalculatorConfig.items.find((i) => i.department === dept);
    if (firstInDept) {
      setSelectedItemId(firstInDept.id);
    }
  };

  // Toggle primary discounts (25% and 10% are mutually exclusive base discounts, while Extra 5% can stack or be used solo)
  const handleToggle25 = () => {
    setApply25Discount((prev) => {
      const next = !prev;
      if (next) setApply10Discount(false);
      return next;
    });
  };

  const handleToggle10 = () => {
    setApply10Discount((prev) => {
      const next = !prev;
      if (next) setApply25Discount(false);
      return next;
    });
  };

  const handleToggle5Extra = () => {
    setApply5ExtraDiscount((prev) => !prev);
  };

  const selectedTransportRoute = useMemo(
    () =>
      (state.transportConfig?.routes || []).find((r) => r.id === selectedTransportRouteId) ||
      null,
    [state.transportConfig?.routes, selectedTransportRouteId]
  );

  const summary = useMemo(
    () =>
      calculateAdmissionFeeSummary({
        item: activeItem,
        apply25Discount,
        apply10Discount,
        apply5ExtraDiscount,
        accommodationMode,
        config: feeCalculatorConfig,
        transportMonthlyFee: selectedTransportRoute ? selectedTransportRoute.monthlyFee : 0,
        transportLabelBn: selectedTransportRoute
          ? `${selectedTransportRoute.routeNameBn} (${selectedTransportRoute.vehicleTypeBn})`
          : 'পরিবহন ব্যতীত',
        applySiblingDiscount,
        siblingTuitionDiscountPercent:
          state.admissionExtraConfig?.siblingTuitionDiscountPercent ?? 25,
      }),
    [
      activeItem,
      apply25Discount,
      apply10Discount,
      apply5ExtraDiscount,
      accommodationMode,
      feeCalculatorConfig,
      selectedTransportRoute,
      applySiblingDiscount,
      state.admissionExtraConfig?.siblingTuitionDiscountPercent,
    ]
  );

  const formatMoneyEn = (n: number) => `৳ ${n.toLocaleString('en-IN')}/-`;
  const formatMoneyBn = (n: number) => `৳ ${toBengaliDigits(n.toLocaleString('en-IN'))}/-`;
  const formatMoneyLang = (n: number) => formatCurrencyByLang(n, language);

  /**
   * Renders a high-resolution A4 Cost Summary Sheet onto an HTML5 Canvas
   * so both PNG Picture Download and A4 PDF Download preserve crisp Bengali typography.
   */
  const buildA4SummaryCanvas = (): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    // Standard A4 @ 150 DPI: 1240 x 1754 px (strict 1:1.4145 aspect ratio)
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext('2d')!;

    // 1. Pristine Official Letterhead Paper Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Double Hairline Border (Outer Royal Purple, Inner Warm Gold)
    ctx.strokeStyle = '#2e0249';
    ctx.lineWidth = 3;
    ctx.strokeRect(36, 36, canvas.width - 72, 1682);

    ctx.strokeStyle = '#c29438';
    ctx.lineWidth = 1;
    ctx.strokeRect(42, 42, canvas.width - 84, 1670);

    // 2. Official Letterhead Header (প্রতিষ্ঠানের অফিসিয়াল প্যাড)
    // Draw Elegant Circular Institutional Crest / Seal
    const crestCenterX = 115;
    const crestCenterY = 130;

    // Outer gold ring
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(crestCenterX, crestCenterY, 46, 0, Math.PI * 2);
    ctx.stroke();

    // Inner purple circle
    ctx.fillStyle = '#2e0249';
    ctx.beginPath();
    ctx.arc(crestCenterX, crestCenterY, 42, 0, Math.PI * 2);
    ctx.fill();

    // Crest Text & Monogram
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MMM', crestCenterX, crestCenterY + 6);

    ctx.fillStyle = '#f3e8ff';
    ctx.font = 'bold 8.5px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`EIIN:${settings.eiinNumber || '140630'}`, crestCenterX, crestCenterY + 22);

    // Center Letterhead Typography
    ctx.textAlign = 'left';

    // Bilingual Name
    ctx.fillStyle = '#2e0249';
    ctx.font = 'bold 34px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(settings.instituteNameBn, 185, 105, 950);

    ctx.fillStyle = '#4c0575';
    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      `${settings.instituteName.toUpperCase()}  |  EIIN: ${settings.eiinNumber || '140630'}  |  CODE: ${settings.madrasahCode || '21023'}`,
      185,
      132,
      950
    );

    ctx.fillStyle = '#7e22ce';
    ctx.font = '600 14px "Hind Siliguri", sans-serif';
    ctx.fillText(
      'মাহারাত ফাউন্ডেশনের একটি প্রকল্প · কুরআন-সুন্নাহ ও আধুনিক শিক্ষার সমন্বিত কারিকুলাম',
      185,
      155,
      950
    );

    // Campus Location & Contact Info
    ctx.fillStyle = '#475569';
    ctx.font = '13px "Hind Siliguri", sans-serif';
    ctx.fillText(
      `ক্যাম্পাস: ${settings.address} · হটলাইন: ${settings.phonePrimary}, ${settings.phoneSecondary}`,
      185,
      178,
      950
    );
    ctx.fillText(
      `ওয়েবসাইট: maharatmadrasah.com · ইমেইল: ${settings.email}`,
      185,
      198,
      950
    );

    // Letterhead Dividing Dual Rules
    ctx.strokeStyle = '#2e0249';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(60, 218);
    ctx.lineTo(canvas.width - 60, 218);
    ctx.stroke();

    ctx.strokeStyle = '#c29438';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 223);
    ctx.lineTo(canvas.width - 60, 223);
    ctx.stroke();

    // 3. Official Memo Reference & Issue Date Bar
    const dateStr = new Date().toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    ctx.font = '600 14px "Hind Siliguri", "JetBrains Mono", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'left';
    ctx.fillText(`স্মারক নং: MMM/ADM-EST/2026-${activeItem.id.substring(0, 6).toUpperCase()}`, 70, 250);

    ctx.textAlign = 'right';
    ctx.fillText(`ইস্যুর তারিখ: ${dateStr}`, canvas.width - 70, 250);

    // 4. Formal Title Badge (অফিসিয়াল প্রাক্কলন শিরোনাম)
    const titleGrad = ctx.createLinearGradient(70, 265, canvas.width - 70, 315);
    titleGrad.addColorStop(0, '#2e0249');
    titleGrad.addColorStop(1, '#4c0575');
    ctx.fillStyle = titleGrad;
    ctx.fillRect(70, 265, canvas.width - 140, 50);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 20px "Hind Siliguri", sans-serif';
    ctx.fillText('শিক্ষার্থী ভর্তি ও মাসিক খরচের অফিসিয়াল প্রাক্কলন বিবরণী', canvas.width / 2, 296);

    ctx.fillStyle = '#e9d5ff';
    ctx.font = '12.5px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      'OFFICIAL STUDENT ADMISSION & MONTHLY TUITION FEE ESTIMATE (SESSION 2027)',
      canvas.width / 2,
      311
    );

    // 5. Student & Program Particulars Box (Strict Two-Column Layout with ZERO OVERFLOW)
    const metaY = 328;
    const metaH = 148;
    ctx.fillStyle = '#faf5ff';
    ctx.fillRect(70, metaY, canvas.width - 140, metaH);
    ctx.strokeStyle = '#d8b4fe';
    ctx.lineWidth = 1;
    ctx.strokeRect(70, metaY, canvas.width - 140, metaH);

    // Safe short accommodation title guaranteed never to overflow
    const safeAccomLabel =
      accommodationMode === 'residential'
        ? 'আবাসিক (আবাসন ও ৩ বেলা খাবার)'
        : accommodationMode === 'daycare'
        ? 'ডে-কেয়ার (দুপুরের খাবার ও তত্ত্বাবধান)'
        : 'অনাবাসিক (ক্লাস ও টিউশন)';

    const discountSummaryLabel =
      summary.totalDiscountPercent > 0
        ? `${toBengaliDigits(summary.totalDiscountPercent)}% ছাড় প্রযোজ্য`
        : 'নিয়মিত ফি';

    const metaRows: [string, string, string, string][] = [
      [
        'শিক্ষার্থীর নাম:',
        studentNameForSheet.trim() || 'নির্ধারিত হয়নি (অভিভাবক কপি)',
        'অভিভাবকের মোবাইল:',
        guardianPhoneForSheet.trim() || settings.phonePrimary,
      ],
      [
        'নির্বাচিত বিভাগ:',
        selectedDept === 'Hifz' ? 'হিফজুল কুরআন বিভাগ' : 'জেনারেল / একাডেমিক বিভাগ',
        'শিক্ষাবর্ষ / সেশন:',
        '২০২৭ শিক্ষাবর্ষ (Session 2027)',
      ],
      [
        'নির্বাচিত শ্রেণি / স্তর:',
        activeItem.classNameBn,
        'আবাসন ব্যবস্থা:',
        safeAccomLabel,
      ],
      [
        'ডিসকাউন্ট স্ট্যাটাস:',
        discountSummaryLabel,
        'প্রস্তুতকারী শাখা:',
        'অনলাইন ভর্তি ও হিসাব প্রাক্কলন সেল',
      ],
    ];

    metaRows.forEach((row, i) => {
      const curRowY = metaY + 28 + i * 32;

      // Col 1 (Left)
      ctx.textAlign = 'left';
      ctx.fillStyle = '#581c87';
      ctx.font = 'bold 15px "Hind Siliguri", sans-serif';
      ctx.fillText(row[0], 90, curRowY);

      ctx.fillStyle = '#0f172a';
      ctx.font = '600 15px "Hind Siliguri", sans-serif';
      // Strict width clamping: max width 380px
      ctx.fillText(row[1], 245, curRowY, 380);

      // Col 2 (Right)
      ctx.fillStyle = '#581c87';
      ctx.font = 'bold 15px "Hind Siliguri", sans-serif';
      ctx.fillText(row[2], 660, curRowY);

      ctx.fillStyle = '#0f172a';
      ctx.font = '600 15px "Hind Siliguri", sans-serif';
      // Strict width clamping: max width 380px (ends at 810 + 380 = 1190, canvas right is 1170)
      ctx.fillText(row[3], 810, curRowY, 340);
    });

    // 6. Itemized Fee Schedule Table Header (y: 490)
    const tableHeaderY = 490;
    ctx.fillStyle = '#2e0249';
    ctx.fillRect(70, tableHeaderY, canvas.width - 140, 42);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('নং', 100, tableHeaderY + 27);

    ctx.textAlign = 'left';
    ctx.fillText('খাতের বিবরণ ও বিস্তারিত (Fee Particulars & Coverage)', 140, tableHeaderY + 27);

    ctx.textAlign = 'center';
    ctx.fillText('প্রদেয় সময়কাল', 730, tableHeaderY + 27);

    ctx.textAlign = 'right';
    ctx.fillText('পরিমাণ (Amount in BDT)', canvas.width - 90, tableHeaderY + 27);

    // 6 Itemized Table Rows
    const tableRows = [
      {
        sl: '০১',
        title: 'নির্ধারিত মূল ভর্তি ফি (Regular Admission Fee)',
        sub: `${activeItem.classNameBn} — প্রাতিষ্ঠানিক ভর্তি নিবন্ধন`,
        term: 'এককালীন প্রদেয়',
        amount: formatMoneyBn(summary.baseAdmissionFee),
        enAmount: formatMoneyEn(summary.baseAdmissionFee),
        isHighlight: false,
      },
      {
        sl: '০২',
        title: `প্রযোজ্য বিশেষ ডিসকাউন্ট ছাড় (${toBengaliDigits(summary.totalDiscountPercent)}% Discount Saved)`,
        sub:
          summary.totalDiscountPercent > 0
            ? [
                apply25Discount ? '২৫% অগ্রিম ভর্তি ছাড়' : '',
                apply10Discount ? '১০% বিশেষ ছাড়' : '',
                apply5ExtraDiscount ? '৫% এক্সট্রা ছাড়' : '',
              ]
                .filter(Boolean)
                .join(' + ')
            : 'কোনো ডিসকাউন্ট প্রযোজ্য নয়',
        term: 'বিশেষ ছাড়',
        amount: `- ${formatMoneyBn(summary.discountAmount)}`,
        enAmount: `- ${formatMoneyEn(summary.discountAmount)}`,
        isHighlight: false,
        isDiscount: true,
      },
      {
        sl: '০৩',
        title: 'ছাড় পরবর্তী নিট ভর্তি ফি (Net Admission Fee)',
        sub: 'ভর্তির সময় পরিশোধযোগ্য প্রকৃত ভর্তি ফি',
        term: 'ভর্তির সময় প্রদেয়',
        amount: formatMoneyBn(summary.netAdmissionFee),
        enAmount: formatMoneyEn(summary.netAdmissionFee),
        isHighlight: true,
      },
      {
        sl: '০৪',
        title: 'মাসিক একাডেমিক / হিফজ টিউশন বেতন (Monthly Tuition Fee)',
        sub: 'প্রতি মাসের নিয়মিত পাঠদান ও প্রশিক্ষণ ফি',
        term: 'প্রতি মাসে প্রদেয়',
        amount: formatMoneyBn(summary.monthlyTuitionFee),
        enAmount: formatMoneyEn(summary.monthlyTuitionFee),
        isHighlight: false,
      },
      {
        sl: '০৫',
        title: `মাসিক আবাসন / ডে-কেয়ার চার্জ (${safeAccomLabel})`,
        sub: summary.accommodationLabelBn,
        term: 'প্রতি মাসে প্রদেয়',
        amount: formatMoneyBn(summary.accommodationMonthlyFee),
        enAmount: formatMoneyEn(summary.accommodationMonthlyFee),
        isHighlight: false,
      },
      {
        sl: '০৬',
        title: 'প্রতি মাসের সর্বমোট প্রদেয় খরচ (Total Monthly Recurring Cost)',
        sub: 'মাসিক টিউশন বেতন + নির্বাচিত আবাসন/ডে-কেয়ার চার্জ',
        term: 'প্রতি মাসে প্রদেয়',
        amount: formatMoneyBn(summary.totalMonthlyFee),
        enAmount: formatMoneyEn(summary.totalMonthlyFee),
        isHighlight: true,
      },
    ];

    let rowY = tableHeaderY + 42;
    const rHeight = 72;
    tableRows.forEach((r, idx) => {
      ctx.fillStyle = r.isHighlight ? '#f5e8ff' : idx % 2 === 0 ? '#ffffff' : '#fcfaff';
      ctx.fillRect(70, rowY, canvas.width - 140, rHeight);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(70, rowY, canvas.width - 140, rHeight);

      // Sl
      ctx.textAlign = 'center';
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 15px "JetBrains Mono", sans-serif';
      ctx.fillText(r.sl, 100, rowY + 38);

      // Title & Subtitle
      ctx.textAlign = 'left';
      ctx.fillStyle = r.isHighlight ? '#4c0575' : r.isDiscount ? '#047857' : '#0f172a';
      ctx.font = `${r.isHighlight ? 'bold' : '600'} 16px "Hind Siliguri", sans-serif`;
      ctx.fillText(r.title, 140, rowY + 30, 520);

      ctx.fillStyle = '#64748b';
      ctx.font = '13.5px "Hind Siliguri", sans-serif';
      ctx.fillText(r.sub, 140, rowY + 54, 520);

      // Term
      ctx.textAlign = 'center';
      ctx.fillStyle = '#475569';
      ctx.font = '600 13.5px "Hind Siliguri", sans-serif';
      ctx.fillText(r.term, 730, rowY + 40, 160);

      // Amount
      ctx.textAlign = 'right';
      ctx.fillStyle = r.isHighlight ? '#581c87' : r.isDiscount ? '#047857' : '#0f172a';
      ctx.font = 'bold 18px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${r.amount} (${r.enAmount})`, canvas.width - 90, rowY + 42, 260);

      rowY += rHeight;
    });

    // 7. Grand Total Payable at Admission Banner (y: 980, height 96)
    const grandY = rowY + 16;
    const grandGrad = ctx.createLinearGradient(70, grandY, canvas.width - 70, grandY + 96);
    grandGrad.addColorStop(0, '#2e0249');
    grandGrad.addColorStop(1, '#581c87');
    ctx.fillStyle = grandGrad;
    ctx.fillRect(70, grandY, canvas.width - 140, 96);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 22px "Hind Siliguri", sans-serif';
    ctx.fillText('ভর্তির সময় সর্বমোট প্রদেয় (Total Payable at Admission):', 95, grandY + 42, 650);

    ctx.fillStyle = '#e9d5ff';
    ctx.font = '15px "Hind Siliguri", sans-serif';
    ctx.fillText(
      `নিট ভর্তি ফি (${formatMoneyBn(summary.netAdmissionFee)}) + ১ম মাসের সর্বমোট বেতন (${formatMoneyBn(
        summary.totalMonthlyFee
      )}) একত্রে`,
      95,
      grandY + 74,
      650
    );

    ctx.textAlign = 'right';
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 36px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
    ctx.fillText(formatMoneyEn(summary.totalPayableAtAdmission), canvas.width - 95, grandY + 48, 400);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px "Hind Siliguri", sans-serif';
    ctx.fillText(formatMoneyBn(summary.totalPayableAtAdmission), canvas.width - 95, grandY + 76, 400);

    // 8. Official Instructions & Documents Box (y: 1105, height 140)
    const noteY = grandY + 112;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.fillRect(70, noteY, canvas.width - 140, 140);
    ctx.strokeRect(70, noteY, canvas.width - 140, 140);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px "Hind Siliguri", sans-serif';
    ctx.fillText('ভর্তির নিয়মাবলি ও প্রয়োজনীয় ডকুমেন্টস:', 95, noteY + 30);

    ctx.font = '14.5px "Hind Siliguri", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(
      '• শিক্ষার্থীর পাসপোর্ট সাইজের ৪ কপি রঙিন ছবি এবং অনলাইন জন্ম নিবন্ধন সনদের স্পষ্ট ফটোকপি।',
      95,
      noteY + 58,
      1000
    );
    ctx.fillText(
      '• পিতা ও মাতার জাতীয় পরিচয়পত্র (NID) অথবা পাসপোর্টের সত্যায়িত ফটোকপি।',
      95,
      noteY + 82,
      1000
    );
    ctx.fillText(
      `• বাৎসরিক সার্ভিস চার্জ: ৳ ${toBengaliDigits(summary.annualServiceCharge)}/- (আইডি কার্ড, ডায়েরি, সিলেবাস ও বার্ষিক ল্যাব চার্জ)।`,
      95,
      noteY + 106,
      1000
    );
    ctx.fillText(
      `• সরাসরি ভর্তি তথ্য ও হেল্পলাইন: ${settings.phonePrimary}, ${settings.phoneSecondary} (সকাল ৯টা হতে বিকাল ৫টা)`,
      95,
      noteY + 130,
      1000
    );

    // 9. Official 3-Signatures Section on Institutional Pad (y: 1265, height 120)
    const sigY = noteY + 160;
    const colWidth = (canvas.width - 140) / 3;

    // Signature 1: Guardian (Left)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(90, sigY + 65);
    ctx.lineTo(90 + colWidth - 40, sigY + 65);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 15.5px "Hind Siliguri", sans-serif';
    ctx.fillText('শিক্ষার্থী / অভিভাবকের সম্মতি ও স্বাক্ষর', 90 + (colWidth - 40) / 2, sigY + 92);
    ctx.font = '12.5px "Hind Siliguri", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('তারিখ: .......................................', 90 + (colWidth - 40) / 2, sigY + 112);

    // Signature 2: Accounts Verification (Center)
    ctx.strokeStyle = '#94a3b8';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(70 + colWidth + 20, sigY + 65);
    ctx.lineTo(70 + colWidth * 2 - 20, sigY + 65);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 15.5px "Hind Siliguri", sans-serif';
    ctx.fillText('যাচাইকারী / হিসাব কর্মকর্তা', 70 + colWidth * 1.5, sigY + 92);
    ctx.font = '12.5px "Hind Siliguri", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(settings.instituteNameBn || 'মাহারাত মডেল মাদ্রাসা', 70 + colWidth * 1.5, sigY + 112);

    // Signature 3: Principal Approval & Seal (Right)
    ctx.strokeStyle = '#94a3b8';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(canvas.width - 70 - colWidth + 40, sigY + 65);
    ctx.lineTo(canvas.width - 90, sigY + 65);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#581c87';
    ctx.font = 'bold 15.5px "Hind Siliguri", sans-serif';
    ctx.fillText('অধ্যক্ষ / পরিচালক', canvas.width - 70 - (colWidth - 40) / 2, sigY + 92);
    ctx.font = '12.5px "Hind Siliguri", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('(অফিসিয়াল সিলমোহর)', canvas.width - 70 - (colWidth - 40) / 2, sigY + 112);

    // 10. Official Verification Note & Letterhead Footer (y: 1420 to 1480)
    const footY = sigY + 145;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.fillRect(70, footY, canvas.width - 140, 44);
    ctx.strokeRect(70, footY, canvas.width - 140, 44);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#475569';
    ctx.font = '13.5px "Hind Siliguri", sans-serif';
    ctx.fillText(
      `বিশেষ দ্রষ্টব্য: এটি ${settings.instituteNameBn || 'মাহারাত মডেল মাদ্রাসা'}-এর অফিশিয়াল প্যাডে কম্পিউটার প্রাক্কলন কপি। চূড়ান্ত ভর্তির সময় এই বিবরণীর মূল কপি জমা প্রযোজ্য।`,
      canvas.width / 2,
      footY + 28,
      1050
    );

    // Bottom Letterhead Line
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = '13.5px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      `© ২০২৭ ${settings.instituteNameBn} (${settings.instituteName}) · ক্যাম্পাস: ${settings.address} · ওয়েবসাইট: maharatmadrasah.com`,
      canvas.width / 2,
      1685,
      1080
    );

    return canvas;
  };

  const handleDownloadA4Picture = () => {
    try {
      const canvas = buildA4SummaryCanvas();
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Maharat-Admission-Fee-Summary-2027-${selectedDept}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      pushToast(
        'A4 Picture ডাউনলোড সম্পন্ন!',
        'ভর্তির খরচের পূর্ণাঙ্গ A4 ইমেজ সামারি ডাউনলোড হয়েছে।'
      );
    } catch {
      pushToast('ডাউনলোড ত্রুটি', 'অনুগ্রহ করে আবার চেষ্টা করুন।', 'info');
    }
  };

  const handleDownloadA4Pdf = async () => {
    try {
      // Downloaded on demand: the PDF library is not part of the page bundle.
      const { jsPDF } = await import('jspdf');
      const canvas = buildA4SummaryCanvas();
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      pdf.save(`Maharat-Admission-Fee-Summary-2027-${selectedDept}.pdf`);
      pushToast(
        'A4 PDF ডাউনলোড সম্পন্ন!',
        'ভর্তির খরচের পূর্ণাঙ্গ A4 পিডিএফ সামারি ডাউনলোড হয়েছে।'
      );
    } catch {
      pushToast('পিডিএফ ডাউনলোড ত্রুটি', 'অনুগ্রহ করে আবার চেষ্টা করুন।', 'info');
    }
  };

  const handlePrintOfficialLetterhead = () => {
    setShowA4Preview(true);
    document.body.classList.add('printing-letterhead');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('printing-letterhead');
    }, 180);
  };

  const issueDateBn = new Date().toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const safeAccomShortLabel =
    accommodationMode === 'residential'
      ? 'আবাসিক (আবাসন ও ৩ বেলা খাবার)'
      : accommodationMode === 'daycare'
      ? 'ডে-কেয়ার (দুপুরের খাবার ও তত্ত্বাবধান)'
      : 'অনাবাসিক (ক্লাস ও টিউশন)';

  const calcCopy = {
    bn: {
      title: feeCalculatorConfig.titleBn,
      subtitle: feeCalculatorConfig.subtitleBn,
      deptGeneral: 'জেনারেল / একাডেমিক বিভাগ',
      deptHifz: 'হিফজুল কুরআন বিভাগ',
      selectHifzLevel: 'হিফজুল কুরআন বিভাগের স্তর নির্বাচন করুন',
      selectGeneralClass: 'শ্রেণি বা বিভাগ নির্বাচন করুন (জেনারেল / একাডেমিক)',
      discountHeading: t.calcDiscountSelect,
      disc25Title: t.calcEarly25,
      disc25Sub: 'Early Bird 25% Discount',
      disc10Title: t.calcFirst10,
      disc10Sub: 'প্রথম ১০০ জনের বিশেষ ছাড়',
      disc5Title: t.calcExtra5,
      disc5Sub: 'সহোদর / এককালীন পরিশোধে',
      accomHeading: t.calcAccommodationSelect,
      accomHint: '* যেকোনো একটি নির্বাচন করুন',
      nonResTitle: t.calcNonRes,
      nonResSub: 'শুধুমাত্র নিয়মিত ক্লাস ও টিউশন',
      resTitle: t.calcRes,
      resSub: 'হোস্টেল ৳১৪,৫০০/মাস (প্রথমবার সিট +৳১৮,৫০০)',
      dayCareTitle: t.calcDayCare,
      dayCareSub: 'ডে-কেয়ার ৳১২,৫০০/মাস (দুপুরের খাবার ও তত্ত্বাবধান)',
      monthlySuffix: 'মাসিক',
      transportLabel: 'নিজস্ব পরিবহন রুট (ঐচ্ছিক - মাসিক ভাড়া যুক্ত হবে)',
      noTransport: 'পরিবহন প্রয়োজন নেই (৳ ০/-)',
      siblingTitle: `সহোদর / ভাইবোন ছাড় (${localizeDigits(state.admissionExtraConfig?.siblingTuitionDiscountPercent ?? 25, 'bn')}% টিউশন ছাড়)`,
      siblingSub: 'একাধিক সন্তান অধ্যয়নরত থাকলে প্রযোজ্য',
      studentNameLabel: 'শিক্ষার্থীর নাম (A4 সামারি শীটে প্রদর্শনের জন্য - ঐচ্ছিক)',
      studentNamePh: 'যেমন: আব্দুল্লাহ আল মামুন',
      guardianPhoneLabel: 'অভিভাবকের মোবাইল নম্বর (ঐচ্ছিক)',
      guardianPhonePh: 'যেমন: 017XXXXXXXX',
      offBadge: 'ছাড়',
      baseAdmission: t.calcOriginalAdmission,
      netAdmission: 'ভর্তি ফি',
      monthlyTuition: t.calcMonthlyTuition,
      withSibling: '(ভাইবোন ছাড়সহ)',
      resCharge: 'আবাসিক চার্জ (আবাসন + খাবার):',
      dayCareCharge: 'ডে-কেয়ার চার্জ (খাবার ও তত্ত্বাবধান):',
      transportCharge: 'নিজস্ব পরিবহন',
      totalAtAdmission: t.calcTotalFirstMonth,
      nextMonthlyTotal: 'পরবর্তী প্রতি মাসে প্রদেয় (মাসিক মোট):',
      perMonth: '/ মাস',
      applyNowBtn: 'এখনই ভর্তি ফরম পূরণ করুন',
      a4DownloadHeading:
        'প্রতিষ্ঠানের অফিসিয়াল প্যাডে (A4 Letterhead) খরচের হিসাব ডাউনলোড ও প্রিন্ট করুন:',
      a4Print: 'A4 প্রিন্ট',
      hideA4Preview: 'অফিসিয়াল প্যাড (A4 Letterhead) প্রিভিউ লুকান',
      showA4Preview: 'স্ক্রিনে অফিসিয়াল প্যাড (A4 Letterhead) প্রিভিউ দেখুন',
    },
    en: {
      title: t.feeOverviewTitle,
      subtitle: t.feeOverviewSubtitle,
      deptGeneral: 'General / Academic Dept.',
      deptHifz: 'Tahfizul Quran Dept.',
      selectHifzLevel: 'Select Hifzul Quran Track / Level',
      selectGeneralClass: 'Select Academic Grade / Class',
      discountHeading: t.calcDiscountSelect,
      disc25Title: t.calcEarly25,
      disc25Sub: 'Advance Enrollment Offer',
      disc10Title: t.calcFirst10,
      disc10Sub: 'First 100 Enrolled Students',
      disc5Title: t.calcExtra5,
      disc5Sub: 'One-Time / Sibling Bonus',
      accomHeading: t.calcAccommodationSelect,
      accomHint: '* Select any one mode',
      nonResTitle: t.calcNonRes,
      nonResSub: 'Regular Classes & Tuition Only',
      resTitle: t.calcRes,
      resSub: 'Hostel ৳14,500/mo (First-time setup +৳18,500)',
      dayCareTitle: t.calcDayCare,
      dayCareSub: 'Day-Care ৳12,500/mo (Meals & Full Supervision)',
      monthlySuffix: '/month',
      transportLabel: 'Own Transport Route (Optional – Adds Monthly Fare)',
      noTransport: 'No Transport Required (BDT 0/-)',
      siblingTitle: `Sibling Concession (${state.admissionExtraConfig?.siblingTuitionDiscountPercent ?? 25}% Tuition Off)`,
      siblingSub: 'Applicable when multiple siblings are enrolled',
      studentNameLabel: 'Student Name (Optional – For A4 Estimate Sheet)',
      studentNamePh: 'e.g. Abdullah Al Mamun',
      guardianPhoneLabel: 'Guardian Mobile Number (Optional)',
      guardianPhonePh: 'e.g. 017XXXXXXXX',
      offBadge: 'OFF',
      baseAdmission: t.calcOriginalAdmission,
      netAdmission: t.calcNetAdmission,
      monthlyTuition: t.calcMonthlyTuition,
      withSibling: '(With Sibling Concession)',
      resCharge: 'Residential Charge (Hostel + Meals):',
      dayCareCharge: 'Day-Care Charge (Meals & Supervision):',
      transportCharge: 'Own Transport',
      totalAtAdmission: t.calcTotalFirstMonth,
      nextMonthlyTotal: 'Subsequent Monthly Total Payable:',
      perMonth: '/ month',
      applyNowBtn: 'Proceed to Online Admission Form',
      a4DownloadHeading:
        'Download or Print Official A4 Letterhead Cost Estimate:',
      a4Print: 'A4 Print',
      hideA4Preview: 'Hide Official A4 Letterhead Preview',
      showA4Preview: 'Preview Official A4 Letterhead on Screen',
    },
    ar: {
      title: t.feeOverviewTitle,
      subtitle: t.feeOverviewSubtitle,
      deptGeneral: 'القسم الأكاديمي العام',
      deptHifz: 'قسم تحفيظ القرآن الكريم',
      selectHifzLevel: 'اختر مرحلة تحفيظ القرآن الكريم',
      selectGeneralClass: 'اختر الصف الدراسي (القسم الأكاديمي)',
      discountHeading: t.calcDiscountSelect,
      disc25Title: t.calcEarly25,
      disc25Sub: 'خصم التسجيل المبكر ٢٥٪',
      disc10Title: t.calcFirst10,
      disc10Sub: 'خاص لأول ١٠٠ طالب مسجل',
      disc5Title: t.calcExtra5,
      disc5Sub: 'عند الدفع الكامل أو للأشقاء',
      accomHeading: t.calcAccommodationSelect,
      accomHint: '* اختر نظاماً واحداً فقط',
      nonResTitle: t.calcNonRes,
      nonResSub: 'الدراسة اليومية المعتادة فقط',
      resTitle: t.calcRes,
      resSub: 'السكن الداخلي ١٤,٥٠٠ تاكا/شهرياً (التأسيس الأول +١٨,٥٠٠)',
      dayCareTitle: t.calcDayCare,
      dayCareSub: 'الرعاية النهارية ١٢,٥٠٠ تاكا/شهرياً (شامل الوجبات)',
      monthlySuffix: 'شهرياً',
      transportLabel: 'مسار النقل المدرسي (اختياري - تضاف الرسوم الشهرية)',
      noTransport: 'بدون نقل مدرسي (٠ تاكا)',
      siblingTitle: `خصم الأشقاء (${localizeDigits(state.admissionExtraConfig?.siblingTuitionDiscountPercent ?? 25, 'ar')}٪ خصم شهري)`,
      siblingSub: 'يسري عند تسجيل أكثر من طالب من نفس الأسرة',
      studentNameLabel: 'اسم الطالب (اختياري - يظهر في كشف A4 الرسمي)',
      studentNamePh: 'مثال: عبد الله المأمون',
      guardianPhoneLabel: 'رقم جوال ولي الأمر (اختياري)',
      guardianPhonePh: '017XXXXXXXX',
      offBadge: 'خصم',
      baseAdmission: t.calcOriginalAdmission,
      netAdmission: t.calcNetAdmission,
      monthlyTuition: t.calcMonthlyTuition,
      withSibling: '(شاملاً خصم الأشقاء)',
      resCharge: 'رسوم القسم الداخلي (السكن والوجبات):',
      dayCareCharge: 'رسوم الرعاية النهارية (الوجبات والإشراف):',
      transportCharge: 'النقل المدرسي',
      totalAtAdmission: t.calcTotalFirstMonth,
      nextMonthlyTotal: 'إجمالي الرسوم الشهرية التالية:',
      perMonth: '/ شهرياً',
      applyNowBtn: 'افتح استمارة القبول الآن',
      a4DownloadHeading:
        'تحميل أو طباعة كشف التكاليف الرسمي على ورق المعهد (A4 Letterhead):',
      a4Print: 'طباعة A4',
      hideA4Preview: 'إخفاء معاينة الكشف الرسمي (A4)',
      showA4Preview: 'معاينة الكشف الرسمي (A4) على الشاشة',
    },
  }[language];

  return (
    <div id="fee-calculator" className="space-y-8 scroll-mt-24" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Main Interactive Calculator Card */}
      <div className="no-print rounded-3xl bg-white dark:bg-[#1f1037] border border-purple-200 dark:border-purple-500/30 p-6 sm:p-10 text-slate-900 dark:text-white shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors duration-300">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-purple-200 dark:border-purple-400/20">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-[#8b2cf5] flex items-center justify-center text-white shadow-lg shrink-0">
              <Calculator className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {calcCopy.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-purple-200/90 mt-1">
                {calcCopy.subtitle}
              </p>
            </div>
          </div>

          {/* Step 1: Department Switcher */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-purple-100/80 dark:bg-[#120624] border border-purple-200 dark:border-purple-500/30 self-start md:self-auto">
            <button
              type="button"
              onClick={() => handleDepartmentChange('General')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedDept === 'General'
                  ? 'bg-gradient-to-r from-[#8b2cf5] to-[#d946ef] text-white shadow-md'
                  : 'text-purple-900 dark:text-purple-200 hover:text-purple-700 dark:hover:text-white'
              }`}
            >
              {calcCopy.deptGeneral}
            </button>
            <button
              type="button"
              onClick={() => handleDepartmentChange('Hifz')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedDept === 'Hifz'
                  ? 'bg-gradient-to-r from-[#8b2cf5] to-[#d946ef] text-white shadow-md'
                  : 'text-purple-900 dark:text-purple-200 hover:text-purple-700 dark:hover:text-white'
              }`}
            >
              {calcCopy.deptHifz}
            </button>
          </div>
        </div>

        {/* Calculator Interactive Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 items-start">
          {/* Left & Center Column (7 cols) */}
          <div className="lg:col-span-7 space-y-7">
            {/* 1. Dynamic Class / Track Dropdown */}
            <div className="space-y-2.5">
              <label
                htmlFor="calc-class-select"
                className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-purple-100"
              >
                {selectedDept === 'Hifz' ? calcCopy.selectHifzLevel : calcCopy.selectGeneralClass}
              </label>
              <select
                id="calc-class-select"
                value={activeItem.id}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full rounded-2xl bg-purple-50/70 dark:bg-[#130726] border border-purple-300 dark:border-purple-500/40 px-4 py-3.5 text-sm sm:text-base font-semibold text-slate-900 dark:text-white focus:border-fuchsia-500 dark:focus:border-fuchsia-400 focus:outline-none cursor-pointer"
              >
                {deptItems.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                    className="bg-white dark:bg-[#130726] text-slate-900 dark:text-white py-2"
                  >
                    {language === 'en'
                      ? item.classNameEn || localizeDynamicText(item.classNameBn, 'en')
                      : localizeDynamicText(item.classNameBn, language)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-600 dark:text-purple-300/90">
                {localizeDynamicText(activeItem.descriptionBn, language)}
              </p>
            </div>

            {/* 2. Three Clickable Discount Options (25%, 10%, Extra 5%) */}
            <div className="space-y-3">
              <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-purple-100 flex items-center gap-2">
                <Percent className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
                <span>{calcCopy.discountHeading}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 25% Discount Option */}
                <button
                  type="button"
                  onClick={handleToggle25}
                  aria-pressed={apply25Discount}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    apply25Discount
                      ? 'bg-purple-100 dark:bg-[#8b2cf5]/25 border-[#a855f7] text-slate-900 dark:text-white shadow-md'
                      : 'bg-slate-50 dark:bg-[#130726]/80 border-purple-200 dark:border-purple-500/25 text-slate-700 dark:text-purple-200 hover:border-purple-400'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      apply25Discount
                        ? 'bg-[#a855f7] text-white'
                        : 'bg-white dark:bg-white/10 border border-purple-300 dark:border-white/30'
                    }`}
                  >
                    {apply25Discount && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                      {calcCopy.disc25Title}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-purple-200 mt-0.5">
                      {calcCopy.disc25Sub}
                    </div>
                  </div>
                </button>

                {/* 10% Discount Option */}
                <button
                  type="button"
                  onClick={handleToggle10}
                  aria-pressed={apply10Discount}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    apply10Discount
                      ? 'bg-purple-100 dark:bg-[#8b2cf5]/25 border-[#a855f7] text-slate-900 dark:text-white shadow-md'
                      : 'bg-slate-50 dark:bg-[#130726]/80 border-purple-200 dark:border-purple-500/25 text-slate-700 dark:text-purple-200 hover:border-purple-400'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      apply10Discount
                        ? 'bg-[#a855f7] text-white'
                        : 'bg-white dark:bg-white/10 border border-purple-300 dark:border-white/30'
                    }`}
                  >
                    {apply10Discount && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                      {calcCopy.disc10Title}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-purple-200 mt-0.5">
                      {calcCopy.disc10Sub}
                    </div>
                  </div>
                </button>

                {/* Extra 5% Discount Option */}
                <button
                  type="button"
                  onClick={handleToggle5Extra}
                  aria-pressed={apply5ExtraDiscount}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    apply5ExtraDiscount
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 dark:border-emerald-400 text-slate-900 dark:text-white shadow-md'
                      : 'bg-slate-50 dark:bg-[#130726]/80 border-purple-200 dark:border-purple-500/25 text-slate-700 dark:text-purple-200 hover:border-purple-400'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      apply5ExtraDiscount
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white dark:bg-white/10 border border-purple-300 dark:border-white/30'
                    }`}
                  >
                    {apply5ExtraDiscount && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                      {calcCopy.disc5Title}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-purple-200 mt-0.5">
                      {calcCopy.disc5Sub}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* 3. Three Mutually Exclusive Accommodation Icon Cards */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-purple-100">
                  {calcCopy.accomHeading}
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                  {calcCopy.accomHint}
                </span>
              </div>

              <div
                role="radiogroup"
                aria-label={calcCopy.accomHeading}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3.5"
              >
                {/* Icon 1: Non-Residential */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={accommodationMode === 'non-residential'}
                  onClick={() => setAccommodationMode('non-residential')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    accommodationMode === 'non-residential'
                      ? 'bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-[#8b2cf5]/35 dark:to-[#d946ef]/20 border-fuchsia-500 dark:border-fuchsia-400 text-slate-900 dark:text-white shadow-lg'
                      : 'bg-slate-50 dark:bg-[#130726]/80 border-purple-200 dark:border-purple-500/25 text-slate-700 dark:text-purple-200 hover:border-purple-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/25 border border-purple-300 dark:border-purple-400/30 flex items-center justify-center text-purple-700 dark:text-purple-200">
                      <Home className="w-5 h-5" />
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        accommodationMode === 'non-residential'
                          ? 'border-fuchsia-500 bg-fuchsia-500 text-white'
                          : 'border-purple-400/50'
                      }`}
                    >
                      {accommodationMode === 'non-residential' && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {calcCopy.nonResTitle}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-purple-200 mt-0.5">
                      {calcCopy.nonResSub}
                    </div>
                    <div className="text-xs font-bold text-amber-700 dark:text-amber-300 mt-1.5 font-mono">
                      + {formatMoneyLang(0)} {calcCopy.monthlySuffix}
                    </div>
                  </div>
                </button>

                {/* Icon 2: Residential with Meals */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={accommodationMode === 'residential'}
                  onClick={() => setAccommodationMode('residential')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    accommodationMode === 'residential'
                      ? 'bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-[#8b2cf5]/35 dark:to-[#d946ef]/20 border-fuchsia-500 dark:border-fuchsia-400 text-slate-900 dark:text-white shadow-lg'
                      : 'bg-slate-50 dark:bg-[#130726]/80 border-purple-200 dark:border-purple-500/25 text-slate-700 dark:text-purple-200 hover:border-purple-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-500/25 border border-fuchsia-300 dark:border-fuchsia-400/30 flex items-center justify-center text-fuchsia-700 dark:text-fuchsia-200">
                      <Bed className="w-5 h-5" />
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        accommodationMode === 'residential'
                          ? 'border-fuchsia-500 bg-fuchsia-500 text-white'
                          : 'border-purple-400/50'
                      }`}
                    >
                      {accommodationMode === 'residential' && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {calcCopy.resTitle}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-purple-200 mt-0.5">
                      {calcCopy.resSub}
                    </div>
                    <div className="text-xs font-bold text-amber-700 dark:text-amber-300 mt-1.5 font-mono">
                      + {formatMoneyLang(feeCalculatorConfig.residentialMonthlyFee)}{' '}
                      {calcCopy.monthlySuffix}
                    </div>
                  </div>
                </button>

                {/* Icon 3: Day Care */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={accommodationMode === 'daycare'}
                  onClick={() => setAccommodationMode('daycare')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    accommodationMode === 'daycare'
                      ? 'bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-[#8b2cf5]/35 dark:to-[#d946ef]/20 border-fuchsia-500 dark:border-fuchsia-400 text-slate-900 dark:text-white shadow-lg'
                      : 'bg-slate-50 dark:bg-[#130726]/80 border-purple-200 dark:border-purple-500/25 text-slate-700 dark:text-purple-200 hover:border-purple-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/25 border border-amber-300 dark:border-amber-400/30 flex items-center justify-center text-amber-700 dark:text-amber-200">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        accommodationMode === 'daycare'
                          ? 'border-fuchsia-500 bg-fuchsia-500 text-white'
                          : 'border-purple-400/50'
                      }`}
                    >
                      {accommodationMode === 'daycare' && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {calcCopy.dayCareTitle}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-purple-200 mt-0.5">
                      {calcCopy.dayCareSub}
                    </div>
                    <div className="text-xs font-bold text-amber-700 dark:text-amber-300 mt-1.5 font-mono">
                      + {formatMoneyLang(feeCalculatorConfig.dayCareMonthlyFee)}{' '}
                      {calcCopy.monthlySuffix}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* 3B. Own Transport Route Selector & Sibling Discount Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div>
                <label
                  htmlFor="calc-transport-select"
                  className="block text-[11px] sm:text-xs font-bold text-slate-800 dark:text-purple-100 mb-1.5"
                >
                  {calcCopy.transportLabel}
                </label>
                <select
                  id="calc-transport-select"
                  value={selectedTransportRouteId}
                  onChange={(e) => setSelectedTransportRouteId(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-[#130726] border border-purple-200 dark:border-purple-500/35 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:border-fuchsia-500 focus:outline-none cursor-pointer"
                >
                  <option value="none">{calcCopy.noTransport}</option>
                  {(state.transportConfig?.routes || []).map((route) => (
                    <option key={route.id} value={route.id}>
                      {localizeDynamicText(route.routeNameBn, language)} —{' '}
                      {formatMoneyLang(route.monthlyFee)}/
                      {language === 'bn' ? 'মাস' : language === 'ar' ? 'شهرياً' : 'mo'} (
                      {localizeDigits(route.distanceKm, language)}{' '}
                      {language === 'bn' ? 'কি.মি.' : language === 'ar' ? 'كم' : 'km'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={() => setApplySiblingDiscount((prev) => !prev)}
                  aria-pressed={applySiblingDiscount}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    applySiblingDiscount
                      ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-500 text-slate-900 dark:text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-[#130726] border-purple-200 dark:border-purple-500/35 text-slate-700 dark:text-purple-200'
                  }`}
                >
                  <div>
                    <div className="text-xs font-extrabold">{calcCopy.siblingTitle}</div>
                    <div className="text-[10px] text-slate-500 dark:text-purple-300">
                      {calcCopy.siblingSub}
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                      applySiblingDiscount
                        ? 'bg-amber-500 text-white'
                        : 'border border-purple-300 dark:border-white/30'
                    }`}
                  >
                    {applySiblingDiscount && <Check className="w-3.5 h-3.5" />}
                  </div>
                </button>
              </div>
            </div>

            {/* 4. Optional Student / Guardian Name Input for Customizing the A4 Sheet */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-purple-200 mb-1">
                  {calcCopy.studentNameLabel}
                </label>
                <input
                  type="text"
                  value={studentNameForSheet}
                  onChange={(e) => setStudentNameForSheet(e.target.value)}
                  placeholder={calcCopy.studentNamePh}
                  className="w-full rounded-xl bg-slate-50 dark:bg-[#130726] border border-purple-200 dark:border-purple-500/35 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-purple-300/50 focus:border-fuchsia-500 dark:focus:border-fuchsia-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-purple-200 mb-1">
                  {calcCopy.guardianPhoneLabel}
                </label>
                <input
                  type="text"
                  value={guardianPhoneForSheet}
                  onChange={(e) => setGuardianPhoneForSheet(e.target.value)}
                  placeholder={calcCopy.guardianPhonePh}
                  className="w-full rounded-xl bg-slate-50 dark:bg-[#130726] border border-purple-200 dark:border-purple-500/35 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-purple-300/50 focus:border-fuchsia-500 dark:focus:border-fuchsia-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Live Cost Breakdown Box */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-purple-50/90 dark:bg-[#17062c] border border-purple-200 dark:border-purple-400/35 p-6 sm:p-7 space-y-5 shadow-lg dark:shadow-xl">
              <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-500/20 pb-3.5">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-purple-700 dark:text-fuchsia-300 font-semibold block">
                    {selectedDept === 'Hifz' ? calcCopy.deptHifz : calcCopy.deptGeneral}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {language === 'en'
                      ? activeItem.classNameEn || localizeDynamicText(activeItem.classNameBn, 'en')
                      : localizeDynamicText(activeItem.classNameBn, language)}
                  </h4>
                </div>
                {summary.totalDiscountPercent > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-400/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-mono">
                    {localizeDigits(summary.totalDiscountPercent, language)}% {calcCopy.offBadge}
                  </span>
                )}
              </div>

              <div className="space-y-3 text-sm">
                {summary.totalDiscountPercent > 0 && (
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-purple-300/80">
                    <span>{calcCopy.baseAdmission}</span>
                    <span className="line-through font-mono">
                      {formatMoneyLang(summary.baseAdmissionFee)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-purple-100">
                    {calcCopy.netAdmission}{' '}
                    {summary.totalDiscountPercent > 0
                      ? `(${localizeDigits(summary.totalDiscountPercent, language)}% ${calcCopy.offBadge})`
                      : ''}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono text-base">
                    {formatMoneyLang(summary.netAdmissionFee)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-purple-100">
                    {calcCopy.monthlyTuition}{' '}
                    {summary.siblingTuitionDiscountAmount > 0 ? calcCopy.withSibling : ''}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono text-base">
                    {formatMoneyLang(summary.monthlyTuitionFee)}
                  </span>
                </div>

                {summary.accommodationMonthlyFee > 0 && (
                  <div className="flex items-center justify-between text-purple-800 dark:text-fuchsia-200">
                    <span>
                      {accommodationMode === 'residential'
                        ? calcCopy.resCharge
                        : calcCopy.dayCareCharge}
                    </span>
                    <span className="font-bold font-mono text-base">
                      {formatMoneyLang(summary.accommodationMonthlyFee)}
                    </span>
                  </div>
                )}

                {summary.transportMonthlyFee > 0 && (
                  <div className="flex items-center justify-between text-amber-800 dark:text-amber-300">
                    <span>
                      {calcCopy.transportCharge} (
                      {localizeDynamicText(selectedTransportRoute?.routeNameBn, language)}):
                    </span>
                    <span className="font-bold font-mono text-base">
                      {formatMoneyLang(summary.transportMonthlyFee)}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-purple-200 dark:border-purple-500/25 flex items-center justify-between">
                  <span className="text-base sm:text-lg font-extrabold text-purple-900 dark:text-amber-300">
                    {calcCopy.totalAtAdmission}
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-purple-900 dark:text-amber-300 font-mono">
                    {formatMoneyLang(summary.totalPayableAtAdmission)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-purple-200/90 pt-1">
                  <span>{calcCopy.nextMonthlyTotal}</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-purple-100">
                    {formatMoneyLang(summary.totalMonthlyFee)} {calcCopy.perMonth}
                  </span>
                </div>
              </div>

              {/* Primary Apply CTA Button */}
              <button
                type="button"
                onClick={() => {
                  if (onApplyWithSelection) {
                    onApplyWithSelection(
                      selectedDept === 'Hifz' ? 'হিফজ বিভাগ' : 'একাডেমিক বিভাগ',
                      activeItem.classNameBn,
                      accommodationMode === 'residential'
                        ? 'Residential (আবাসিক)'
                        : accommodationMode === 'daycare'
                          ? 'Day Care (ডে কেয়ার)'
                          : 'Non-Residential (অনাবাসিক)'
                    );
                  } else {
                    document
                      .getElementById('admission-section')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#8b5cf6] via-[#a855f7] to-[#ec4899] hover:from-[#7c3aed] hover:to-[#db2777] text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>{calcCopy.applyNowBtn}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>

              {/* A4 Official Letterhead Download & Print Buttons */}
              <div className="pt-2 border-t border-purple-200 dark:border-purple-500/20 space-y-2.5">
                <div className="text-[11px] font-semibold text-slate-700 dark:text-purple-200 text-center">
                  {calcCopy.a4DownloadHeading}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadA4Pdf}
                    className="py-2.5 px-2.5 rounded-xl bg-white dark:bg-white/10 hover:bg-purple-100 dark:hover:bg-white/20 border border-purple-300 dark:border-purple-300/30 text-[11px] font-bold text-slate-800 dark:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300 shrink-0" />
                    <span>A4 PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadA4Picture}
                    className="py-2.5 px-2.5 rounded-xl bg-white dark:bg-white/10 hover:bg-purple-100 dark:hover:bg-white/20 border border-purple-300 dark:border-purple-300/30 text-[11px] font-bold text-slate-800 dark:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300 shrink-0" />
                    <span>A4 PNG</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintOfficialLetterhead}
                    className="py-2.5 px-2.5 rounded-xl bg-white dark:bg-white/10 hover:bg-purple-100 dark:hover:bg-white/20 border border-purple-300 dark:border-purple-300/30 text-[11px] font-bold text-slate-800 dark:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-fuchsia-600 dark:text-fuchsia-300 shrink-0" />
                    <span>{calcCopy.a4Print}</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowA4Preview((prev) => !prev)}
                  className="w-full py-2 px-3 rounded-xl bg-purple-100 dark:bg-purple-950/80 hover:bg-purple-200 dark:hover:bg-purple-900/80 border border-purple-300 dark:border-purple-500/30 text-[11px] font-semibold text-purple-900 dark:text-purple-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showA4Preview ? calcCopy.hideA4Preview : calcCopy.showA4Preview}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Printable Official Institute Letterhead (A4 Admission Cost Receipt) */}
      {showA4Preview && (
        <div className="official-letterhead-a4 rounded-2xl shadow-2xl border-[3px] border-[#2e0249] p-5 sm:p-8 space-y-5">
          {/* Inner Gold Border Frame */}
          <div className="border border-[#c29438]/70 rounded-xl p-4 sm:p-7 space-y-5 bg-white text-slate-900">
            {/* 1. Official Institute Letterhead Header with Official Logo */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-4 border-b-2 border-[#2e0249] relative">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.instituteNameBn}
                  className="h-18 sm:h-20 w-auto max-w-[260px] object-contain shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-[3px] border-amber-600 bg-[#2e0249] text-white flex flex-col items-center justify-center shrink-0 shadow-md">
                  <GraduationCap className="w-7 h-7 text-amber-300" />
                  <span className="text-xs font-extrabold tracking-wider text-amber-300 leading-none mt-0.5">
                    MMM
                  </span>
                  <span className="text-[8px] font-semibold text-purple-200 tracking-widest mt-0.5">
                    EIIN 140630
                  </span>
                </div>
              )}

              {/* Institute Official Pad Details */}
              <div className="flex-1 text-center sm:text-left space-y-1 min-w-0">
                <div className="inline-block px-2.5 py-0.5 rounded bg-purple-100 text-[#2e0249] text-[10px] font-extrabold uppercase tracking-wider">
                  প্রতিষ্ঠানের অফিসিয়াল প্যাড · EIIN: {settings.eiinNumber || '140630'} | Code: {settings.madrasahCode || '21023'}
                </div>
                <h4 className="text-xl sm:text-2xl font-extrabold text-[#2e0249] leading-tight break-words">
                  {settings.instituteNameBn}
                </h4>
                <div className="text-xs sm:text-sm font-bold text-[#4c0575] uppercase tracking-wide break-words">
                  {settings.instituteName} ({settings.instituteNameAr || 'مدرسة المهارات النموذجية'})
                </div>
                <p className="text-xs font-semibold text-purple-800">
                  মাহারাত ফাউন্ডেশনের একটি প্রকল্প · A Madrasah with Excellence
                </p>
                <div className="text-[11px] text-slate-600 flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-0.5 pt-0.5">
                  <span>ক্যাম্পাস: {settings.address}</span>
                  <span>·</span>
                  <span>হটলাইন: {settings.phonePrimary}, {settings.phoneSecondary}</span>
                  <span>·</span>
                  <span>ইমেইল: {settings.email}</span>
                </div>
              </div>
            </div>

            {/* 2. Memo Number & Issue Date Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-600 px-1">
              <span>
                স্মারক নং:{' '}
                <strong className="font-mono text-slate-900">
                  MMM/ADM-EST/2026-{activeItem.id.substring(0, 6).toUpperCase()}
                </strong>
              </span>
              <span>
                ইস্যুর তারিখ: <strong className="text-slate-900">{issueDateBn}</strong>
              </span>
            </div>

            {/* 3. Official Estimate Title Banner */}
            <div className="rounded-lg bg-gradient-to-r from-[#2e0249] via-[#4c0575] to-[#2e0249] py-2.5 px-4 text-center text-white">
              <div className="text-sm sm:text-base font-extrabold text-amber-300">
                শিক্ষার্থী ভর্তি ও মাসিক খরচের অফিসিয়াল প্রাক্কলন বিবরণী
              </div>
              <div className="text-[10px] sm:text-[11px] text-purple-200 font-semibold tracking-wider uppercase">
                Official Student Admission &amp; Monthly Tuition Fee Estimate (Session 2027)
              </div>
            </div>

            {/* 4. Student & Program Particulars Block (Strictly Contained within A4 Width) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 p-3.5 rounded-xl bg-purple-50/80 border border-purple-200 text-xs">
              <div className="flex items-baseline justify-between gap-2 border-b border-purple-100 pb-1.5">
                <span className="text-purple-900 font-bold shrink-0">শিক্ষার্থীর নাম:</span>
                <strong className="text-slate-900 text-right truncate">
                  {studentNameForSheet.trim() || 'নির্ধারিত হয়নি (অভিভাবক কপি)'}
                </strong>
              </div>
              <div className="flex items-baseline justify-between gap-2 border-b border-purple-100 pb-1.5">
                <span className="text-purple-900 font-bold shrink-0">অভিভাবকের মোবাইল:</span>
                <strong className="text-slate-900 font-mono text-right truncate">
                  {guardianPhoneForSheet.trim() || settings.phonePrimary}
                </strong>
              </div>
              <div className="flex items-baseline justify-between gap-2 border-b border-purple-100 pb-1.5">
                <span className="text-purple-900 font-bold shrink-0">নির্বাচিত বিভাগ:</span>
                <strong className="text-purple-950 text-right truncate">
                  {selectedDept === 'Hifz' ? 'হিফজুল কুরআন বিভাগ' : 'জেনারেল / একাডেমিক বিভাগ'}
                </strong>
              </div>
              <div className="flex items-baseline justify-between gap-2 border-b border-purple-100 pb-1.5">
                <span className="text-purple-900 font-bold shrink-0">শিক্ষাবর্ষ / সেশন:</span>
                <strong className="text-slate-900 text-right">২০২৭ শিক্ষাবর্ষ (Session 2027)</strong>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-purple-900 font-bold shrink-0">নির্বাচিত শ্রেণি / স্তর:</span>
                <strong className="text-slate-900 text-right truncate">{activeItem.classNameBn}</strong>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-purple-900 font-bold shrink-0">আবাসন ব্যবস্থা:</span>
                <strong className="text-slate-900 text-right truncate">{safeAccomShortLabel}</strong>
              </div>
            </div>

            {/* 5. Itemized Fee Breakdown Table */}
            <div className="overflow-hidden rounded-xl border border-slate-300">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#2e0249] text-white">
                    <th className="py-2.5 px-3 w-10 text-center">নং</th>
                    <th className="py-2.5 px-3">খাতের বিবরণ (Fee Particulars)</th>
                    <th className="py-2.5 px-3 hidden sm:table-cell text-center">প্রদেয় ধরন</th>
                    <th className="py-2.5 px-3 text-right">পরিমাণ (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-white">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">০১</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      নির্ধারিত মূল ভর্তি ফি (Regular Admission Fee)
                    </td>
                    <td className="py-2.5 px-3 hidden sm:table-cell text-center text-slate-600">
                      এককালীন
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatMoneyBn(summary.baseAdmissionFee)} ({formatMoneyEn(summary.baseAdmissionFee)})
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/50">
                    <td className="py-2.5 px-3 text-center font-mono text-emerald-700">০২</td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-800">
                      প্রযোজ্য বিশেষ ডিসকাউন্ট ছাড় ({toBengaliDigits(summary.totalDiscountPercent)}%)
                    </td>
                    <td className="py-2.5 px-3 hidden sm:table-cell text-center text-emerald-700">
                      বিশেষ ছাড়
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                      - {formatMoneyBn(summary.discountAmount)} ({formatMoneyEn(summary.discountAmount)})
                    </td>
                  </tr>
                  <tr className="bg-purple-50/90 font-bold">
                    <td className="py-2.5 px-3 text-center font-mono text-purple-900">০৩</td>
                    <td className="py-2.5 px-3 text-purple-950">
                      ছাড় পরবর্তী নিট ভর্তি ফি (Net Admission Fee)
                    </td>
                    <td className="py-2.5 px-3 hidden sm:table-cell text-center text-purple-900">
                      ভর্তির সময় প্রদেয়
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-purple-950 whitespace-nowrap">
                      {formatMoneyBn(summary.netAdmissionFee)} ({formatMoneyEn(summary.netAdmissionFee)})
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">০৪</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      মাসিক একাডেমিক / হিফজ টিউশন বেতন (Monthly Tuition)
                    </td>
                    <td className="py-2.5 px-3 hidden sm:table-cell text-center text-slate-600">
                      মাসিক
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatMoneyBn(summary.monthlyTuitionFee)} ({formatMoneyEn(summary.monthlyTuitionFee)})
                    </td>
                  </tr>
                  <tr className="bg-slate-50/70">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">০৫</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      মাসিক আবাসন / ডে-কেয়ার চার্জ ({safeAccomShortLabel})
                    </td>
                    <td className="py-2.5 px-3 hidden sm:table-cell text-center text-slate-600">
                      মাসিক
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatMoneyBn(summary.accommodationMonthlyFee)} ({formatMoneyEn(summary.accommodationMonthlyFee)})
                    </td>
                  </tr>
                  <tr className="bg-purple-100/70 font-bold">
                    <td className="py-2.5 px-3 text-center font-mono text-purple-950">০৬</td>
                    <td className="py-2.5 px-3 text-purple-950">
                      প্রতি মাসের সর্বমোট খরচ (মাসিক বেতন + আবাসন/ডে-কেয়ার)
                    </td>
                    <td className="py-2.5 px-3 hidden sm:table-cell text-center text-purple-900">
                      প্রতি মাসে প্রদেয়
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-purple-950 whitespace-nowrap">
                      {formatMoneyBn(summary.totalMonthlyFee)} ({formatMoneyEn(summary.totalMonthlyFee)})
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 6. Grand Total Payable at Admission Box */}
            <div className="rounded-xl bg-gradient-to-r from-[#2e0249] to-[#581c87] p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-sm sm:text-base font-extrabold text-amber-300">
                  ভর্তির সময় সর্বমোট প্রদেয় (Total Payable at Admission)
                </div>
                <div className="text-[11px] text-purple-200">
                  নিট ভর্তি ফি ({formatMoneyBn(summary.netAdmissionFee)}) + ১ম মাসের সর্বমোট বেতন ({formatMoneyBn(summary.totalMonthlyFee)}) একত্রে
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-2xl font-extrabold text-amber-300 font-mono">
                  {formatMoneyEn(summary.totalPayableAtAdmission)}
                </div>
                <div className="text-xs font-bold text-white">
                  {formatMoneyBn(summary.totalPayableAtAdmission)}
                </div>
              </div>
            </div>

            {/* 7. Required Documents & Institutional Instructions */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-[11px] text-slate-700 space-y-1">
              <div className="font-bold text-slate-900 text-xs">
                ভর্তির নিয়মাবলি ও প্রয়োজনীয় ডকুমেন্টস:
              </div>
              <div>• শিক্ষার্থীর পাসপোর্ট সাইজের ৪ কপি রঙিন ছবি এবং অনলাইন জন্ম নিবন্ধন সনদের ফটোকপি।</div>
              <div>• পিতা ও মাতার জাতীয় পরিচয়পত্র (NID) অথবা পাসপোর্টের ফটোকপি।</div>
              <div>
                • বাৎসরিক সার্ভিস চার্জ: ৳ {toBengaliDigits(summary.annualServiceCharge)}/- (আইডি কার্ড, ডায়েরি, সিলেবাস ও ল্যাব চার্জ)।
              </div>
            </div>

            {/* 8. Official 3-Column Signature Block */}
            <div className="grid grid-cols-3 gap-4 pt-8 pb-2 text-center text-[11px]">
              <div className="border-t border-dashed border-slate-400 pt-1.5">
                <div className="font-bold text-slate-800">অভিভাবকের স্বাক্ষর</div>
                <div className="text-[10px] text-slate-500">তারিখ সহ</div>
              </div>
              <div className="border-t border-dashed border-slate-400 pt-1.5">
                <div className="font-bold text-slate-800">হিসাব ও ভর্তি কর্মকর্তা</div>
                <div className="text-[10px] text-slate-500">{settings.instituteNameBn}</div>
              </div>
              <div className="border-t border-dashed border-slate-400 pt-1.5">
                <div className="font-bold text-purple-950">অধ্যক্ষ / পরিচালক</div>
                <div className="text-[10px] text-slate-500">(অফিসিয়াল সিলমোহর)</div>
              </div>
            </div>

            {/* 9. Official Letterhead Footer with Contact Details */}
            <div className="pt-3 border-t-2 border-[#2e0249] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10.5px] text-slate-600">
              <div>
                <strong>যোগাযোগ:</strong> {settings.address} | হটলাইন: {settings.phonePrimary}
              </div>
              <div>
                <strong>ওয়েবসাইট:</strong> maharatmadrasah.com | <strong>ইমেইল:</strong> {settings.email}
              </div>
            </div>

            {/* Action Buttons (Hidden when printing) */}
            <div className="no-print flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={handlePrintOfficialLetterhead}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                <span>অফিসিয়াল প্যাড প্রিন্ট করুন (A4)</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadA4Picture}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                <span>A4 ইমেজ ডাউনলোড (PNG)</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadA4Pdf}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>অফিসিয়াল A4 PDF ডাউনলোড</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
