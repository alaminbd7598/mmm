#!/usr/bin/env node
/**
 * Runs before `next build`.
 * - Without DATABASE_URL (Demo Mode, e.g. a Vercel preview): does nothing.
 * - With DATABASE_URL: creates/updates the MySQL tables with `prisma db push`.
 *   `db push` refuses changes that would lose data, so an unsafe schema change fails the build
 *   instead of silently dropping columns.
 * Set SKIP_DB_PUSH=1 to skip (e.g. when the build machine cannot reach the database).
 * DATABASE_URL is read the way Next.js reads it: from the environment first, then from .env files.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd(), false, { info: () => {}, error: console.error });

if (!process.env.DATABASE_URL) {
  console.log('[prepare-db] DATABASE_URL is not set: building in Demo Mode (no database changes).');
  process.exit(0);
}
if (process.env.SKIP_DB_PUSH === '1') {
  console.log('[prepare-db] SKIP_DB_PUSH=1: skipping schema sync.');
  process.exit(0);
}

console.log('[prepare-db] Syncing database tables with prisma db push ...');
const prismaCli = createRequire(import.meta.url).resolve('prisma/build/index.js');
const result = spawnSync(process.execPath, [prismaCli, 'db', 'push'], { stdio: 'inherit' });
if (result.status !== 0) {
  console.error('[prepare-db] prisma db push failed. Check DATABASE_URL and that the database user can create tables.');
  process.exit(result.status ?? 1);
}
