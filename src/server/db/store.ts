/**
 * Process-wide DataStore singleton (docs/ARCHITECTURE.md "Storage modes"):
 * DATABASE_URL set -> PrismaStore ('database'); unset -> MemoryStore ('demo').
 * Kept on globalThis so Next.js dev reloads and parallel route modules share one store and one
 * connection pool. init() runs lazily once; concurrent first callers await the same promise.
 */
import type { DataStore, StorageMode } from '../contracts';
import { MemoryStore } from './memory-store';
import { createPrismaClient } from './prisma-client';
import { PrismaStore } from './prisma-store';
import { modeFromEnv } from '../auth/jwt';
import { buildSeedPlan, ensureBootstrapPassword } from './seed';

interface StoreHolder {
  store?: DataStore;
  ready?: Promise<DataStore>;
}

const GLOBAL_KEY = Symbol.for('mmm.dataStore');
const holder: StoreHolder = ((globalThis as Record<symbol, unknown>)[GLOBAL_KEY] as StoreHolder | undefined) ??
  ((globalThis as Record<symbol, unknown>)[GLOBAL_KEY] = {} as StoreHolder);

export function storageMode(): StorageMode {
  return modeFromEnv();
}

function createStore(): DataStore {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    return new PrismaStore(
      createPrismaClient(url),
      () => buildSeedPlan('database'),
      async (store) => {
        const outcome = await ensureBootstrapPassword(store);
        return outcome === 'missing' || outcome === 'weak';
      }
    );
  }
  if (process.env.NODE_ENV === 'production') {
    console.warn('[setup] DATABASE_URL is not set: running in Demo Mode. Nothing is saved permanently.');
  }
  return new MemoryStore(() => buildSeedPlan('demo'));
}

/** The initialised store. A failed init is not cached, so the next call retries. */
export async function getStore(): Promise<DataStore> {
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
