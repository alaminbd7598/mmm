import { jsPDF } from 'jspdf';
import { toDataURL as qrToDataURL } from 'qrcode';
import { AdminUser, AdmissionToken2027, HafizGraduateItem } from '../types/cms';
import { recomputeTokenTotals } from './admissionToken2027Logic';

// ============================================================================
// Shared drawing helpers
// ============================================================================

type RGB = [number, number, number];
type Align = 'left' | 'center' | 'right';
type SignatorySlot = 'chairman' | 'principal' | 'coordinator';

const NAVY: RGB = [25, 47, 100]; // #192f64
const NAVY_DEEP: RGB = [10, 23, 56]; // #0a1738
const TEAL: RGB = [0, 90, 110]; // #005a6e
const GOLD: RGB = [196, 150, 44]; // #c4962c
const INK: RGB = [30, 41, 59];
const MUTED: RGB = [100, 116, 139];
const WHITE: RGB = [255, 255, 255];

const DEFAULT_ORIGIN = 'https://maharatmadrasah.edu.bd';
const WEB_FONT_STACK = "'Hind Siliguri', 'Amiri', 'Cairo', sans-serif";
const PT_TO_MM = 0.3528;
const RASTER_PX = 72; // glyph size used for the offscreen canvas (high resolution)
// Canvas height / baseline as multiples of the glyph size. Generous on purpose:
// Bangla matras and stacked conjuncts reach well above and below the Latin box.
const RASTER_BOX = 2;
const RASTER_BASELINE = 1.3;
const RASTER_PAD = 16; // horizontal padding (px) so overhanging glyphs are not clipped

/**
 * Maps typographic punctuation that Helvetica (WinAnsi via jsPDF) cannot encode to
 * plain ASCII, so otherwise-Latin strings such as "Class 3 \u2013 Class 5" stay vector text.
 */
const normalizePunctuation = (text: string): string =>
  text
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u2022/g, '\u00B7')
    .replace(/[\u200B\u2060\uFEFF]/g, '')
    .replace(/[\u2000-\u200A\u202F]/g, ' ');

/** True when jsPDF's built-in Helvetica (WinAnsi) can draw the whole string. */
const isLatin = (text: string): boolean => /^[\u0020-\u007E\u00A0-\u00FF]*$/.test(text);

/** Removes everything Helvetica cannot draw; used only when no canvas is available. */
const toLatin = (text: string): string =>
  text
    .replace(/[^\u0020-\u007E\u00A0-\u00FF]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const money = (n: number): string => (Number(n) || 0).toLocaleString('en-IN');

const rasterCache = new Map<string, { dataUrl: string; ratio: number } | null>();

/**
 * Draws Bangla / Arabic text onto an offscreen canvas with the page webfont and
 * returns it as a PNG (jsPDF's built-in fonts have no glyphs for these scripts).
 * Returns null when no canvas is available (SSR, tests, blocked canvas).
 */
function rasterizeText(text: string, bold: boolean, color: RGB): { dataUrl: string; ratio: number } | null {
  const key = `${bold ? 'b' : 'n'}|${color.join(',')}|${text}`;
  const cached = rasterCache.get(key);
  if (cached !== undefined) return cached;

  let result: { dataUrl: string; ratio: number } | null = null;
  try {
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const font = `${bold ? 700 : 500} ${RASTER_PX}px ${WEB_FONT_STACK}`;
        ctx.font = font;
        const width = Math.ceil(ctx.measureText(text).width) + RASTER_PAD * 2;
        const height = Math.ceil(RASTER_PX * RASTER_BOX);
        if (width > RASTER_PAD * 2 && width < 16000) {
          canvas.width = width;
          canvas.height = height;
          ctx.font = font; // resizing the canvas resets the context state
          ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
          ctx.textBaseline = 'alphabetic';
          ctx.textAlign = 'center';
          ctx.fillText(text, width / 2, RASTER_PX * RASTER_BASELINE);
          const dataUrl = canvas.toDataURL('image/png');
          if (dataUrl.startsWith('data:image/png')) result = { dataUrl, ratio: width / height };
        }
      }
    }
  } catch {
    result = null;
  }
  rasterCache.set(key, result);
  return result;
}

/** Waits (briefly) for the webfont subsets needed by the given strings. */
async function ensureWebFonts(samples: Array<string | undefined>): Promise<void> {
  // Start every export from a clean cache so text rasterised before a webfont arrived is not reused.
  rasterCache.clear();
  const text = samples
    .map((s) => normalizePunctuation(String(s ?? '')))
    .filter((s) => s && !isLatin(s))
    .join(' ');
  if (!text || typeof document === 'undefined' || !document.fonts?.load) return;
  // Hind Siliguri covers Bangla + Latin; Amiri / Cairo are only fetched for Arabic text.
  const families = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)
    ? ["'Hind Siliguri'", "'Amiri'", "'Cairo'"]
    : ["'Hind Siliguri'"];
  try {
    await Promise.race([
      Promise.all(
        families.flatMap((family) => [
          document.fonts.load(`500 ${RASTER_PX}px ${family}`, text),
          document.fonts.load(`700 ${RASTER_PX}px ${family}`, text),
        ])
      ),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
  } catch {
    // Fall back to whatever sans-serif the browser has.
  }
}

interface TextOptions {
  size: number; // pt
  color?: RGB;
  bold?: boolean;
  italic?: boolean;
  align?: Align;
  maxWidth?: number; // mm
  fallback?: string; // Latin text used when the canvas is unavailable
}

/**
 * Script-aware text: Latin goes through jsPDF's vector Helvetica, anything else
 * is embedded as a rasterised image aligned on the same baseline.
 */
function putText(doc: jsPDF, raw: string, x: number, y: number, o: TextOptions): void {
  let text = normalizePunctuation((raw ?? '').toString()).replace(/\s+/g, ' ').trim();
  if (!text) return;
  // Helvetica has no Taka sign: an otherwise-Latin label keeps vector text with "Tk".
  const takaAsLatin = text.replace(/\u09F3\s*/g, 'Tk ').trim();
  if (isLatin(takaAsLatin)) text = takaAsLatin;
  const color = o.color ?? INK;
  const align = o.align ?? 'left';

  if (!isLatin(text)) {
    const img = rasterizeText(text, !!o.bold, color);
    if (img) {
      let h = o.size * PT_TO_MM * RASTER_BOX;
      let w = h * img.ratio;
      if (o.maxWidth && w > o.maxWidth) {
        h *= o.maxWidth / w;
        w = o.maxWidth;
      }
      const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
      doc.addImage(img.dataUrl, 'PNG', left, y - h * (RASTER_BASELINE / RASTER_BOX), w, h, undefined, 'FAST');
      return;
    }
  }

  let latin = isLatin(text) ? text : normalizePunctuation(o.fallback?.trim() || '') || toLatin(text);
  if (!latin) return;
  let size = o.size;
  doc.setFont('helvetica', o.bold ? (o.italic ? 'bolditalic' : 'bold') : o.italic ? 'italic' : 'normal');
  doc.setFontSize(size);
  if (o.maxWidth) {
    while (doc.getTextWidth(latin) > o.maxWidth && size > o.size * 0.7) {
      size -= 0.25;
      doc.setFontSize(size);
    }
    if (doc.getTextWidth(latin) > o.maxWidth) {
      while (latin.length > 1 && doc.getTextWidth(`${latin}...`) > o.maxWidth) latin = latin.slice(0, -1);
      latin = `${latin.trimEnd()}...`;
    }
  }
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(latin, x, y, { align });
}

const findSignatory = (users: AdminUser[] | undefined, slot: SignatorySlot): AdminUser | undefined =>
  (Array.isArray(users) ? users : []).find((u) => u?.signatorySlot === slot);

/**
 * Signature block: embedded signature image (when the staff member saved one),
 * a rule, the signatory name and the role caption. A broken image never aborts the PDF.
 */
function drawSignatureBlock(
  doc: jsPDF,
  user: AdminUser | undefined,
  caption: string,
  cx: number,
  lineY: number,
  width: number,
  scale = 1
): void {
  const sig = user?.signatureDataUrl;
  if (sig && /^data:image\/(png|jpe?g|webp);base64,/i.test(sig)) {
    try {
      const props = doc.getImageProperties(sig);
      const maxW = width * 0.8;
      const maxH = 13 * scale;
      const ratio = props.width > 0 && props.height > 0 ? props.width / props.height : 3;
      let w = maxW;
      let h = w / ratio;
      if (h > maxH) {
        h = maxH;
        w = h * ratio;
      }
      const format = /^data:image\/png/i.test(sig) ? 'PNG' : /^data:image\/webp/i.test(sig) ? 'WEBP' : 'JPEG';
      doc.addImage(sig, format, cx - w / 2, lineY - h - 0.6, w, h, undefined, 'FAST');
    } catch {
      // Leave the line blank for a wet-ink signature.
    }
  }
  doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.setLineWidth(0.3);
  doc.line(cx - width / 2, lineY, cx + width / 2, lineY);
  let y = lineY + 4 * scale;
  if (user?.fullName?.trim()) {
    putText(doc, user.fullName, cx, y, { size: 9 * scale, bold: true, color: NAVY, align: 'center', maxWidth: width });
    y += 3.8 * scale;
  }
  putText(doc, caption, cx, y, { size: 7.5 * scale, color: MUTED, align: 'center', maxWidth: width });
}

const safeFilePart = (value: string): string =>
  (value || '').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'document';

// ============================================================================
// 1) Hifzul Quran honour certificate (A4 landscape, QR-verified)
// ============================================================================

export interface HafizCertificatePdfOptions {
  grad: HafizGraduateItem;
  totalHuffaz: number;
  users: AdminUser[];
  origin?: string;
}

/**
 * The code encoded in the QR. It must be resolvable by findHafizByCertificateCode
 * (admissionToken2027Logic.ts): explicit certificateCode, else MMM-HFZ-<year>-<2-digit serial>.
 */
function resolveVerifiableCertificateCode(grad: HafizGraduateItem): string {
  const explicit = grad.certificateCode?.trim();
  if (explicit) return explicit;
  return `MMM-HFZ-${grad.completionYear}-${String(grad.serialNumber).padStart(2, '0')}`;
}

export async function generateHafizCertificatePdf(opts: HafizCertificatePdfOptions): Promise<void> {
  const { grad, totalHuffaz, users } = opts;
  if (!grad) throw new Error('Hafiz graduate record is required to generate a certificate.');

  const browserOrigin = typeof window !== 'undefined' ? window.location?.origin : '';
  const origin = (opts.origin || browserOrigin || DEFAULT_ORIGIN).replace(/\/+$/, '');
  const code = resolveVerifiableCertificateCode(grad);
  const verifyUrl = `${origin}/?verify-cert=${encodeURIComponent(code)}`;

  const madrasahBn = 'মাহারাত মডেল মাদ্রাসা';
  const titleBn = 'হিফজুল কুরআন সম্মাননা সনদ';
  await ensureWebFonts([
    madrasahBn,
    titleBn,
    grad.nameBn,
    grad.serialLabelBn,
    grad.classNameBn,
    grad.completionDate,
    grad.durationNoteBn,
    grad.fatherNameBn || '',
    grad.teacherNameBn || '',
    ...(users || []).map((u) => u?.fullName || ''),
  ]);

  const qrDataUrl = await qrToDataURL(verifyUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 320,
    color: { dark: '#0a1738', light: '#ffffff' },
  });

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297;
  const H = 210;
  const cx = W / 2;

  // Parchment background and triple frame
  doc.setFillColor(253, 251, 244);
  doc.rect(0, 0, W, H, 'F');
  doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.setLineWidth(2.2);
  doc.rect(8, 8, W - 16, H - 16, 'D');
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(0.8);
  doc.rect(11.5, 11.5, W - 23, H - 23, 'D');
  doc.setLineWidth(0.25);
  doc.rect(13.5, 13.5, W - 27, H - 27, 'D');

  // Corner ornaments
  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  [
    [11.5, 11.5],
    [W - 11.5, 11.5],
    [11.5, H - 11.5],
    [W - 11.5, H - 11.5],
  ].forEach(([px, py]) => {
    doc.triangle(px - 3.2, py, px, py - 3.2, px + 3.2, py, 'F');
    doc.triangle(px - 3.2, py, px, py + 3.2, px + 3.2, py, 'F');
  });

  // Institution header
  putText(doc, 'MAHARAT MODEL MADRASAH', cx, 30, { size: 24, bold: true, color: NAVY, align: 'center' });
  putText(doc, madrasahBn, cx, 38.5, { size: 13, bold: true, color: TEAL, align: 'center', fallback: 'A Madrasah with Excellence' });
  putText(doc, 'Uttara, Dhaka, Bangladesh  |  EIIN: 140630  |  Madrasah Code: 21023', cx, 44.5, {
    size: 8.5,
    color: MUTED,
    align: 'center',
  });

  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(0.5);
  doc.line(cx - 62, 48.5, cx + 62, 48.5);
  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.circle(cx, 48.5, 1.2, 'F');

  // Title ribbon
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.roundedRect(cx - 78, 53, 156, 13, 2.5, 2.5, 'F');
  putText(doc, 'CERTIFICATE OF HIFZUL QURAN', cx, 61.8, { size: 17, bold: true, color: [240, 201, 94], align: 'center' });
  putText(doc, titleBn, cx, 73.5, { size: 12, bold: true, color: GOLD, align: 'center', fallback: 'Hifzul Quran Honour Certificate' });

  // Recipient
  putText(doc, 'This is to certify, with praise and gratitude to Almighty Allah, that', cx, 84, {
    size: 11,
    italic: true,
    color: INK,
    align: 'center',
  });
  const nameEn = grad.nameEn?.trim() || toLatin(grad.nameBn || '') || 'Hafiz';
  const hasBnName = !!grad.nameBn?.trim() && !isLatin(normalizePunctuation(grad.nameBn));
  if (hasBnName && rasterizeText(grad.nameBn.trim(), true, NAVY)) {
    putText(doc, grad.nameBn, cx, 99, { size: 25, bold: true, color: NAVY, align: 'center', maxWidth: 200 });
    putText(doc, nameEn, cx, 108.5, { size: 13, bold: true, color: TEAL, align: 'center', maxWidth: 200 });
  } else {
    putText(doc, nameEn, cx, 101, { size: 26, bold: true, color: NAVY, align: 'center', maxWidth: 200 });
  }
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(0.35);
  doc.line(cx - 70, 112, cx + 70, 112);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  const body = doc.splitTextToSize(
    'has successfully completed the memorisation (Hifz) of the entire Holy Quran, all thirty Paras, at Maharat Model Madrasah, ' +
      'and is hereby honoured with the title of Hafiz of the Holy Quran. May Allah accept this noble achievement and make the Quran a light in this life and the next.',
    220
  ) as string[];
  doc.text(body, cx, 119.5, { align: 'center', lineHeightFactor: 1.45 });

  // Detail strip
  const stripY = 137;
  doc.setFillColor(244, 239, 224);
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(0.25);
  doc.roundedRect(24, stripY, W - 48, 15, 2, 2, 'FD');
  const total = Math.max(Number(totalHuffaz) || 0, Number(grad.serialNumber) || 0);
  const details: { label: string; value: string; fallback: string }[] = [
    {
      label: 'HAFIZ SERIAL',
      value: `No. ${grad.serialNumber}${total ? ` of ${total}` : ''}`,
      fallback: `No. ${grad.serialNumber}`,
    },
    { label: 'CLASS', value: grad.classNameBn || '-', fallback: '-' },
    { label: 'DATE OF COMPLETION', value: grad.completionDate || grad.completionYear || '-', fallback: grad.completionYear || '-' },
    { label: 'DURATION', value: grad.durationNoteBn || '-', fallback: '-' },
    { label: 'CERTIFICATE CODE', value: code, fallback: code },
  ];
  const colW = (W - 48) / details.length;
  details.forEach((d, i) => {
    const dx = 24 + colW * i + colW / 2;
    putText(doc, d.label, dx, stripY + 5, { size: 6.5, bold: true, color: TEAL, align: 'center' });
    putText(doc, d.value, dx, stripY + 11.2, {
      size: 9.5,
      bold: true,
      color: NAVY,
      align: 'center',
      maxWidth: colW - 4,
      fallback: d.fallback,
    });
    if (i > 0) {
      doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
      doc.line(24 + colW * i, stripY + 2.5, 24 + colW * i, stripY + 12.5);
    }
  });

  // QR verification panel (bottom-left)
  const qrSize = 30;
  const qrX = 24;
  const qrY = 157;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(qrX - 1.5, qrY - 1.5, qrSize + 3, qrSize + 3, 1.5, 1.5, 'FD');
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize, undefined, 'FAST');
  doc.link(qrX, qrY, qrSize, qrSize, { url: verifyUrl });
  putText(doc, 'SCAN TO VERIFY', qrX + qrSize / 2, qrY + qrSize + 5.2, { size: 6.5, bold: true, color: NAVY, align: 'center' });

  // Signatures (auto-embedded from the staff signature vault)
  const sigLineY = 178;
  const sigW = 52;
  const blocks: { slot: SignatorySlot; caption: string; x: number }[] = [
    { slot: 'coordinator', caption: 'Hifz Coordinator', x: 99 },
    { slot: 'principal', caption: 'Principal', x: 167 },
    { slot: 'chairman', caption: 'Chairman', x: 235 },
  ];
  blocks.forEach((b) => drawSignatureBlock(doc, findSignatory(users, b.slot), b.caption, b.x, sigLineY, sigW));

  // Footer
  const issued = new Date().toISOString().slice(0, 10);
  putText(doc, `Verify online: ${verifyUrl}`, cx + 18, 190.4, { size: 7, color: MUTED, align: 'center', maxWidth: 190 });
  putText(doc, `Issued on ${issued}  |  This certificate is digitally generated and QR-verifiable.`, cx + 18, 193.6, {
    size: 6.5,
    color: MUTED,
    align: 'center',
  });

  doc.setProperties({
    title: `Hifzul Quran Certificate - ${nameEn}`,
    subject: `Certificate code ${code}`,
    author: 'Maharat Model Madrasah',
    creator: 'Maharat Model Madrasah CMS',
  });
  doc.save(`MMM_Hifz_Certificate_${safeFilePart(code)}.pdf`);
}

// ============================================================================
// 2) Admission Token 2027 (A4 landscape, Office Copy + Guardian Copy)
// ============================================================================

const STAY_MODE_LABEL: Record<AdmissionToken2027['stayMode'], string> = {
  'non-residential': 'Non-Residential',
  'day-care': 'Day Care',
  hostel: 'Hostel (Residential)',
};

function drawTokenCopy(doc: jsPDF, token: AdmissionToken2027, users: AdminUser[], x0: number, copyLabel: string): void {
  const m = 7;
  const x = x0 + m;
  const w = 148.5 - m * 2;
  const right = x + w;

  // Header banner
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.rect(x, 7, w, 17, 'F');
  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.rect(x, 24, w, 1, 'F');
  putText(doc, 'MAHARAT MODEL MADRASAH', x + 3, 13.5, { size: 12, bold: true, color: WHITE });
  putText(doc, 'Official Admission Fee Token - Session 2027', x + 3, 18, { size: 7.5, color: [214, 226, 245] });
  putText(doc, 'EIIN: 140630  |  Uttara, Dhaka  |  Tel: 01886-340308', x + 3, 21.6, { size: 6, color: [190, 205, 232] });
  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.roundedRect(right - 33, 10.2, 30, 7, 1.5, 1.5, 'F');
  putText(doc, copyLabel.toUpperCase(), right - 18, 14.9, { size: 7.5, bold: true, color: NAVY_DEEP, align: 'center' });
  putText(doc, `Status: ${token.status || 'Active'}`, right - 18, 21.4, { size: 6.5, bold: true, color: WHITE, align: 'center' });

  // Token code bar
  doc.setFillColor(232, 242, 245);
  doc.setDrawColor(TEAL[0], TEAL[1], TEAL[2]);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, 27, w, 7.5, 1.2, 1.2, 'FD');
  putText(doc, 'TOKEN CODE:', x + 2.5, 32, { size: 7, bold: true, color: TEAL });
  putText(doc, token.tokenCode || token.id, x + 22, 32.1, { size: 9, bold: true, color: NAVY, maxWidth: 62 });
  putText(doc, `Admission Date: ${token.admissionDate || '-'}`, right - 2.5, 32, {
    size: 7.5,
    bold: true,
    color: INK,
    align: 'right',
    maxWidth: 46,
  });

  // Student information grid (2 columns)
  const fields: [string, string][] = [
    ['Student Name', token.studentName || '-'],
    ['Student ID No', token.studentIdNo || '-'],
    ['Class', token.classNameLabel || token.classKey || '-'],
    ['Student Type', `${token.studentType === 'old' ? 'Existing' : 'New'} Student  |  ${token.section === 'Hifz' ? 'Hifz' : 'General'} Section`],
    ['Stay Mode', `${STAY_MODE_LABEL[token.stayMode] || token.stayMode}${token.transport ? '  |  Transport' : ''}`],
    ['Guardian Phone', token.guardianPhone || '-'],
  ];
  if (token.guardianEmail?.trim()) fields.push(['Guardian Email', token.guardianEmail.trim()]);
  const half = w / 2;
  fields.forEach(([label, value], i) => {
    const fx = x + (i % 2) * half;
    const fy = 40 + Math.floor(i / 2) * 5;
    putText(doc, `${label}:`, fx + 1, fy, { size: 6.8, bold: true, color: TEAL });
    putText(doc, value, fx + 24, fy, { size: 7.6, bold: i === 0, color: INK, maxWidth: half - 26 });
  });
  let y = 40 + Math.ceil(fields.length / 2) * 5 - 1.5;

  // Fee table: #, description, fixed, payable, comment
  const colNo = 7;
  const colFixed = 19;
  const colPay = 21;
  const colCmt = 30;
  const colDesc = w - colNo - colFixed - colPay - colCmt;
  const xDesc = x + colNo;
  const xFixed = xDesc + colDesc;
  const xPay = xFixed + colFixed;
  const xCmt = xPay + colPay;
  const tableTop = y;

  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.rect(x, y, w, 6, 'F');
  putText(doc, '#', x + colNo / 2, y + 4, { size: 7, bold: true, color: WHITE, align: 'center' });
  putText(doc, 'Fee Item Description', xDesc + 1.5, y + 4, { size: 7, bold: true, color: WHITE });
  putText(doc, 'Fixed (Tk)', xPay - 1.5, y + 4, { size: 7, bold: true, color: WHITE, align: 'right' });
  putText(doc, 'Payable (Tk)', xCmt - 1.5, y + 4, { size: 7, bold: true, color: WHITE, align: 'right' });
  putText(doc, 'Comment', xCmt + 1.5, y + 4, { size: 7, bold: true, color: WHITE });
  y += 6;

  const items = Array.isArray(token.lineItems) ? token.lineItems : [];
  const rowCount = items.length;
  const rowH = rowCount > 12 ? Math.max(4, 62 / rowCount) : 5.6;
  (['A', 'B'] as const).forEach((part) => {
    const rows = items.filter((r) => r.part === part);
    doc.setFillColor(226, 232, 240);
    doc.rect(x, y, w, 5, 'F');
    const from = rows.length ? Math.min(...rows.map((r) => r.no)) : 0;
    const to = rows.length ? Math.max(...rows.map((r) => r.no)) : 0;
    const range = rows.length ? ` (Items ${from}-${to})` : '';
    putText(
      doc,
      part === 'A' ? `PART A: ONE-TIME ADMISSION FEES${range}` : `PART B: FIRST MONTH'S FEES${range}`,
      x + 2,
      y + 3.5,
      { size: 6.8, bold: true, color: TEAL }
    );
    y += 5;
    rows.forEach((row, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(x, y, w, rowH, 'F');
      }
      const ty = y + rowH / 2 + 1.2;
      const fixed = Math.max(0, Number(row.fixedAmount) || 0);
      const payable = Math.max(0, Number(row.payableAmount) || 0);
      putText(doc, String(row.no), x + colNo / 2, ty, { size: 7, bold: true, color: MUTED, align: 'center' });
      putText(doc, row.labelEn || row.labelBn || '-', xDesc + 1.5, ty, {
        size: 7.2,
        color: INK,
        maxWidth: colDesc - 3,
        fallback: `Fee item ${row.no}`,
      });
      putText(doc, fixed > 0 ? money(fixed) : '-', xPay - 1.5, ty, { size: 7.2, color: MUTED, align: 'right' });
      putText(doc, money(payable), xCmt - 1.5, ty, { size: 7.6, bold: true, color: NAVY, align: 'right' });
      if (row.comment?.trim()) {
        putText(doc, row.comment, xCmt + 1.5, ty, { size: 6.5, color: INK, maxWidth: colCmt - 3 });
      }
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.15);
      doc.line(x, y + rowH, right, y + rowH);
      y += rowH;
    });
  });
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.25);
  doc.rect(x, tableTop, w, y - tableTop, 'D');
  [xDesc, xFixed, xPay, xCmt].forEach((vx) => doc.line(vx, tableTop, vx, tableTop + 6));

  // Totals (same figures as the on-screen summary box)
  const computed = recomputeTokenTotals(items);
  const subtotalA = Number.isFinite(Number(token.subtotalA)) ? Number(token.subtotalA) : computed.subtotalA;
  const subtotalB = Number.isFinite(Number(token.subtotalB)) ? Number(token.subtotalB) : computed.subtotalB;
  const grandTotal = Number.isFinite(Number(token.grandTotal)) ? Number(token.grandTotal) : computed.grandTotal;
  const discount = Math.max(0, Number(token.totalDiscount ?? computed.totalDiscount) || 0);

  y += 2.5;
  const totalRows: [string, string, RGB][] = [
    ['Part A (One-Time Fees)', `Tk ${money(subtotalA)}`, INK],
    ['Part B (First Month Fees)', `Tk ${money(subtotalB)}`, INK],
  ];
  if (discount > 0) totalRows.push(['Total Waiver / Discount', `- Tk ${money(discount)}`, [4, 120, 87]]);
  const boxH = totalRows.length * 4.6 + 10.5;
  doc.setFillColor(240, 247, 248);
  doc.setDrawColor(TEAL[0], TEAL[1], TEAL[2]);
  doc.roundedRect(x, y, w, boxH, 1.5, 1.5, 'FD');
  let ty = y + 4.6;
  totalRows.forEach(([label, value, color]) => {
    putText(doc, label, x + 3, ty, { size: 7.5, color });
    putText(doc, value, right - 3, ty, { size: 7.8, bold: true, color, align: 'right' });
    ty += 4.6;
  });
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.roundedRect(x + 1.5, ty - 2.4, w - 3, 7.2, 1.2, 1.2, 'F');
  putText(doc, 'GRAND TOTAL PAYABLE (A + B)', x + 4, ty + 2.4, { size: 8, bold: true, color: WHITE });
  putText(doc, `Tk ${money(grandTotal)}`, right - 4, ty + 2.5, { size: 10, bold: true, color: [240, 201, 94], align: 'right' });
  y += boxH + 4.5;

  if (token.generalNote?.trim()) {
    putText(doc, 'Note:', x + 1, y, { size: 7, bold: true, color: TEAL });
    putText(doc, token.generalNote, x + 10, y, { size: 7, color: INK, maxWidth: w - 11 });
    y += 4.5;
  }

  // Signatures
  const sigY = 188;
  const sigW = (w - 12) / 3;
  const issuer: AdminUser | undefined = token.issuedBy
    ? (users || []).find((u) => u?.fullName === token.issuedBy) ||
      ({ fullName: token.issuedBy } as AdminUser)
    : undefined;
  drawSignatureBlock(doc, undefined, 'Guardian Signature', x + sigW / 2, sigY, sigW, 0.85);
  drawSignatureBlock(doc, issuer, 'Issued By (Accounts / Office)', x + w / 2, sigY, sigW, 0.85);
  drawSignatureBlock(doc, findSignatory(users, 'principal'), 'Principal', right - sigW / 2, sigY, sigW, 0.85);

  putText(
    doc,
    'Fees once paid are non-refundable. Please preserve this token and present it at the accounts office.',
    x + w / 2,
    201,
    { size: 6, italic: true, color: MUTED, align: 'center', maxWidth: w }
  );
  putText(doc, `Generated ${new Date().toISOString().slice(0, 10)}  |  ${token.tokenCode || token.id}`, x + w / 2, 204, {
    size: 5.5,
    color: MUTED,
    align: 'center',
  });
}

export async function generateAdmissionToken2027Pdf(token: AdmissionToken2027, users: AdminUser[]): Promise<void> {
  if (!token) throw new Error('Admission token is required to generate the PDF.');
  const staff = Array.isArray(users) ? users : [];

  await ensureWebFonts([
    token.studentName,
    token.classNameLabel,
    token.generalNote || '',
    token.issuedBy || '',
    token.admissionDate,
    ...(token.lineItems || []).flatMap((r) => [r.labelEn, r.comment]),
    ...staff.map((u) => u?.fullName || ''),
  ]);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  drawTokenCopy(doc, token, staff, 0, 'Office Copy');
  drawTokenCopy(doc, token, staff, 148.5, 'Guardian Copy');

  // Cut line between the two copies
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(148.5, 5, 148.5, 205);
  doc.setLineDashPattern([], 0);

  doc.setProperties({
    title: `Admission Token 2027 - ${token.tokenCode || token.id}`,
    subject: 'Official Admission Fee Token (Office Copy and Guardian Copy)',
    author: 'Maharat Model Madrasah',
    creator: 'Maharat Model Madrasah CMS',
  });
  doc.save(`MMM_Admission_Token_2027_${safeFilePart(token.tokenCode || token.id)}.pdf`);
}
