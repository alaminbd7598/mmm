# Maharat Model Madrasah — project memory

Trilingual (বাংলা / English / العربية) public website and admin CMS. Next.js 16 App Router,
React 19, Tailwind v4, Prisma 7 + MySQL. Details: `docs/ARCHITECTURE.md`,
`docs/DEPLOYMENT.bn.md`, `docs/MAINTENANCE.bn.md`, `.env.example`.

## How the owner works (follow every session)

- Reply in Bangla, in plain words; the owner is not a programmer.
- When a decision is needed, ask with clickable multiple-choice questions, the best option marked
  "(Recommended)". Ask all open questions together. The last question is always
  "এখনই শুরু করব" or "আগে আমার চাওয়া গুছিয়ে দেখাব".
- Do not change code before the owner says to start.
- Do not commit, push or open a pull request without the owner's explicit permission. Show the
  change running live (a Vercel preview) first; push after the owner confirms.
- Measure before claiming. Report numbers from this session, and say so when something was not checked.
- Keep cost low: no multi-agent workflows unless the owner asks for one.
- Never change how the site looks or behaves unless asked. All pages, the dark/light theme, the
  three languages and the font-size control must keep working.

## Where the site runs (one repository, three places)

| Place | Mode | Notes |
|---|---|---|
| Hostinger (Business/Cloud, Node.js app) + real domain | database | Final production. `DATABASE_URL` points at Hostinger MySQL on `localhost`. |
| Vercel (`mmm-demo-six.vercel.app`) | demo | No `DATABASE_URL`. Admin opens only with `DEMO_MODE=1` + `JWT_SECRET`. |
| Google Cloud Run (`Dockerfile`) | demo | Same as Vercel. |

- Without `DATABASE_URL` the app runs in demo mode: built-in seed content in memory, nothing saved.
- `GET /api/health` answers `{ok, mode, db}`; `mode` is `demo` or `database`.
- Google AI Studio cannot run this project (it is a full Next.js server app), and its preview
  frame is refused by the site's `frame-ancestors 'self'` policy. Do not let AI Studio rewrite the code.

## Commands

```bash
npm install
npm run build      # tsc, then prisma db push when DATABASE_URL is set, then next build
npm start          # production server on PORT
npm run lint       # strict type check
npm test           # unit tests
npm run test:e2e   # browser tests of the production build (run npm run build first)
```

Run lint, unit tests, a build and the e2e tests before calling a change done.

## Things worth knowing

- The interactive site is one client application (`src/App.tsx`) loaded with `ssr: false` from
  `src/app/ClientApp.tsx`; SEO metadata, sitemap and robots are rendered on the server.
- Keep heavy libraries out of the public bundle: the admin panel, `jspdf`, `qrcode` and the blog's
  `react-markdown` are loaded on demand (`lazy()` / `await import()`). Public components import
  certificate PDFs through `src/utils/certificatePdfLazy.ts`.
- Demo sample passwords are hashed at a low bcrypt cost (`DEMO_BCRYPT_COST`) so a cold start is
  fast; real passwords use `BCRYPT_COST`.
- Pages are rendered per request (`force-dynamic`) because `src/proxy.ts` sets a per-request
  script nonce for the Content-Security-Policy.
- `src/proxy.ts` is the Next.js 16 name for middleware.

## Decisions still open with the owner

- One lead card per family, or one per child?
- Short reference numbers such as `MMM-123456`?
- Remove the admin overview's discount-token panel, or connect it to the real tokens?
- Is the placeholder email domain `maharatmadrasah.com` the owner's?
