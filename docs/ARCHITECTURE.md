# Architecture (Next.js + MySQL, dual mode)

This document is the build contract for the migration from React/Vite/Express/JSON-file to
Next.js App Router + Prisma/MySQL. Types and constants live in `src/server/contracts.ts`.

## Goals and non-goals

- The public website and admin CMS must look and behave exactly as before. The existing client
  application (`src/App.tsx`, `src/components/**`, `src/store/**`) is kept and rendered client-only
  through `src/app/[[...slug]]/page.tsx` → `src/app/ClientApp.tsx`. Do not restyle components.
- Persistence moves from "whole JSON blob pushed by any browser" to a server-owned data store with
  per-item writes, server-side authentication and RBAC.
- One codebase deploys to Vercel, Google Cloud Run (Docker) and Hostinger Node.js hosting.

## Storage modes

`getStore()` (in `src/server/db/store.ts`) returns a `DataStore` (see contracts):

| `DATABASE_URL` | Mode | Implementation |
|---|---|---|
| set | `database` | `PrismaStore` — Prisma 7 + `@prisma/adapter-mariadb` (pure JS driver; works with MySQL 5.7+/8 and MariaDB 10.x). Schema created with `npm run db:push`. On first use with an empty DB it seeds from the seed content. |
| unset | `demo` | `MemoryStore` — in-process copy of the seed content on `globalThis`. Writes work until the process restarts. The admin panel shows a "Demo Mode" badge. |

Seed content = `INITIAL_CMS_STATE` (src/data/seedData.ts) merged with the non-personal content of the
former live JSON file (`src/server/db/seed-content.json`: settings, fee calculator, career jobs,
AI bot config, etc. — never leads, emails, complaints, applications, sessions or passwords).

### Prisma schema (MySQL)

All JSON documents are stored as `@db.LongText` strings (portable to MariaDB, whose JSON type is an
alias). Tables:

- `SiteMeta` — single row: `version Int`, `updatedAt`.
- `SiteSetting` — one row per singleton key: `key @id`, `data LongText`, `updatedAt`.
- Dedicated tables for the main collections, each with `id @id`, `position Int`, `data LongText`,
  `createdAt`, `updatedAt` plus indexed columns used for lookups:
  - `User` (`username @unique`, `role`, `passwordHash?`, `mustChangePassword Boolean`, `disabled Boolean`)
  - `Notice`, `NewsItem`, `Course`, `Event`, `BlogPost` (`slug`, `status`), `GalleryItem` (photoGallery),
    `AdmissionLead` (`status`, `phone`), `AdmissionToken` (`tokenCode @unique`, `guardianPhone`),
    `TeacherLeave` (`status`), `CareerJob`, `CareerApplication` (`email`), `CareerCandidate`
    (`email @unique`, `passwordHash?`), `Complaint`, `CalendarEvent`, `VirtualOfficeSession`,
    `EmailLog`.
- `CollectionItem` — generic table for the remaining small collections
  (`departmentVideos`, `activityVideos`, `guardianReels`): composite id (`collection`, `id`).
- The Hifz Tree (graduates inside `hifzTreeConfig`) and RBAC matrix stay JSON documents in
  `SiteSetting` because they are always edited and read as a whole.

Every `applyOps` call runs in one interactive transaction and bumps `SiteMeta.version` once.

## Authentication

- Staff: `POST /api/auth/login` checks bcrypt (`bcryptjs`, cost 12) hashes, then sets an HttpOnly,
  `Secure` (in production), `SameSite=Lax` cookie `mmm_session` holding a `jose` HS256 JWT
  (8 h, payload = `StaffSession`). Secret: `JWT_SECRET` (≥ 32 chars). In `database` mode without
  `JWT_SECRET` login fails with `NOT_CONFIGURED`; in `demo` mode without it a random per-process
  key is used. In production the demo admin is closed unless `DEMO_MODE=1`.
- Every request re-checks the stored account: it must exist, be enabled and carry the same
  `sessionVersion` as the token. Logout, password change and an admin password reset raise the
  version, which voids all earlier tokens (same for career candidates).
- Passwords are never sent to browsers and no account is seeded with one in `database` mode
  (seeded accounts: `admin` plus the three certificate signatories). On start, when no Super Admin
  has a password, the first one receives `ADMIN_BOOTSTRAP_PASSWORD` (≥ 12 chars, password policy)
  with `mustChangePassword = true`; otherwise login returns `NOT_CONFIGURED` and `GET /api/state`
  carries `loginSetup`, which the login page turns into setup instructions. Passwords set by an
  administrator (new accounts, resets) must also be changed at first sign-in.
- Password policy (`validateNewPassword`): ≥ 10 chars, letters and digits, not containing the
  username, not on the denylist (legacy defaults and common passwords).
- `src/proxy.ts` (Next.js 16 replacement for `middleware.ts`) rejects requests to `/api/admin/*`
  without a valid staff session (401). Route handlers re-check the session and RBAC themselves.
- Google sign-in no longer creates accounts or sessions (the client cannot prove the Google
  identity to the server without Firebase Admin). The button reports that it is unavailable.
- Career candidates: separate cookie `mmm_candidate` (`CandidateSession`), bcrypt passwords.
- CSRF: SameSite=Lax cookies + `assertSameOrigin` on every state-changing route.

## Abuse limits and hardening

- `src/server/rate-limit.ts`: in-memory fixed-window counters (per process, capped map). The client
  address is the entry `TRUSTED_PROXY_HOPS` (default 1) from the right of `X-Forwarded-For`; on
  Vercel `x-vercel-forwarded-for`. Client-supplied left-hand entries are never used; requests
  without a trustworthy address share one larger bucket per limit. Login also locks per username.
- Anonymous submissions: zod field whitelists, per-item file size, 6 MB body, per-address and
  site-wide daily caps for submissions and uploaded bytes, ceiling on stored inline files
  (`MAX_STORED_UPLOAD_MB`; they are part of the cached snapshot, so they are bounded by memory).
- Stored content rules (`src/utils/safeUrl.ts`, `src/server/state/document-rules.ts`): URL fields
  accept http(s), mailto, tel and same-site values; inline data only as raster images (never in
  link or embed fields) or PDF/Word in file fields; iframes only from the embed host allowlist.
- RBAC: `RESOURCES_FOR_KEY` + the stored matrix; `replace` (restore, reset, rollback) needs view,
  create, update and delete on the key; `users` and `rbacMatrix` are Super Admin only; the server
  keeps one holder per signatory slot.
- `getSnapshot()` is cached per state version and frozen; the public projection is cached per
  snapshot; `/api/state/meta` is one primary-key query.
- Security headers (CSP, HSTS, nosniff, Referrer-Policy, X-Frame-Options, Permissions-Policy) are
  set in `next.config.mjs`.

## API route handlers (`src/app/api/**/route.ts`)

| Method & path | Auth | Purpose |
|---|---|---|
| GET `/api/state` | optional staff | Public projection (visitors) or role-filtered full state (staff). `StateResponse`. |
| GET `/api/state/meta` | none | `{version, updatedAt, mode}` for polling. |
| POST `/api/admin/sync` | staff | `SyncRequest` → validate (zod), authorise each op via RBAC, hash passwords, `applyOps`. |
| POST `/api/public/submit` | none, rate-limited | `PublicSubmitRequest` (leads, emails, complaints, careerApplications; create only). |
| POST `/api/public/admission-token/match` | none, rate-limited | `{phone?, email?}` → minimal token discount info for the guardian's own token. |
| POST `/api/public/admission-token/apply` | none, rate-limited | `{tokenId, phone}` → marks the token applied. |
| POST `/api/public/career/register` · `login` · `logout`, GET `me` | candidate | Candidate account + own applications. |
| POST `/api/auth/login` · `logout` · `change-password`, GET `me` | — / staff | Staff auth. |
| POST `/api/chat` | none, rate-limited | Noor AI. Knowledge base and institute details come from the DB, not the request. |
| POST `/api/ai-extract-institution` | staff | Gemini document extractor. |
| POST `/api/ai-smart-publish` | staff | Gemini content router. |
| POST `/api/blog/action-publish` | Bearer API key | Blog webhook. Key = `BLOG_API_KEY` env or the admin-set key; the legacy default key is refused. |
| GET `/api/public/virtual-office/status` | none | Sanitised status. |
| POST `/api/public/virtual-office/checkin` | none, rate-limited | Lead-capture gate; creates session + lead server-side. |
| GET `/api/admin/virtual-office` | staff + RBAC | Full config incl. room links + sessions. |

The legacy `/api/cms-state` endpoints are removed.

## Client store changes (`src/store/useCMSStore.tsx`)

The context API stays the same except: `login` returns a Promise; new `storageMode`,
`changePassword`, and `mustChangePassword` exposure. Staff actions keep calling `setState`; the
persistence layer (`src/store/sync/**`) works as follows:

1. First paint: the server component embeds the public projection in the page
   (`initialPublicState`), so visitors never see built-in sample content; the localStorage cache of
   the public projection and, last, the built-in content are only fallbacks when the server (or its
   database) cannot be reached. Then `GET /api/state` (staff state if the cookie is valid,
   restoring `currentUser` from `me`).
2. Server data is authoritative (`mergeLiveCMSState(..., { authoritative: true })`): a list the
   server sends is used as it is, even when empty or shorter than the built-in one (collections,
   Hifz graduates, logo vault, nested lists). Defaults only fill keys the server did not send.
3. Staff: after each state change (debounced), diff against the last server-confirmed state per
   key: singletons → `set`; collections → `upsert`/`delete`/`order` per item, sent to
   `/api/admin/sync`. Every op carries `base`, the version in which this browser last saw its
   target. The store stamps each row with the version that wrote it and skips ops whose target is
   newer (**optimistic concurrency per item / per document**); the client then shows a conflict
   message and reloads. A sync that could not reach the server is retried; the header shows
   "not saved yet" and the browser warns before the tab is closed.
4. Visitors never persist local state. Public forms call `submitInquiry` /
   `submitGuardianComplaint` / `submitCareerApplication` (→ `POST /api/public/submit`, sent at
   once with `fetch keepalive`) or the virtual-office check-in, wait for the answer, and show the
   success screen with the **server's id** only when it was stored; otherwise the form stays
   filled in with a localized reason (`publicSubmitError`).
5. Poll `/api/state/meta` (staff 5 s, visitors 30 s, only while the tab is visible); refetch when
   the version changes and no local ops are pending. A background refresh keeps the previous
   objects for unchanged keys (`reuseUnchanged`), so forms being typed into are not reset.
6. `importFullCMSState` / `resetToDefaultData` / release rollback send `replace` + `set` ops for
   the keys the signed-in role may fully manage.

### Leads from public forms

`planPublicSubmit` de-duplicates only the same student (same guardian phone **and** same student
name): that submission is appended to the existing lead's notes. Another child on the same phone
gets a lead of its own with a note linking it to the sibling's lead, and a full admission form is
never dropped. Virtual-office check-ins follow the same rule.

### Database outage

Driver failures map to `StoreUnavailableError` → HTTP 503 (`STORE_UNAVAILABLE`). Connections wait
at most 4 s (`acquireTimeout`, overridable in `DATABASE_URL`) and after a failure the store answers
503 immediately for 5 s instead of queuing every request. Pages keep rendering with the last
public content the process embedded (or the browser's cached copy / built-in content).

## Environment variables

`DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL` (default `gemini-4-hydrogen`),
`NEXT_PUBLIC_APP_URL`, `BLOG_API_KEY` (optional), `ADMIN_BOOTSTRAP_PASSWORD` (first sign-in),
`TRUSTED_PROXY_HOPS` (optional, default 1), `DEMO_MODE=1` (demo admin in production),
`CHAT_DAILY_LIMIT` (optional, default 3000), `MAX_STORED_UPLOAD_MB` (optional, default 160),
`NEXT_OUTPUT=standalone` (Docker only).
