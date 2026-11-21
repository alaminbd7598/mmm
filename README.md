# Maharat Model Madrasah — Website & Admin CMS

Trilingual (বাংলা / English / العربية) public website and admin CMS for Maharat Model Madrasah
(EIIN 140630), built with **Next.js (App Router)**, React 19, Tailwind CSS v4 and **Prisma + MySQL**.

- **Database mode** (`DATABASE_URL` set): all content, admissions leads, tokens, leave requests,
  career applications etc. are stored in MySQL/MariaDB.
- **Demo mode** (no `DATABASE_URL`): runs with built-in seed content in memory; nothing is saved.
  Useful for previews (Vercel, Google AI Studio). On a production server the admin panel of the
  demo stays closed unless `DEMO_MODE=1` is set (its sample passwords are public).

First sign-in on a real database: set `ADMIN_BOOTSTRAP_PASSWORD`, restart, sign in as `admin` and
choose a new password (details in the deployment guide).

## Quick start

```bash
npm install
cp .env.example .env    # fill in values; leave DATABASE_URL empty for demo mode
npm run dev             # http://localhost:3000  (admin: /admin)
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Syncs DB tables when `DATABASE_URL` is set, then builds |
| `npm start` | Production server (Hostinger / any Node host) |
| `npm run lint` | TypeScript type check |
| `npm test` | Unit tests |
| `npm run db:push` | Create/update database tables |
| `npm run db:import -- backup.json` | Import a full JSON backup into the database |

## Deployment

Step-by-step guide (Bangla) for Hostinger, Vercel and Google Cloud Run:
[docs/DEPLOYMENT.bn.md](docs/DEPLOYMENT.bn.md). Architecture and API reference:
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
