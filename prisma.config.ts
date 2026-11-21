import { loadEnvConfig } from '@next/env';
import { defineConfig, env } from 'prisma/config';

// Prisma CLI commands (generate, db push) read DATABASE_URL the way Next.js does: from the
// environment first, then from .env files. Existing environment variables are never overridden.
loadEnvConfig(process.cwd(), false, { info: () => {}, error: console.error });

// DATABASE_URL is only required by commands that connect (db push). `prisma generate`
// (postinstall) must also work on machines without a database, so fall back to a placeholder there.
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: hasDatabaseUrl ? env('DATABASE_URL') : 'mysql://unset:unset@127.0.0.1:3306/unset',
  },
});
