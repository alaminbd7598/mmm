/**
 * Extraction of plaintext passwords from authorised sync ops (the admin "add user" form sends one).
 * Pure: returns new ops with credential fields stripped; hashing happens in the sync service.
 */
import { validateNewPassword } from '../auth/password';
import type { SyncOp } from '../contracts';

type Item = { id: string } & Record<string, unknown>;

/** Fields never stored in user / candidate documents (auth columns live outside the JSON). */
const CREDENTIAL_FIELDS = ['password', 'passwordHash', 'mustChangePassword'] as const;

export interface PasswordExtraction {
  /** Ops to apply (credential fields removed), with their indexes in the input. */
  ops: Array<{ index: number; op: SyncOp }>;
  rejected: Array<{ index: number; reason: string }>;
  /** Plaintext passwords to hash, keyed by user id. */
  userPasswords: Map<string, string>;
}

function stripCredentials(item: Item): Item {
  const copy: Item = { ...item };
  for (const field of CREDENTIAL_FIELDS) delete copy[field];
  return copy;
}

const plaintext = (item: Item): string | null =>
  typeof item.password === 'string' && item.password.length > 0 ? item.password : null;

const usernameOf = (item: Item): string => (typeof item.username === 'string' ? item.username : '');

/**
 * For `users` upserts/replaces: validate each carried password against the policy (an op with an
 * invalid password is rejected as a whole) and collect it for hashing. For `careerCandidates`,
 * staff never set passwords, so any carried value is dropped. Credential fields are stripped from
 * every user and candidate item.
 */
export function extractSyncPasswords(input: ReadonlyArray<{ index: number; op: SyncOp }>): PasswordExtraction {
  const result: PasswordExtraction = { ops: [], rejected: [], userPasswords: new Map() };
  for (const { index, op } of input) {
    if ((op.key !== 'users' && op.key !== 'careerCandidates') || (op.op !== 'upsert' && op.op !== 'replace')) {
      result.ops.push({ index, op });
      continue;
    }
    const items = op.op === 'upsert' ? [op.item] : op.items;
    const found = new Map<string, string>();
    let error: string | null = null;
    if (op.key === 'users') {
      for (const item of items) {
        const pw = plaintext(item);
        if (pw === null) continue;
        const check = validateNewPassword(pw, usernameOf(item));
        if (!check.ok) {
          error = `Password for "${usernameOf(item) || item.id}": ${check.error}`;
          break;
        }
        found.set(item.id, pw);
      }
    }
    if (error) {
      result.rejected.push({ index, reason: error });
      continue;
    }
    for (const [id, pw] of found) result.userPasswords.set(id, pw);
    const cleaned: SyncOp =
      op.op === 'upsert' ? { ...op, item: stripCredentials(op.item) } : { ...op, items: op.items.map(stripCredentials) };
    result.ops.push({ index, op: cleaned });
  }
  return result;
}
