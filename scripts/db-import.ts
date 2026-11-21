/**
 * Import a full CMS backup into the database at DATABASE_URL.
 *
 *   npm run db:import -- <backup.json> [--replace]
 *
 * Accepted formats: the legacy live file `{version, updatedAt, state: {...}}`, the admin panel's
 * "Export JSON" file (the CMSState object itself) and `{data: {...}}` wrappers.
 *
 * Singletons in the file are written with `set`. Collections are merged per item (`upsert`, then
 * the file's order) by default; with --replace each collection in the file replaces the stored one
 * (items missing from the file are deleted). Keys absent from the file are left untouched.
 *
 * Plaintext user / candidate passwords are bcrypt-hashed (cost 12) and those users must change
 * their password at next login. Users without a password keep their stored hash. User passwords
 * that fail the password policy (including the public legacy defaults) are skipped.
 * Prints counts per key only, never record contents.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadEnvConfig } from '@next/env';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { COLLECTION_KEYS, SINGLETON_KEYS, type StateKey } from '../src/server/contracts';
import type { CMSState } from '../src/types/cms';
import { getStore } from '../src/server/db/store';
import { validateNewPassword } from '../src/server/auth/password';
import { BCRYPT_COST } from '../src/server/db/seed';
import { plaintextPasswords, stateToOps, summarizeOps, withoutAuthFields } from '../src/server/db/state-ops';

const KNOWN_KEYS = new Set<string>([...SINGLETON_KEYS, ...COLLECTION_KEYS]);
const LEGACY_WRAPPER_KEYS = new Set(['version', 'updatedAt', 'exportedAt', 'app']);

const itemSchema = z.looseObject({ id: z.string().min(1).max(191) });
const singletonSchema = z.record(z.string(), z.unknown());
const collectionSchema = z.array(itemSchema);

function usage(message: string): never {
  console.error(`${message}\nUsage: npm run db:import -- <backup.json> [--replace]`);
  process.exit(1);
}

function unwrap(parsed: unknown): Record<string, unknown> {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) usage('The backup must be a JSON object.');
  const obj = parsed as Record<string, unknown>;
  for (const wrapper of ['state', 'data'] as const) {
    const inner = obj[wrapper];
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) return inner as Record<string, unknown>;
  }
  return obj;
}

/** Validates the shape of every recognised key; returns the state and the ignored key names. */
function validateState(raw: Record<string, unknown>): { state: Partial<CMSState>; ignored: string[] } {
  const state: Record<string, unknown> = {};
  const ignored: string[] = [];
  const problems: string[] = [];
  for (const [key, value] of Object.entries(raw)) {
    if (!KNOWN_KEYS.has(key)) {
      if (!LEGACY_WRAPPER_KEYS.has(key)) ignored.push(key);
      continue;
    }
    if (value === undefined || value === null) continue;
    const schema = (SINGLETON_KEYS as readonly string[]).includes(key) ? singletonSchema : collectionSchema;
    const result = schema.safeParse(value);
    if (!result.success) {
      const issue = result.error.issues[0];
      problems.push(`${key}: ${issue.path.join('.') || '(value)'} ${issue.message}`);
      continue;
    }
    state[key as StateKey] = value;
  }
  if (problems.length) usage(`Invalid backup:\n  ${problems.join('\n  ')}`);
  if (!Object.keys(state).length) usage('The file contains no CMS keys (settings, courses, notices, ...).');
  return { state: state as Partial<CMSState>, ignored };
}

async function hashAll(passwords: Map<string, string>): Promise<Record<string, string>> {
  const entries = await Promise.all(
    [...passwords].map(async ([id, pw]) => [id, await bcrypt.hash(pw, BCRYPT_COST)] as const)
  );
  return Object.fromEntries(entries);
}

async function main(): Promise<void> {
  // DATABASE_URL comes from the environment or, as in Next.js, from .env files.
  loadEnvConfig(process.cwd(), false, { info: () => {}, error: console.error });
  const args = process.argv.slice(2);
  const replace = args.includes('--replace');
  const files = args.filter((a) => !a.startsWith('--'));
  const unknownFlags = args.filter((a) => a.startsWith('--') && a !== '--replace');
  if (unknownFlags.length) usage(`Unknown option: ${unknownFlags.join(' ')}`);
  if (files.length !== 1) usage('Exactly one backup file is required.');
  if (!process.env.DATABASE_URL) usage('DATABASE_URL is not set. The importer only writes to a real database.');

  const path = resolve(files[0]);
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(path, 'utf8'));
  } catch (err) {
    usage(`Cannot read ${path}: ${err instanceof Error ? err.message : String(err)}`);
  }
  const { state, ignored } = validateState(unwrap(parsed));

  // Passwords that fail the policy (e.g. the legacy defaults, which are public) are not imported:
  // those accounts keep their stored password, or stay locked until a Super Admin sets one.
  const usernames = new Map((state.users || []).map((u) => [u.id, u.username]));
  const userPasswords = plaintextPasswords(state, 'users');
  let skippedWeak = 0;
  for (const [id, password] of userPasswords) {
    if (!validateNewPassword(password, usernames.get(id)).ok) {
      userPasswords.delete(id);
      skippedWeak += 1;
    }
  }
  const [passwordHashes, candidatePasswordHashes] = await Promise.all([
    hashAll(userPasswords),
    hashAll(plaintextPasswords(state, 'careerCandidates')),
  ]);
  const mustChangePassword = Object.fromEntries([...userPasswords.keys()].map((id) => [id, true]));
  // Passwords were read above; no auth field from the file reaches the stored documents.
  const ops = stateToOps(withoutAuthFields(state), replace ? 'replace' : 'upsert');

  const store = await getStore();
  const before = await store.getVersion();
  const result = await store.applyOps(ops, { passwordHashes, candidatePasswordHashes, mustChangePassword });

  const usersInFile = Array.isArray(state.users) ? state.users : [];
  const usersWithoutAnyHash: string[] = [];
  for (const u of usersInFile) {
    if (!(await store.getUserAuthById(u.id))?.passwordHash) usersWithoutAnyHash.push(u.id);
  }

  console.log(`Imported ${path} (${replace ? 'replace' : 'merge'} mode)`);
  for (const row of summarizeOps(ops)) {
    console.log(`  ${row.key.padEnd(24)} ${row.kind === 'singleton' ? 'set' : `${row.count} item(s)`}`);
  }
  if (ignored.length) console.log(`  ignored unknown keys: ${ignored.join(', ')}`);
  console.log(`  user passwords hashed: ${Object.keys(passwordHashes).length} (must change at next login)`);
  if (skippedWeak) console.log(`  user passwords skipped (too weak or a known default): ${skippedWeak}`);
  console.log(`  candidate passwords hashed: ${Object.keys(candidatePasswordHashes).length}`);
  if (usersWithoutAnyHash.length) {
    console.log(`  users without a password (cannot sign in until one is set): ${usersWithoutAnyHash.length}`);
  }
  console.log(`  version ${before.version} -> ${result.version}`);
}

main().then(
  () => process.exit(0),
  (err: unknown) => {
    console.error(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
);
