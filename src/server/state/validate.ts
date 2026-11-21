/**
 * zod schemas for every state-changing payload handled in src/server/state:
 * staff sync ops, anonymous submissions (field whitelists derived from src/types/cms.ts and the
 * public forms that produce them), admission-token lookups and career candidate auth.
 * Zod objects strip unknown keys, so admin-only fields never get past these schemas.
 */
import { z } from 'zod';
import { isValidEmail, isValidPhone, toAsciiDigits } from '../../utils/contactValidation';
import { findUnsafeString, isAllowedUrlFieldValue } from '../../utils/safeUrl';
import {
  COLLECTION_KEYS,
  PUBLIC_CREATE_KEYS,
  SINGLETON_KEYS,
  type PublicCreateKey,
  type SyncOp,
} from '../contracts';

export const MAX_ID_LENGTH = 128;
export const MAX_SYNC_OPS = 2000;
/** Upper bound for ids in one `order` op or items in one `replace` op. */
export const MAX_COLLECTION_ITEMS = 20_000;
export const MAX_PUBLIC_ITEMS = 10;

export const MAX_PHOTO_BYTES = Math.floor(1.5 * 1024 * 1024);
export const MAX_DOCUMENT_BYTES = 3 * 1024 * 1024;
const MAX_URL_LENGTH = 2048;

// ---------------------------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------------------------

/** Human-readable reason from a zod error: first issue with its path. */
export function describeZodError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'Invalid input.';
  const path = issue.path.map(String).join('.');
  return path ? `${path}: ${issue.message}` : issue.message;
}

export const idSchema = z.string().min(1).max(MAX_ID_LENGTH);

const text = (max: number) => z.string().trim().max(max);
const requiredText = (max: number) => text(max).min(1);
const optionalText = (max: number) => text(max).optional();

const emailSchema = text(254).toLowerCase().refine(isValidEmail, 'Invalid email address.');
/** Phone as typed by visitors (any digit script); stored with ASCII digits. */
const phoneSchema = text(40).transform(toAsciiDigits).refine(isValidPhone, 'Invalid phone number.');

const DATA_URL_RE = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+)((?:;[a-z0-9-]+=[a-z0-9.+-]+)*);base64,([a-z0-9+/]*={0,2})$/i;

export interface ParsedDataUrl {
  mime: string;
  bytes: number;
}

/** MIME type and decoded size of a base64 data URL, or null when the string is not one. */
export function parseDataUrl(value: string): ParsedDataUrl | null {
  const match = DATA_URL_RE.exec(value);
  if (!match) return null;
  const payload = match[3];
  if (payload.length % 4 !== 0) return null;
  const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
  return { mime: match[1].toLowerCase(), bytes: (payload.length / 4) * 3 - padding };
}

const isHttpUrl = (value: string): boolean => {
  if (value.length > MAX_URL_LENGTH) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

const IMAGE_MIME = /^image\/(png|jpe?g|webp|gif)$/;
const DOCUMENT_MIME =
  /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|image\/(png|jpe?g|webp))$/;

/** An http(s) link or a base64 data URL of an allowed type within the size limit (empty allowed). */
function uploadSchema(allowedMime: RegExp, maxBytes: number, label: string) {
  return z
    .string()
    .max(Math.ceil((maxBytes * 4) / 3) + 256)
    .superRefine((value, ctx) => {
      if (value === '' || isHttpUrl(value)) return;
      const parsed = parseDataUrl(value);
      if (!parsed) {
        ctx.addIssue({ code: 'custom', message: `${label} must be a link or an uploaded file.` });
      } else if (!allowedMime.test(parsed.mime)) {
        ctx.addIssue({ code: 'custom', message: `${label} has an unsupported file type.` });
      } else if (parsed.bytes > maxBytes) {
        ctx.addIssue({ code: 'custom', message: `${label} is too large.` });
      }
    });
}

export const studentPhotoSchema = uploadSchema(IMAGE_MIME, MAX_PHOTO_BYTES, 'Student photo');
export const cvFileSchema = uploadSchema(DOCUMENT_MIME, MAX_DOCUMENT_BYTES, 'CV file');

// ---------------------------------------------------------------------------------------------
// Staff sync (POST /api/admin/sync)
// ---------------------------------------------------------------------------------------------

const syncItemSchema = z.looseObject({ id: idSchema });
const baseSchema = z.number().int().nonnegative().optional();

export const syncOpSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('set'), key: z.enum(SINGLETON_KEYS), value: z.record(z.string(), z.unknown()), base: baseSchema }),
  z.object({ op: z.literal('upsert'), key: z.enum(COLLECTION_KEYS), item: syncItemSchema, base: baseSchema }),
  z.object({ op: z.literal('delete'), key: z.enum(COLLECTION_KEYS), id: idSchema, base: baseSchema }),
  z.object({ op: z.literal('order'), key: z.enum(COLLECTION_KEYS), ids: z.array(idSchema).max(MAX_COLLECTION_ITEMS) }),
  z.object({
    op: z.literal('replace'),
    key: z.enum(COLLECTION_KEYS),
    items: z.array(syncItemSchema).max(MAX_COLLECTION_ITEMS),
  }),
]);

const syncEnvelopeSchema = z.object({
  baseVersion: z.number().int().nonnegative().optional(),
  ops: z.array(z.unknown()).max(MAX_SYNC_OPS),
});

export interface IndexedOp {
  /** Position of the op in the request. */
  index: number;
  op: SyncOp;
}

export interface ParsedSyncRequest {
  baseVersion: number;
  ops: IndexedOp[];
  invalid: Array<{ index: number; reason: string }>;
}

/**
 * Parse a sync request body. A malformed envelope is an error (returned as a string);
 * individual malformed ops are reported in `invalid` so the remaining ops can still apply.
 */
export function parseSyncRequest(body: unknown): { ok: true; value: ParsedSyncRequest } | { ok: false; error: string } {
  const envelope = syncEnvelopeSchema.safeParse(body);
  if (!envelope.success) return { ok: false, error: describeZodError(envelope.error) };
  const ops: IndexedOp[] = [];
  const invalid: ParsedSyncRequest['invalid'] = [];
  envelope.data.ops.forEach((raw, index) => {
    const parsed = syncOpSchema.safeParse(raw);
    if (parsed.success) ops.push({ index, op: parsed.data as SyncOp });
    else invalid.push({ index, reason: `Invalid op: ${describeZodError(parsed.error)}` });
  });
  return { ok: true, value: { baseVersion: envelope.data.baseVersion ?? 0, ops, invalid } };
}

// ---------------------------------------------------------------------------------------------
// Anonymous submissions (POST /api/public/submit)
// ---------------------------------------------------------------------------------------------

const DETAIL_TEXT_FIELDS = [
  'studentNameBn', 'studentNameEn', 'dob', 'age', 'gender', 'department', 'targetClass',
  'academicCategory', 'session', 'nidOrBirthReg', 'bloodGroup', 'nationality',
  'prevInstitute', 'prevClass', 'prevGpa',
  'fatherNameBn', 'fatherNameEn', 'fatherOccupation', 'fatherEducation', 'fatherMobile', 'fatherWhatsapp',
  'motherNameBn', 'motherNameEn', 'motherOccupation', 'motherEducation', 'motherMobile', 'motherWhatsapp',
  'guardianNameBn', 'guardianNameEn', 'guardianRelation', 'guardianMobile', 'guardianWhatsapp',
  'guardianOccupation', 'guardianAddress',
  'halalIncome', 'regularPrayer', 'drugAddictionInFamily', 'hasTelevision', 'quranRecitation', 'purdahMaintenance',
  'mobileUsageHours', 'generalBehavior', 'obeysParents', 'behaviorWithElders', 'behaviorWithYoungers',
  'liesOrStubborn', 'studyInterest', 'religiousInterest', 'angerControl', 'behaviorWithParents',
  'permanentVillage', 'permanentPost', 'permanentPostCode', 'permanentThana', 'permanentDistrict',
  'presentVillage', 'presentPost', 'presentPostCode', 'presentThana', 'presentDistrict',
] as const;

const DETAIL_BOOLEAN_FIELDS = ['fatherWhatsappSame', 'motherWhatsappSame', 'presentAddressSame', 'agreedToPledge'] as const;

const detailedAdmissionSchema = z.object({
  ...Object.fromEntries(DETAIL_TEXT_FIELDS.map((f) => [f, optionalText(500)])),
  ...Object.fromEntries(DETAIL_BOOLEAN_FIELDS.map((f) => [f, z.boolean().optional()])),
  studentPhotoUrl: studentPhotoSchema.optional(),
  submittedDocuments: z.array(text(200)).max(30).optional(),
}) as unknown as z.ZodType<import('../../types/cms').DetailedAdmissionData>;

export const PUBLIC_LEAD_SOURCES = ['Quick Inquiry', 'Full Admission Form', 'Registration Form'] as const;

export const publicLeadSchema = z.object({
  name: requiredText(200),
  phone: phoneSchema,
  email: z.union([z.literal(''), emailSchema]).default(''),
  courseId: optionalText(MAX_ID_LENGTH).default(''),
  message: text(5000).default(''),
  source: z.enum(PUBLIC_LEAD_SOURCES),
  guardianName: optionalText(200),
  guardianRelation: optionalText(100),
  preferredDepartment: optionalText(100),
  targetClass: optionalText(100),
  preferredAccommodation: optionalText(100),
  campusVisitDate: optionalText(100),
  marketingSourceTag: optionalText(100),
  detailedData: detailedAdmissionSchema.optional(),
});
export type PublicLeadInput = z.infer<typeof publicLeadSchema>;

export const COMPLAINT_CATEGORIES = [
  'অভিযোগ (Complaint)',
  'পরামর্শ (Suggestion)',
  'পরিবহন (Transport)',
  'একাডেমিক/হিফজ (Academic)',
] as const;

export const publicComplaintSchema = z.object({
  guardianName: requiredText(200),
  studentName: text(200).default(''),
  studentClass: text(100).default(''),
  phone: phoneSchema,
  category: z.enum(COMPLAINT_CATEGORIES),
  message: requiredText(5000),
});
export type PublicComplaintInput = z.infer<typeof publicComplaintSchema>;

/** Admin notification logged by the public forms. Recipient, type and status are set server-side. */
export const publicEmailSchema = z.object({
  subject: requiredText(300),
  body: text(10_000).default(''),
  triggerEvent: optionalText(200),
});
export type PublicEmailInput = z.infer<typeof publicEmailSchema>;

export const publicCareerApplicationSchema = z.object({
  jobId: requiredText(MAX_ID_LENGTH),
  applicantName: text(200).refine((v) => v.length >= 2, 'Name is required.'),
  phone: phoneSchema,
  whatsapp: optionalText(40),
  email: emailSchema,
  educationBn: text(1000).refine((v) => v.length >= 2, 'Education is required.'),
  experienceYearsBn: text(200).default(''),
  expectedSalaryBn: optionalText(200),
  paymentTrxId: optionalText(100),
  /** A link to the CV or just its file name; shown to HR as a link, so only web links are accepted. */
  cvLinkOrFileName: optionalText(MAX_URL_LENGTH).refine(
    (v) => v === undefined || isAllowedUrlFieldValue('cvLink', v),
    'CV link must be an http(s) link or a file name.'
  ),
  cvFileName: optionalText(255),
  cvFileDataUrl: cvFileSchema.optional(),
  coverLetterBn: optionalText(10_000),
});
export type PublicCareerApplicationInput = z.infer<typeof publicCareerApplicationSchema>;

export type PublicItemInput =
  | { key: 'leads'; item: PublicLeadInput }
  | { key: 'emails'; item: PublicEmailInput }
  | { key: 'complaints'; item: PublicComplaintInput }
  | { key: 'careerApplications'; item: PublicCareerApplicationInput };

const PUBLIC_ITEM_SCHEMAS = {
  leads: publicLeadSchema,
  emails: publicEmailSchema,
  complaints: publicComplaintSchema,
  careerApplications: publicCareerApplicationSchema,
} as const satisfies Record<PublicCreateKey, z.ZodType>;

const publicEnvelopeSchema = z.object({
  items: z
    .array(z.object({ key: z.enum(PUBLIC_CREATE_KEYS), item: z.record(z.string(), z.unknown()) }))
    .min(1)
    .max(MAX_PUBLIC_ITEMS),
});

/** Parse POST /api/public/submit. Any invalid item rejects the whole request. */
export function parsePublicSubmit(body: unknown): { ok: true; items: PublicItemInput[] } | { ok: false; error: string } {
  const envelope = publicEnvelopeSchema.safeParse(body);
  if (!envelope.success) return { ok: false, error: describeZodError(envelope.error) };
  const items: PublicItemInput[] = [];
  for (const [index, entry] of envelope.data.items.entries()) {
    const parsed = PUBLIC_ITEM_SCHEMAS[entry.key].safeParse(entry.item);
    if (!parsed.success) return { ok: false, error: `items.${index}.${describeZodError(parsed.error)}` };
    // Same storage rules as staff writes: no script URLs or HTML data URLs in any field.
    const unsafe = findUnsafeString(parsed.data);
    if (unsafe) return { ok: false, error: `items.${index}.${unsafe}: this value cannot be stored.` };
    items.push({ key: entry.key, item: parsed.data } as PublicItemInput);
  }
  return { ok: true, items };
}

// ---------------------------------------------------------------------------------------------
// Admission token and career candidate endpoints
// ---------------------------------------------------------------------------------------------

const contactFields = {
  phone: text(40).optional(),
  email: text(254).optional(),
};

export const tokenMatchSchema = z
  .object(contactFields)
  .refine((v) => Boolean(v.phone || v.email), 'A phone number or email is required.');

export const tokenApplySchema = z
  .object({ tokenId: idSchema, leadId: idSchema.optional(), ...contactFields })
  .refine((v) => Boolean(v.phone || v.email), 'A phone number or email is required.');

/** No-login career application status lookup: the phone, WhatsApp, email or application id. */
export const careerStatusSchema = z.object({ query: z.string().trim().min(5).max(200) });

export const candidateRegisterSchema = z.object({
  fullName: text(200).refine((v) => v.length >= 2, 'Full name is required.'),
  email: emailSchema,
  phone: phoneSchema,
  password: z.string().min(1).max(256),
});

export const candidateLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(256),
});
