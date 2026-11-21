/** Demo-mode DataStore: the seed state held in process memory. Writes last until the process restarts. */
import type { ApplyOpsResult, DataStore, StateSnapshot, StoredCandidateAuth, StoredUserAuth, SyncOp } from '../contracts';
import { deepFreeze, type ApplyOpsOptions } from './documents';
import {
  applyOpsToMemory,
  emptyMemoryData,
  findCandidateAuthByEmail,
  findUserAuthById,
  findUserAuthByUsername,
  memorySnapshotState,
  type MemoryData,
  type UserAuthState,
} from './memory-state';
import type { SeedPlan } from './seed';
import { StoreNotFoundError, StoreStaleError } from './errors';

export class MemoryStore implements DataStore {
  readonly mode = 'demo' as const;
  private data: MemoryData = emptyMemoryData(new Date().toISOString());
  private initPromise: Promise<void> | null = null;
  /** Snapshot built from `source`; `data` is replaced (never mutated) on every write. */
  private cached: { source: MemoryData; snapshot: StateSnapshot } | null = null;

  /** @param loadSeed produces the seed plan; injected so tests can use small fixtures. */
  constructor(private readonly loadSeed: () => Promise<SeedPlan>) {}

  init(): Promise<void> {
    this.initPromise ??= this.seed().catch((err) => {
      this.initPromise = null;
      throw err;
    });
    return this.initPromise;
  }

  private async seed(): Promise<void> {
    const plan = await this.loadSeed();
    const seeded = applyOpsToMemory(emptyMemoryData(new Date().toISOString()), plan.ops, plan.opts, undefined, false);
    this.data = { ...seeded, version: 1, updatedAt: new Date().toISOString() };
  }

  async getVersion(): Promise<{ version: number; updatedAt: string }> {
    await this.init();
    return { version: this.data.version, updatedAt: this.data.updatedAt };
  }

  /** The returned snapshot is shared and frozen: callers must copy before changing anything. */
  async getSnapshot(): Promise<StateSnapshot> {
    await this.init();
    const source = this.data;
    if (this.cached?.source !== source) {
      const snapshot = deepFreeze({ version: source.version, updatedAt: source.updatedAt, state: memorySnapshotState(source) });
      this.cached = { source, snapshot };
    }
    return this.cached.snapshot;
  }

  /** Demo accounts are seeded with their sample passwords. */
  async adminPasswordPending(): Promise<boolean> {
    return false;
  }

  async applyOps(ops: SyncOp[], opts: ApplyOpsOptions = {}): Promise<ApplyOpsResult> {
    await this.init();
    const conflicts: number[] = [];
    // Synchronous swap: concurrent callers cannot interleave inside one call.
    const next = applyOpsToMemory(this.data, ops, opts, undefined, true, conflicts);
    if (opts.atomic && conflicts.length) throw new StoreStaleError(conflicts);
    this.data = next;
    return { version: this.data.version, updatedAt: this.data.updatedAt, ...(conflicts.length ? { conflicts } : {}) };
  }

  async getUserAuthByUsername(username: string): Promise<StoredUserAuth | null> {
    await this.init();
    return findUserAuthByUsername(this.data, username);
  }

  async getUserAuthById(id: string): Promise<StoredUserAuth | null> {
    await this.init();
    return findUserAuthById(this.data, id);
  }

  private writeUserAuth(id: string, change: (previous: UserAuthState) => UserAuthState): number {
    if (!this.data.collections.users.some((u) => u.id === id)) throw new StoreNotFoundError('User not found.');
    const userAuth = new Map(this.data.userAuth);
    const next = change(userAuth.get(id) ?? { passwordHash: null, mustChangePassword: false, sessionVersion: 0 });
    userAuth.set(id, next);
    this.data = { ...this.data, userAuth };
    return next.sessionVersion;
  }

  async setUserPassword(id: string, passwordHash: string, mustChangePassword: boolean): Promise<number> {
    await this.init();
    return this.writeUserAuth(id, (prev) => ({ passwordHash, mustChangePassword, sessionVersion: prev.sessionVersion + 1 }));
  }

  async bumpUserSessionVersion(id: string): Promise<number> {
    await this.init();
    return this.writeUserAuth(id, (prev) => ({ ...prev, sessionVersion: prev.sessionVersion + 1 }));
  }

  async getCandidateAuthByEmail(email: string): Promise<StoredCandidateAuth | null> {
    await this.init();
    return findCandidateAuthByEmail(this.data, email);
  }

  async bumpCandidateSessionVersion(id: string): Promise<number> {
    await this.init();
    if (!this.data.collections.careerCandidates.some((c) => c.id === id)) {
      throw new StoreNotFoundError('Candidate not found.');
    }
    const candidateAuth = new Map(this.data.candidateAuth);
    const prev = candidateAuth.get(id) ?? { passwordHash: null, sessionVersion: 0 };
    const next = { ...prev, sessionVersion: prev.sessionVersion + 1 };
    candidateAuth.set(id, next);
    this.data = { ...this.data, candidateAuth };
    return next.sessionVersion;
  }
}
