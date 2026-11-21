#!/usr/bin/env node
/**
 * Runs before `next build`.
 * - Without DATABASE_URL (Demo Mode, e.g. a Vercel preview): does nothing.
 * - With DATABASE_URL: creates/updates the MySQL tables with `prisma db push`.
 *   `db push` refuses changes that would lose data, so an unsafe schema change fails the build
 *   instead of silently dropping columns.
 * Set SKIP_DB_PUSH=1 to skip (e.g. when the build machine cannot reach the database).
 * Vercel preview builds (VERCEL_ENV=preview) never sync: a branch build must not change the tables
 * of a database it may share with production. ALLOW_PREVIEW_DB_PUSH=1 turns the sync back on for
 * previews that have their own database.
 * DATABASE_URL is read the way Next.js reads it: from the environment first, then from .env files.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import nextEnv from '@next/env';
import { schemaSyncDecision } from './prepare-db-decision.mjs';

nextEnv.loadEnvConfig(process.cwd(), false, { info: () => {}, error: console.error });

const decision = schemaSyncDecision(process.env);
if (!decision.sync) {
  console.log(`[prepare-db] ${decision.message}`);
  process.exit(0);
}

console.log('[prepare-db] Syncing database tables with prisma db push ...');
const prismaCli = createRequire(import.meta.url).resolve('prisma/build/index.js');
const result = spawnSync(process.execPath, [prismaCli, 'db', 'push'], { stdio: 'inherit' });
if (result.status !== 0) {
  console.error('[prepare-db] prisma db push failed. Check DATABASE_URL and that the database user can create tables.');
  process.exit(result.status ?? 1);
}
