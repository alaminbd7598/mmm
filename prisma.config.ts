import { defineConfig, env } from 'prisma/config';

// Prisma CLI commands (db push, generate) read DATABASE_URL from the environment or, when it is
// not set there, from a local .env file. Existing environment variables are never overridden.
try {
  process.loadEnvFile();
} catch {
  // no .env file: use the environment as it is
}

// DATABASE_URL is only required by commands that connect (db push). `prisma generate`
// (postinstall) must also work on machines without a database, so fall back to a placeholder there.
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: hasDatabaseUrl ? env('DATABASE_URL') : 'mysql://unset:unset@127.0.0.1:3306/unset',
  },
});
