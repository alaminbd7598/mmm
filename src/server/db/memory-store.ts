/** Demo-mode DataStore: the seed state held in process memory. Writes last until the process restarts. */
import type { DataStore, StateSnapshot, StoredCandidateAuth, StoredUserAuth, SyncOp } from '../contracts';
import type { ApplyOpsOptions } from './documents';
import {
  applyOpsToMemory,
  emptyMemoryData,
  findCandidateAuthByEmail,
  findUserAuthById,
  findUserAuthByUsername,
  memorySnapshotState,
  type MemoryData,
} from './memory-state';
import type { SeedPlan } from './seed';
import { StoreNotFoundError } from './errors';

export class MemoryStore implements DataStore {
  readonly mode = 'demo' as const;
  private data: MemoryData = emptyMemoryData(new Date().toISOString());
  private initPromise: Promise<void> | null = null;

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

  async getSnapshot(): Promise<StateSnapshot> {
    await this.init();
    return { version: this.data.version, updatedAt: this.data.updatedAt, state: memorySnapshotState(this.data) };
  }

  async applyOps(ops: SyncOp[], opts: ApplyOpsOptions = {}): Promise<{ version: number; updatedAt: string }> {
    await this.init();
    // Synchronous swap: concurrent callers cannot interleave inside one call.
    this.data = applyOpsToMemory(this.data, ops, opts);
    return { version: this.data.version, updatedAt: this.data.updatedAt };
  }

  async getUserAuthByUsername(username: string): Promise<StoredUserAuth | null> {
    await this.init();
    return findUserAuthByUsername(this.data, username);
  }

  async getUserAuthById(id: string): Promise<StoredUserAuth | null> {
    await this.init();
    return findUserAuthById(this.data, id);
  }

  async setUserPassword(id: string, passwordHash: string, mustChangePassword: boolean): Promise<void> {
    await this.init();
    if (!this.data.collections.users.some((u) => u.id === id)) throw new StoreNotFoundError('User not found.');
    const userAuth = new Map(this.data.userAuth);
    userAuth.set(id, { passwordHash, mustChangePassword });
    this.data = { ...this.data, userAuth };
  }

  async getCandidateAuthByEmail(email: string): Promise<StoredCandidateAuth | null> {
    await this.init();
    return findCandidateAuthByEmail(this.data, email);
  }

  async setCandidatePassword(id: string, passwordHash: string): Promise<void> {
    await this.init();
    if (!this.data.collections.careerCandidates.some((c) => c.id === id)) {
      throw new StoreNotFoundError('Candidate not found.');
    }
    const candidateAuth = new Map(this.data.candidateAuth);
    candidateAuth.set(id, passwordHash);
    this.data = { ...this.data, candidateAuth };
  }
}
