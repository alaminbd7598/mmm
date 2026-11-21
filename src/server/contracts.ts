/**
 * Server-side contracts shared by the data layer, auth, API route handlers and the client store.
 *
 * Read docs/ARCHITECTURE.md for the full design. This file is the single source of truth for:
 *  - how every top-level CMSState key is stored (singleton document vs. collection of items),
 *  - which admin RBAC resource(s) govern writes to each key,
 *  - which keys anonymous visitors may add records to,
 *  - the sync operation format, the DataStore interface and the HTTP payload shapes.
 *
 * It must stay free of server-only imports so the client store can import its types.
 */
import type { AdminRole, CMSState } from '../types/cms';
import type { AdminTabId } from '../utils/cmsLogic';

// ---------------------------------------------------------------------------------------------
// 1. State key classification
// ---------------------------------------------------------------------------------------------

export type StateKey = keyof CMSState;

/** Keys whose value is one JSON document (object). Stored one row per key. */
export const SINGLETON_KEYS = [
  'settings',
  'popupConfig',
  'aiBotConfig',
  'whatsappConfig',
  'campusVideo',
  'feeCalculatorConfig',
  'educationMethodConfig',
  'tenYearPlanConfig',
  'dayCareRoutineConfig',
  'transportConfig',
  'admissionExtraConfig',
  'uniformConfig',
  'madrasahContextConfig',
  'hifzTreeConfig',
  'rbacMatrix',
  'versionManager',
  'blogAutomationConfig',
  'mobileBottomBar',
  'virtualOfficeConfig',
] as const satisfies readonly StateKey[];

/** Keys whose value is an ordered array of items that each carry a string `id`. One row per item. */
export const COLLECTION_KEYS = [
  'news',
  'notices',
  'courses',
  'events',
  'leads',
  'users',
  'emails',
  'departmentVideos',
  'activityVideos',
  'guardianReels',
  'photoGallery',
  'complaints',
  'leaveRequests',
  'careerJobs',
  'careerApplications',
  'careerCandidates',
  'admissionTokens2027',
  'blogPosts',
  'calendarEvents',
  'virtualOfficeSessions',
] as const satisfies readonly StateKey[];

export type SingletonKey = (typeof SINGLETON_KEYS)[number];
export type CollectionKey = (typeof COLLECTION_KEYS)[number];

export const isCollectionKey = (k: string): k is CollectionKey =>
  (COLLECTION_KEYS as readonly string[]).includes(k);

// ---------------------------------------------------------------------------------------------
// 2. RBAC: which admin resources govern each key
// ---------------------------------------------------------------------------------------------

/**
 * A signed-in staff member may read a key when their role has `view` on ANY listed resource, and
 * may write it when the role has the needed action on ANY listed resource (see hasRolePermission
 * in src/utils/cmsLogic.ts, evaluated with the stored rbacMatrix). Changing or deleting existing
 * data additionally requires being allowed to read the key. There is no blanket grant: backup
 * restore, factory reset and release rollback only touch the keys the role may fully manage.
 * `users` and `rbacMatrix` stay Super Admin only.
 */
export const RESOURCES_FOR_KEY: Record<StateKey, AdminTabId[]> = {
  settings: ['settings', 'branding', 'seo-meta'],
  popupConfig: ['popup-ai-fees'],
  aiBotConfig: ['popup-ai-fees'],
  whatsappConfig: ['popup-ai-fees'],
  feeCalculatorConfig: ['popup-ai-fees'],
  campusVideo: ['videos'],
  departmentVideos: ['videos'],
  activityVideos: ['videos'],
  guardianReels: ['videos'],
  educationMethodConfig: ['madrasah-infographics'],
  tenYearPlanConfig: ['madrasah-infographics'],
  dayCareRoutineConfig: ['madrasah-infographics'],
  transportConfig: ['madrasah-infographics'],
  admissionExtraConfig: ['madrasah-infographics'],
  uniformConfig: ['madrasah-infographics'],
  madrasahContextConfig: ['madrasah-infographics'],
  hifzTreeConfig: ['videos', 'madrasah-infographics', 'ai-publisher'],
  photoGallery: ['videos', 'madrasah-infographics', 'ai-publisher'],
  complaints: ['madrasah-infographics', 'leads'],
  news: ['news', 'ai-publisher'],
  notices: ['notices', 'ai-publisher'],
  courses: ['courses'],
  events: ['events', 'ai-publisher'],
  leads: ['leads'],
  emails: ['emails', 'leads'],
  users: ['users'],
  rbacMatrix: ['users'],
  leaveRequests: ['leaves'],
  versionManager: ['releases'],
  careerJobs: ['career'],
  careerApplications: ['career'],
  careerCandidates: ['career'],
  admissionTokens2027: ['tokens'],
  blogPosts: ['blog', 'ai-publisher'],
  blogAutomationConfig: ['blog'],
  calendarEvents: ['calendar'],
  mobileBottomBar: ['branding'],
  virtualOfficeConfig: ['virtual-office'],
  virtualOfficeSessions: ['virtual-office'],
};

export const SUPER_ADMIN_ONLY_KEYS: StateKey[] = ['users', 'rbacMatrix'];

/**
 * Fields of a user's OWN AdminUser record any signed-in staff member may change through sync
 * (profile & signature vault), even without the `users` permission.
 */
export const SELF_EDITABLE_USER_FIELDS = [
  'fullName',
  'designation',
  'phone',
  'email',
  'bio',
  'photoUrl',
  'signatureDataUrl',
  'googleEmail',
] as const;

// ---------------------------------------------------------------------------------------------
// 3. Anonymous visitor writes
// ---------------------------------------------------------------------------------------------

/**
 * Collections an anonymous visitor may ADD new items to through POST /api/public/submit.
 * Never updates or deletes. The server validates each item with a zod schema, drops admin-only
 * fields, forces safe defaults (e.g. lead.status = 'New') and rate-limits per IP.
 * Career candidates, admission-token use and virtual-office check-ins have dedicated endpoints.
 */
export const PUBLIC_CREATE_KEYS = ['leads', 'emails', 'complaints', 'careerApplications'] as const;
export type PublicCreateKey = (typeof PUBLIC_CREATE_KEYS)[number];

/**
 * Keys that are never sent to anonymous visitors (personal data, staff data, secrets).
 * `users` is replaced by a signatory-only projection; see PublicSignatory.
 */
export const PRIVATE_KEYS: StateKey[] = [
  'leads',
  'emails',
  'complaints',
  'leaveRequests',
  'careerApplications',
  'careerCandidates',
  'admissionTokens2027',
  'virtualOfficeSessions',
  'rbacMatrix',
];

/** The only user data visitors receive: what the certificate/token PDFs need for signatures. */
export interface PublicSignatory {
  id: string;
  fullName: string;
  designation?: string;
  role: AdminRole;
  signatorySlot: 'chairman' | 'principal' | 'coordinator';
  signatureDataUrl?: string;
}

// ---------------------------------------------------------------------------------------------
// 4. Sync operations (client store -> server)
// ---------------------------------------------------------------------------------------------

/**
 * `base` (on set / upsert / delete) is the state version in which the sender last saw the target
 * document; it overrides the request's `baseVersion` for that op. When the stored document was
 * changed after that version by someone else, the op is refused as a conflict instead of silently
 * overwriting the other change.
 */
export type SyncOp =
  /** Replace a singleton document. */
  | { op: 'set'; key: SingletonKey; value: Record<string, unknown>; base?: number }
  /** Insert or replace one collection item (matched by item.id). */
  | { op: 'upsert'; key: CollectionKey; item: { id: string } & Record<string, unknown>; base?: number }
  /** Delete one collection item. */
  | { op: 'delete'; key: CollectionKey; id: string; base?: number }
  /** Persist the display order of a collection (ids in array order; unknown ids are ignored). */
  | { op: 'order'; key: CollectionKey; ids: string[] }
  /** Replace a whole collection (backup restore / reset / release rollback). */
  | { op: 'replace'; key: CollectionKey; items: Array<{ id: string } & Record<string, unknown>> };

export interface SyncRequest {
  /**
   * State version the client last loaded. A set / upsert / delete whose stored target was changed
   * after this version (or after the op's own `base`) is rejected with a `CONFLICT:` reason.
   */
  baseVersion: number;
  ops: SyncOp[];
}

/** Start of the `rejected[].reason` of an op refused because someone else changed its target first. */
export const CONFLICT_REASON_PREFIX = 'CONFLICT:';

export interface SyncResponse {
  ok: boolean;
  version: number;
  updatedAt: string;
  /** Ops refused by RBAC, validation or a conflict, with reasons; the rest were applied atomically. */
  rejected?: Array<{ index: number; reason: string }>;
  error?: string;
}

// ---------------------------------------------------------------------------------------------
// 5. Data store interface (implemented by the MySQL/Prisma store and the in-memory demo store)
// ---------------------------------------------------------------------------------------------

export type StorageMode = 'database' | 'demo';

/** Stored user record: the AdminUser shape (without plaintext `password`) plus auth fields. */
export interface StoredUserAuth {
  id: string;
  username: string;
  role: AdminRole;
  passwordHash: string | null;
  mustChangePassword: boolean;
  disabled?: boolean;
  /** Incremented on password change, admin reset and logout; sessions carrying an older value are void. */
  sessionVersion: number;
}

export interface StoredCandidateAuth {
  id: string;
  email: string;
  passwordHash: string | null;
  sessionVersion: number;
}

export interface StateSnapshot {
  version: number;
  updatedAt: string;
  /** Full CMS state. `users[]` and `careerCandidates[]` never contain `password` / `passwordHash`. */
  state: CMSState;
}

export interface ApplyOpsOptions {
  /** bcrypt hashes for `users` items, keyed by item id. */
  passwordHashes?: Record<string, string>;
  /** bcrypt hashes for `careerCandidates` items, keyed by item id. */
  candidatePasswordHashes?: Record<string, string>;
  /**
   * Per user id: value to store in `mustChangePassword` when that user is written.
   * Users not listed keep their current flag (new users start with `false`). Admin-set passwords
   * (new accounts and resets through sync) pass `true` so the user must pick their own.
   */
  mustChangePassword?: Record<string, boolean>;
  /**
   * Enables conflict detection (staff sync): a set / upsert-of-existing / delete is skipped and
   * reported in `conflicts` when its stored target was last written in a version newer than the
   * op's `base` (or this value). Omitted for server-originated writes, which always apply.
   */
  baseVersion?: number;
}

export interface ApplyOpsResult {
  version: number;
  updatedAt: string;
  /** Indexes (into the ops array) of ops skipped because of a conflict. */
  conflicts?: number[];
}

export interface DataStore {
  readonly mode: StorageMode;
  /** Ensure schema/seed exist (idempotent). Called lazily before the first read. */
  init(): Promise<void>;
  getVersion(): Promise<{ version: number; updatedAt: string }>;
  getSnapshot(): Promise<StateSnapshot>;
  /**
   * Apply ops atomically (single DB transaction) and bump the version once.
   * The caller has already authorised and validated every op.
   * Plaintext `password` fields on users/careerCandidates items MUST be hashed by the caller
   * (use the auth module) and passed via `passwordHashes` keyed by item id; the store strips any
   * `password`/`passwordHash` keys from the stored JSON documents.
   */
  applyOps(ops: SyncOp[], opts?: ApplyOpsOptions): Promise<ApplyOpsResult>;
  getUserAuthByUsername(username: string): Promise<StoredUserAuth | null>;
  getUserAuthById(id: string): Promise<StoredUserAuth | null>;
  /** Stores the hash and revokes the user's existing sessions. Returns the new session version. */
  setUserPassword(id: string, passwordHash: string, mustChangePassword: boolean): Promise<number>;
  /** Revokes the user's existing sessions (logout). Returns the new session version. */
  bumpUserSessionVersion(id: string): Promise<number>;
  getCandidateAuthByEmail(email: string): Promise<StoredCandidateAuth | null>;
  /** Revokes the candidate's existing sessions (logout). */
  bumpCandidateSessionVersion(id: string): Promise<number>;
}

// ---------------------------------------------------------------------------------------------
// 6. Sessions
// ---------------------------------------------------------------------------------------------

export const STAFF_SESSION_COOKIE = 'mmm_session';
export const CANDIDATE_SESSION_COOKIE = 'mmm_candidate';

export interface StaffSession {
  kind: 'staff';
  userId: string;
  username: string;
  role: AdminRole;
  mustChangePassword: boolean;
  /** The account's sessionVersion when the token was issued. */
  sv: number;
}

export interface CandidateSession {
  kind: 'candidate';
  candidateId: string;
  email: string;
  sv: number;
}

// ---------------------------------------------------------------------------------------------
// 7. HTTP payloads (see docs/ARCHITECTURE.md for the full endpoint list)
// ---------------------------------------------------------------------------------------------

/** GET /api/state -> public projection for visitors, role-filtered full state for staff. */
export interface StateResponse {
  ok: true;
  mode: StorageMode;
  version: number;
  updatedAt: string;
  /** 'public' for anonymous visitors, 'staff' when a valid staff session cookie is present. */
  audience: 'public' | 'staff';
  state: Partial<CMSState>;
  /** Present for staff: the signed-in user (no password data). */
  me?: SafeUser;
  /** Demo mode with the sample admin enabled only: the sample sign-ins shown on the login page. */
  demoAccounts?: DemoAccount[];
}

export interface DemoAccount {
  username: string;
  password: string;
}

/** GET /api/state/meta -> cheap polling endpoint. */
export interface StateMetaResponse {
  ok: true;
  mode: StorageMode;
  version: number;
  updatedAt: string;
}

export type SafeUser = Omit<import('../types/cms').AdminUser, 'password'> & { mustChangePassword?: boolean };

/** POST /api/auth/login */
export interface LoginRequest {
  username: string;
  password: string;
  expectedRole?: AdminRole;
}
export interface LoginResponse {
  ok: boolean;
  user?: SafeUser;
  mustChangePassword?: boolean;
  error?: string;
  /** Machine-readable error: 'INVALID_CREDENTIALS' | 'ROLE_MISMATCH' | 'RATE_LIMITED' | 'NOT_CONFIGURED' */
  code?: string;
}

/** POST /api/auth/change-password */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** POST /api/public/submit */
export interface PublicSubmitRequest {
  items: Array<{ key: PublicCreateKey; item: { id: string } & Record<string, unknown> }>;
}
export interface PublicSubmitResponse {
  ok: boolean;
  version?: number;
  /** Server-assigned ids, in request order (the server may merge a lead into an existing one). */
  ids?: string[];
  error?: string;
  code?: string;
}

export const MIN_PASSWORD_LENGTH = 10;
