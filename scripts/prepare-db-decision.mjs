/**
 * Whether the build step may run `prisma db push` (see prepare-db.mjs). Pure, so it is unit-tested.
 * @param {Readonly<Record<string, string | undefined>>} env
 * @returns {{ sync: true } | { sync: false, message: string }}
 */
export function schemaSyncDecision(env) {
  if (!env.DATABASE_URL) {
    return { sync: false, message: 'DATABASE_URL is not set: building in Demo Mode (no database changes).' };
  }
  if (env.SKIP_DB_PUSH === '1') {
    return { sync: false, message: 'SKIP_DB_PUSH=1: skipping schema sync.' };
  }
  if (env.VERCEL_ENV === 'preview' && env.ALLOW_PREVIEW_DB_PUSH !== '1') {
    return {
      sync: false,
      message:
        'Vercel preview build: schema sync skipped, so a branch build cannot change the tables of a database shared with production. ' +
        'Set ALLOW_PREVIEW_DB_PUSH=1 only if previews use their own database.',
    };
  }
  return { sync: true };
}
