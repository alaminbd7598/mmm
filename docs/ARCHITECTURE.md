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
  `JWT_SECRET` login fails with `NOT_CONFIGURED`; in `demo` mode a fixed demo secret is used.
- Passwords are never sent to browsers. Seeded/imported users get `mustChangePassword = true`;
  the client forces a password change after login. Initial passwords: `ADMIN_BOOTSTRAP_PASSWORD`
  if set, otherwise each seed user's legacy default.
- `src/proxy.ts` (Next.js 16 replacement for `middleware.ts`) rejects requests to `/api/admin/*`
  without a valid staff session (401). Route handlers re-check the session and RBAC themselves.
- Google sign-in no longer creates accounts or sessions (the client cannot prove the Google
  identity to the server without Firebase Admin). The button reports that it is unavailable.
- Career candidates: separate cookie `mmm_candidate` (`CandidateSession`), bcrypt passwords.
- CSRF: SameSite=Lax cookies + `assertSameOrigin` on every state-changing route.

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
`changePassword`, and `mustChangePassword` exposure. All existing action implementations keep
calling `setState`. The persistence layer changes:

1. On mount: `GET /api/state` (staff state if the cookie is valid, restoring `currentUser` from `me`).
2. After each state change (debounced), diff the new state against the last server-confirmed
   state per key: singletons → `set`; collections → `upsert`/`delete`/`order` per item.
   - Staff: send all ops to `/api/admin/sync`.
   - Visitors: send only NEW items of `PUBLIC_CREATE_KEYS` to `/api/public/submit`; other local
     changes are not persisted.
3. Poll `/api/state/meta` (staff 5 s, visitors 30 s, only while the tab is visible); refetch when
   the version changes and no local ops are pending.
4. `importFullCMSState` / `resetToDefaultData` / release rollback send `replace` + `set` ops.
5. localStorage keeps only a cache of the public projection for fast first paint.

## Environment variables

`DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL` (default `gemini-4-hydrogen`),
`NEXT_PUBLIC_APP_URL`, `BLOG_API_KEY` (optional), `ADMIN_BOOTSTRAP_PASSWORD` (optional),
`NEXT_OUTPUT=standalone` (Docker only).
