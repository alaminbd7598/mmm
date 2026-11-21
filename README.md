# Maharat Model Madrasah — Website & Admin CMS

Trilingual (বাংলা / English / العربية) public website and admin CMS for Maharat Model Madrasah
(EIIN 140630), built with **Next.js (App Router)**, React 19, Tailwind CSS v4 and **Prisma + MySQL**.

- **Database mode** (`DATABASE_URL` set): all content, admissions leads, tokens, leave requests,
  career applications etc. are stored in MySQL/MariaDB.
- **Demo mode** (no `DATABASE_URL`): runs with built-in seed content in memory; nothing is saved.
  Useful for previews (Vercel). On a production server the admin panel of the
  demo stays closed unless `DEMO_MODE=1` is set (its sample passwords are public).

First sign-in on a real database: set `ADMIN_BOOTSTRAP_PASSWORD`, restart, sign in as `admin` and
choose a new password (details in the deployment guide).

## Quick start

Requires Node.js 22.13+ (or 24+).

```bash
npm install
cp .env.example .env    # fill in values; leave DATABASE_URL empty for demo mode
npm run dev             # http://localhost:3000  (admin: /admin)
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Type check, create/update DB tables when `DATABASE_URL` is set, then build (needs about 1.3 GB RAM) |
| `npm start` | Production server (Hostinger / any Node host); listens on `PORT` |
| `npm run lint` | Strict TypeScript check (also rejects unused code) |
| `npm test` | Unit tests |
| `npm run test:e2e` | Browser tests of the production build (see the header of `scripts/e2e/run.cjs`) |
| `npm run db:push` | Create/update database tables by hand |
| `npm run db:import -- backup.json` | Import a full JSON backup into the database |

`GET /api/health` answers `{ok, mode, db}` for uptime monitoring.

## Deployment

One-click from GitHub to Hostinger Node.js hosting (`npm install`, `npm run build`, `npm start`),
Vercel, or Google Cloud Run (`Dockerfile`).

- Deployment guide (Bangla): [docs/DEPLOYMENT.bn.md](docs/DEPLOYMENT.bn.md)
- Maintenance guide (Bangla): [docs/MAINTENANCE.bn.md](docs/MAINTENANCE.bn.md)
- Architecture and API reference: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
