/**
 * Server persistence for the CMS store.
 *
 * - Loads state from GET /api/state (public projection or role-filtered staff state).
 * - After local changes (debounced), diffs against the last server-confirmed state and sends the
 *   ops: staff -> /api/admin/sync, visitors -> only NEW public records via /api/public/submit.
 * - Polls /api/state/meta (staff 5 s, visitors 30 s, visible tabs only) and refetches when the
 *   version changes and nothing local is pending.
 * - Caches only the public projection in localStorage.
 */
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { CMSState } from '../../types/cms';
import { mergeLiveCMSState } from '../../utils/cmsLogic';
import type { SafeUser, StateKey, StateResponse, SyncOp } from '../../server/contracts';
import { MAX_SYNC_REQUEST_BYTES, fetchState, fetchStateMeta, postAdminSync, postPublicSubmit } from '../../lib/api/state';
import { chunkOps, computeOps, fullReplaceOps, publicOpsOnly } from './diff';
import { buildClientFallbackState, stripConfirmedSecrets, stripSecrets } from './state-shape';

export type ClientStorageMode = 'database' | 'demo' | 'offline';
export type SyncAudience = 'public' | 'staff';

export interface LiveSyncStatus {
  status: 'synced' | 'syncing' | 'local-only';
  version: number;
  lastSyncedAt: string | null;
}

export const PUBLIC_CACHE_STORAGE_KEY = 'maharat_model_madrasah_public_cache_v1';
/** Former full-state cache (contained staff data and passwords); removed on startup. */
const LEGACY_STORAGE_KEYS = ['maharat_model_madrasah_cms_v11'];

const DEBOUNCE_MS = 300;
const STAFF_POLL_MS = 5_000;
const VISITOR_POLL_MS = 30_000;

type Tr = (bn: string, en: string, ar: string) => string;
type Notify = (title: string, description: string, type?: 'success' | 'info' | 'email') => void;

const CLIENT_FALLBACK_STATE = buildClientFallbackState();

const mergeServerState = (raw: Partial<CMSState>): CMSState =>
  stripSecrets(mergeLiveCMSState(raw, CLIENT_FALLBACK_STATE));

function readPublicCache(): Partial<CMSState> | null {
  try {
    for (const key of LEGACY_STORAGE_KEYS) localStorage.removeItem(key);
    const raw = localStorage.getItem(PUBLIC_CACHE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Partial<CMSState>) : null;
  } catch {
    return null;
  }
}

function writePublicCache(publicState: Partial<CMSState>): void {
  try {
    localStorage.setItem(PUBLIC_CACHE_STORAGE_KEY, JSON.stringify(publicState));
  } catch {
    // Quota exceeded or storage blocked (private mode / sandboxed iframe): the cache is optional.
  }
}

/** Initial client state: the cached public projection, or seed content without personal data. */
export function loadInitialClientState(): CMSState {
  const cached = typeof window === 'undefined' ? null : readPublicCache();
  return cached ? mergeServerState(cached) : CLIENT_FALLBACK_STATE;
}

/** Fresh public-only state from cache/fallback, used to drop staff data from memory at logout. */
export const publicFallbackState = (): CMSState => loadInitialClientState();

export interface ServerSyncOptions {
  state: CMSState;
  setState: Dispatch<SetStateAction<CMSState>>;
  /** Called with the signed-in staff user (or null) after every state load. */
  onSession: (me: SafeUser | null, audience: SyncAudience) => void;
  notify: Notify;
  tr: Tr;
}

export interface RefetchOptions {
  /** Background refreshes (polling) do not overwrite local edits made while the request ran. */
  background?: boolean;
}

export interface ServerSync {
  storageMode: ClientStorageMode;
  liveSyncStatus: LiveSyncStatus;
  /** Push pending local changes now. Resolves true when nothing is left pending. */
  flush: () => Promise<boolean>;
  /** Reload state from the server. Resolves true on success. */
  refetch: (opts?: RefetchOptions) => Promise<boolean>;
  /** The next flush sends `set`/`replace` for every key except `exclude` (restore / reset). */
  requestFullReplace: (exclude: readonly StateKey[]) => void;
  /** Drop staff data from memory immediately (logout), before the public refetch completes. */
  resetToPublic: () => void;
  hasPendingChanges: () => boolean;
  /** Server state version last seen (from a load or a confirmed write). */
  currentVersion: () => number;
}

export function useServerSync({ state, setState, onSession, notify, tr }: ServerSyncOptions): ServerSync {
  const [storageMode, setStorageMode] = useState<ClientStorageMode>('database');
  const [liveSyncStatus, setLiveSyncStatus] = useState<LiveSyncStatus>({
    status: 'syncing',
    version: 0,
    lastSyncedAt: null,
  });

  const stateRef = useRef(state);
  stateRef.current = state;
  const callbacksRef = useRef({ onSession, notify, tr });
  callbacksRef.current = { onSession, notify, tr };

  /** Last state the server confirmed (merged and secret-free). Null until the first load/offline fallback. */
  const lastServerRef = useRef<CMSState | null>(null);
  const versionRef = useRef(0);
  const audienceRef = useRef<SyncAudience>('public');
  const modeRef = useRef<ClientStorageMode>('database');
  const replaceExcludeRef = useRef<readonly StateKey[] | null>(null);
  const flushingRef = useRef<Promise<boolean> | null>(null);
  const dirtyRef = useRef(false);
  const staleRef = useRef(false);
  const refetchRef = useRef<(opts?: RefetchOptions) => Promise<boolean>>(async () => false);

  const markSynced = (updatedAt?: string) =>
    setLiveSyncStatus({
      status: 'synced',
      version: versionRef.current,
      lastSyncedAt: updatedAt || new Date().toISOString(),
    });
  const markLocalOnly = () => setLiveSyncStatus((prev) => ({ ...prev, status: 'local-only' }));
  const markSyncing = () => setLiveSyncStatus((prev) => ({ ...prev, status: 'syncing' }));

  const setMode = (mode: ClientStorageMode) => {
    modeRef.current = mode;
    setStorageMode(mode);
  };

  const pendingStaffOps = (): SyncOp[] => {
    const base = lastServerRef.current;
    if (!base) return [];
    const exclude = replaceExcludeRef.current;
    return exclude ? fullReplaceOps(stateRef.current, exclude) : computeOps(base, stateRef.current);
  };

  const hasPendingChanges = useCallback((): boolean => {
    if (flushingRef.current || dirtyRef.current) return true;
    const base = lastServerRef.current;
    if (!base) return false;
    if (audienceRef.current === 'staff') return pendingStaffOps().length > 0;
    return publicOpsOnly(computeOps(base, stateRef.current), base).length > 0;
  }, []);

  const applyServerState = (data: StateResponse) => {
    const merged = mergeServerState(data.state);
    lastServerRef.current = merged;
    replaceExcludeRef.current = null;
    staleRef.current = false;
    versionRef.current = Number(data.version) || 0;
    audienceRef.current = data.audience === 'staff' ? 'staff' : 'public';
    if (audienceRef.current === 'public') writePublicCache(data.state);
    setMode(data.mode === 'demo' ? 'demo' : 'database');
    setState(merged);
    callbacksRef.current.onSession(audienceRef.current === 'staff' ? data.me ?? null : null, audienceRef.current);
    markSynced(data.updatedAt);
  };

  const refetch = useCallback(async (opts: RefetchOptions = {}): Promise<boolean> => {
    const startState = stateRef.current;
    const startBase = lastServerRef.current;
    if (!opts.background) markSyncing();
    const res = await fetchState();
    if (!res.ok) {
      if (!lastServerRef.current) {
        // Never reached the server: keep the cached/fallback state and accumulate local changes.
        lastServerRef.current = stateRef.current;
        setMode('offline');
      } else if (res.status === 0) {
        setMode('offline');
      }
      markLocalOnly();
      return false;
    }
    const editedMeanwhile =
      opts.background && startBase !== null && stateRef.current !== startState && hasPendingChanges();
    if (editedMeanwhile) {
      staleRef.current = true;
      return false;
    }
    applyServerState(res.data);
    return true;
  }, []);
  refetchRef.current = refetch;

  const notifyRejected = (reason?: string) => {
    const { notify: n, tr: t } = callbacksRef.current;
    n(
      t('কিছু পরিবর্তন সংরক্ষণ করা যায়নি', 'Some Changes Were Not Saved', 'تعذر حفظ بعض التغييرات'),
      t(
        `সার্ভার পরিবর্তনগুলো গ্রহণ করেনি${reason ? ` (${reason})` : ''}। সর্বশেষ সংরক্ষিত তথ্য পুনরায় লোড করা হয়েছে।`,
        `The server did not accept these changes${reason ? ` (${reason})` : ''}. The latest saved data has been reloaded.`,
        `لم يقبل الخادم هذه التغييرات${reason ? ` (${reason})` : ''}. تمت إعادة تحميل آخر البيانات المحفوظة.`
      ),
      'info'
    );
  };

  const notifySessionExpired = () => {
    const { notify: n, tr: t } = callbacksRef.current;
    n(
      t('সেশনের মেয়াদ শেষ', 'Session Expired', 'انتهت الجلسة'),
      t(
        'নিরাপত্তার জন্য আপনাকে সাইন আউট করা হয়েছে। অনুগ্রহ করে আবার লগইন করুন।',
        'You have been signed out for security. Please sign in again.',
        'تم تسجيل خروجك لأسباب أمنية. يرجى تسجيل الدخول مرة أخرى.'
      ),
      'info'
    );
  };

  /** One staff sync round. Returns 'ok' | 'retry' (network) | 'rejected' (refetched). */
  const flushStaff = async (): Promise<'ok' | 'retry' | 'rejected'> => {
    const snapshot = stateRef.current;
    const exclude = replaceExcludeRef.current;
    const ops = pendingStaffOps();
    if (ops.length === 0) {
      replaceExcludeRef.current = null;
      return 'ok';
    }
    markSyncing();
    let versionJumped = false;
    const rejectedReasons: string[] = [];
    for (const chunk of chunkOps(ops, MAX_SYNC_REQUEST_BYTES)) {
      const before = versionRef.current;
      const res = await postAdminSync(before, chunk);
      if (!res.ok) {
        if (res.status === 0 || res.status >= 500) {
          markLocalOnly();
          return 'retry';
        }
        if (res.status === 401 || res.code === 'UNAUTHENTICATED') {
          notifySessionExpired();
          await refetchRef.current();
          return 'rejected';
        }
        notifyRejected(res.code === 'TOO_LARGE' ? 'TOO_LARGE' : undefined);
        await refetchRef.current();
        return 'rejected';
      }
      const { version, rejected } = res.data;
      if (rejected && rejected.length > 0) rejectedReasons.push(...rejected.map((r) => r.reason));
      if (typeof version === 'number') {
        if (version !== before + 1) versionJumped = true;
        versionRef.current = version;
      }
    }

    if (exclude && replaceExcludeRef.current === exclude) replaceExcludeRef.current = null;
    if (rejectedReasons.length > 0) {
      notifyRejected(rejectedReasons[0]);
      await refetchRef.current();
      return 'rejected';
    }
    lastServerRef.current = stripSecrets(snapshot);
    setState((prev) => stripConfirmedSecrets(prev, snapshot));
    markSynced();
    if (versionJumped) staleRef.current = true;
    return 'ok';
  };

  const flushVisitor = async (): Promise<'ok' | 'retry' | 'rejected'> => {
    const base = lastServerRef.current;
    if (!base) return 'ok';
    const snapshot = stateRef.current;
    const submissions = publicOpsOnly(computeOps(base, snapshot), base);
    if (submissions.length === 0) {
      // Other local edits by visitors are display-only and never persisted.
      lastServerRef.current = stripSecrets(snapshot);
      return 'ok';
    }
    if (modeRef.current === 'offline') return 'retry';
    markSyncing();
    const before = versionRef.current;
    const res = await postPublicSubmit(submissions);
    if (!res.ok && (res.status === 0 || res.status >= 500)) {
      markLocalOnly();
      return 'retry';
    }
    lastServerRef.current = stripSecrets(snapshot);
    if (!res.ok) {
      notifyRejected(res.code === 'RATE_LIMITED' ? 'RATE_LIMITED' : undefined);
      await refetchRef.current();
      return 'rejected';
    }
    // Adopt the new version only when no one else wrote meanwhile; otherwise polling refetches.
    if (res.data.version === before + 1) versionRef.current = res.data.version;
    markSynced();
    return 'ok';
  };

  const flush = useCallback(async (): Promise<boolean> => {
    if (flushingRef.current) {
      dirtyRef.current = true;
      return flushingRef.current;
    }
    const run = (async () => {
      let outcome: 'ok' | 'retry' | 'rejected' = 'ok';
      do {
        dirtyRef.current = false;
        outcome = audienceRef.current === 'staff' ? await flushStaff() : await flushVisitor();
      } while (outcome === 'ok' && dirtyRef.current);
      return outcome === 'ok';
    })();
    flushingRef.current = run;
    try {
      return await run;
    } finally {
      flushingRef.current = null;
      dirtyRef.current = false;
    }
  }, []);

  const requestFullReplace = useCallback((exclude: readonly StateKey[]) => {
    replaceExcludeRef.current = exclude;
  }, []);

  const resetToPublic = useCallback(() => {
    const publicState = publicFallbackState();
    lastServerRef.current = publicState;
    replaceExcludeRef.current = null;
    audienceRef.current = 'public';
    setState(publicState);
  }, [setState]);

  // Initial load.
  useEffect(() => {
    void refetch();
  }, [refetch]);

  // Debounced push after local changes.
  useEffect(() => {
    if (!lastServerRef.current || state === lastServerRef.current) return;
    const timer = window.setTimeout(() => {
      void flush();
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [state, flush]);

  // Version polling while the tab is visible.
  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;

    const tick = async () => {
      if (document.visibilityState !== 'visible') return;
      if (modeRef.current === 'offline') {
        const meta = await fetchStateMeta();
        if (!meta.ok) return;
        setMode(meta.data.mode === 'demo' ? 'demo' : 'database');
        await flush();
        await refetch();
        return;
      }
      if (hasPendingChanges()) {
        await flush();
        return;
      }
      if (staleRef.current) {
        await refetch({ background: true });
        return;
      }
      const meta = await fetchStateMeta();
      if (!meta.ok) {
        if (meta.status === 0) {
          setMode('offline');
          markLocalOnly();
        }
        return;
      }
      if (Number(meta.data.version) !== versionRef.current && !hasPendingChanges()) {
        await refetch({ background: true });
      }
    };

    const schedule = () => {
      const delay = audienceRef.current === 'staff' ? STAFF_POLL_MS : VISITOR_POLL_MS;
      timer = window.setTimeout(async () => {
        try {
          await tick();
        } finally {
          if (!cancelled) schedule();
        }
      }, delay);
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') void tick();
    };

    schedule();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [flush, refetch, hasPendingChanges]);

  const currentVersion = useCallback(() => versionRef.current, []);

  return {
    storageMode,
    liveSyncStatus,
    flush,
    refetch,
    requestFullReplace,
    resetToPublic,
    hasPendingChanges,
    currentVersion,
  };
}
