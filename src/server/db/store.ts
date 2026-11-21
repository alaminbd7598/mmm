/**
 * Process-wide DataStore singleton (docs/ARCHITECTURE.md "Storage modes"):
 * DATABASE_URL set -> PrismaStore ('database'); unset -> MemoryStore ('demo').
 * Kept on globalThis so Next.js dev reloads and parallel route modules share one store and one
 * connection pool. init() runs lazily once; concurrent first callers await the same promise.
 */
import type { DataStore, StorageMode, SyncOp } from '../contracts';
import type { ApplyOpsOptions } from './documents';
import { MemoryStore } from './memory-store';
import { createPrismaClient } from './prisma-client';
import { PrismaStore } from './prisma-store';
import { buildSeedPlan } from './seed';

/** DataStore whose applyOps also accepts `mustChangePassword` (see ApplyOpsOptions). */
export interface AppDataStore extends DataStore {
  applyOps(ops: SyncOp[], opts?: ApplyOpsOptions): Promise<{ version: number; updatedAt: string }>;
}

interface StoreHolder {
  store?: AppDataStore;
  ready?: Promise<AppDataStore>;
}

const GLOBAL_KEY = Symbol.for('mmm.dataStore');
const holder: StoreHolder = ((globalThis as Record<symbol, unknown>)[GLOBAL_KEY] as StoreHolder | undefined) ??
  ((globalThis as Record<symbol, unknown>)[GLOBAL_KEY] = {} as StoreHolder);

export function storageMode(): StorageMode {
  return process.env.DATABASE_URL ? 'database' : 'demo';
}

function createStore(): AppDataStore {
  const url = process.env.DATABASE_URL;
  if (url) return new PrismaStore(createPrismaClient(url), () => buildSeedPlan('database'));
  return new MemoryStore(() => buildSeedPlan('demo'));
}

/** The initialised store. A failed init is not cached, so the next call retries. */
export async function getStore(): Promise<AppDataStore> {
  holder.store ??= createStore();
  const store = holder.store;
  holder.ready ??= store.init().then(
    () => store,
    (err: unknown) => {
      holder.ready = undefined;
      throw err;
    }
  );
  return holder.ready;
}
