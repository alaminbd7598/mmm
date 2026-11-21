/**
 * Server persistence for the CMS store.
 *
 * - Loads state from GET /api/state (public projection or role-filtered staff state). Server data
 *   is authoritative: an emptied list stays empty instead of falling back to built-in content.
 * - Staff: after local changes (debounced), diffs against the last server-confirmed state and
 *   sends the ops to /api/admin/sync. Each op carries the version in which this browser last saw
 *   its target, so the server can refuse to overwrite someone else's newer change (conflict).
 * - Visitors never persist local state. Public forms call `submitPublic`, which posts to
 *   /api/public/submit immediately and reports the server's answer, so a form only shows success
 *   once the record is really stored.
 * - Polls /api/state/meta (staff 5 s, visitors 30 s, visible tabs only) and refetches when the
 *   version changes and nothing local is pending.
 * - Caches only the public projection in localStorage.
 */
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { CMSState } from '../../types/cms';
import { mergeLiveCMSState } from '../../utils/cmsLogic';
import {
  CONFLICT_REASON_PREFIX,
  type DemoAccount,
  type LoginSetupIssue,
  type PublicSubmitRequest,
  type SafeUser,
  type StateKey,
  type StateResponse,
  type SyncOp,
  type SyncResponse,
} from '../../server/contracts';
import { MAX_SYNC_REQUEST_BYTES, fetchState, fetchStateMeta, postAdminSync, postPublicSubmit } from '../../lib/api/state';
import { chunkOps, computeOps, fullReplaceOps, reuseUnchanged } from './diff';
import { describeSyncRejection } from './rejection';
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
  stripSecrets(mergeLiveCMSState(raw, CLIENT_FALLBACK_STATE, { authoritative: true }));

/** Public projection embedded in the page by the server (see src/app/[[...slug]]/page.tsx). */
let serverProvidedState: Partial<CMSState> | null = null;
export function provideInitialPublicState(state: Partial<CMSState> | null | undefined): void {
  if (state && typeof state === 'object') serverProvidedState = state;
}

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

/**
 * Initial client state: the public projection the server rendered into the page, else the cached
 * one, else (first visit with the server unreachable) built-in content without personal data.
 */
export function loadInitialClientState(): CMSState {
  const initial = serverProvidedState ?? (typeof window === 'undefined' ? null : readPublicCache());
  return initial ? mergeServerState(initial) : CLIENT_FALLBACK_STATE;
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

export type PublicSubmitOutcome =
  | { ok: true; ids: string[] }
  /** `status` 0 = the server could not be reached; `code` / `error` are the server's answer. */
  | { ok: false; status: number; code: string; error: string };

export interface ServerSync {
  storageMode: ClientStorageMode;
  liveSyncStatus: LiveSyncStatus;
  /** Sample sign-ins of a demo server (empty in database mode or when the demo admin is off). */
  demoAccounts: DemoAccount[];
  /** The server setting still missing before staff can sign in (null when sign-in works). */
  loginSetup: LoginSetupIssue | null;
  /** Send public form records to the server now and wait for its answer. Does not touch local state. */
  submitPublic: (items: PublicSubmitRequest['items']) => Promise<PublicSubmitOutcome>;
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
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [loginSetup, setLoginSetup] = useState<LoginSetupIssue | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;
  const callbacksRef = useRef({ onSession, notify, tr });
  callbacksRef.current = { onSession, notify, tr };

  /** Last state the server confirmed (merged and secret-free). Null until the first load/offline fallback. */
  const lastServerRef = useRef<CMSState | null>(null);
  const versionRef = useRef(0);
  /** Version of the last full load: everything stored up to it has been seen by this browser. */
  const seenVersionRef = useRef(0);
  /** Versions of this browser's own confirmed writes since that load (`key`, `key:id`, `key:*`). */
  const ownWritesRef = useRef(new Map<string, number>());
  const restartPollRef = useRef<() => void>(() => {});
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

  /** Only staff have local changes to persist; visitors' local state is display-only. */
  const hasPendingChanges = useCallback((): boolean => {
    if (audienceRef.current !== 'staff') return false;
    if (flushingRef.current || dirtyRef.current) return true;
    return lastServerRef.current !== null && pendingStaffOps().length > 0;
  }, []);

  /** Version in which this browser last saw (or itself wrote) the target of an op. */
  const withBase = (op: SyncOp): SyncOp => {
    if (op.op !== 'set' && op.op !== 'upsert' && op.op !== 'delete') return op;
    const own = ownWritesRef.current;
    const target = op.op === 'set' ? op.key : `${op.key}:${op.op === 'upsert' ? op.item.id : op.id}`;
    const base = Math.max(seenVersionRef.current, own.get(target) ?? 0, own.get(`${op.key}:*`) ?? 0);
    return { ...op, base };
  };

  const recordOwnWrites = (ops: readonly SyncOp[], version: number) => {
    const own = ownWritesRef.current;
    for (const op of ops) {
      if (op.op === 'set') own.set(op.key, version);
      else if (op.op === 'upsert') own.set(`${op.key}:${op.item.id}`, version);
      else if (op.op === 'replace') own.set(`${op.key}:*`, version);
    }
  };

  const applyServerState = (data: StateResponse) => {
    const merged = reuseUnchanged(stateRef.current, mergeServerState(data.state));
    const wasStaff = audienceRef.current === 'staff';
    lastServerRef.current = merged;
    replaceExcludeRef.current = null;
    staleRef.current = false;
    versionRef.current = Number(data.version) || 0;
    seenVersionRef.current = versionRef.current;
    ownWritesRef.current.clear();
    audienceRef.current = data.audience === 'staff' ? 'staff' : 'public';
    if (audienceRef.current === 'public') writePublicCache(data.state);
    setDemoAccounts(Array.isArray(data.demoAccounts) ? data.demoAccounts : []);
    setLoginSetup(data.loginSetup ?? null);
    // Staff poll every 5 s: switch interval as soon as the audience is known, not after the next tick.
    if ((audienceRef.current === 'staff') !== wasStaff) restartPollRef.current();
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
    if (reason?.startsWith(CONFLICT_REASON_PREFIX)) {
      n(
        t('অন্য কেউ একই তথ্য পরিবর্তন করেছেন', 'Someone Else Changed This', 'قام شخص آخر بتعديل هذه البيانات'),
        t(
          'আপনি সেভ করার আগেই অন্য একজন একই তথ্য পরিবর্তন করেছেন, তাই আপনার পরিবর্তনটি সংরক্ষণ করা হয়নি। সর্বশেষ তথ্য লোড করা হয়েছে; অনুগ্রহ করে দেখে নিয়ে আবার পরিবর্তন করুন।',
          'Another user changed the same item before you saved, so your change was not stored. The latest data has been loaded; please review it and make your change again.',
          'قام مستخدم آخر بتعديل العنصر نفسه قبل حفظك، لذلك لم يُحفظ تعديلك. تم تحميل أحدث البيانات؛ يرجى مراجعتها وإعادة التعديل.'
        ),
        'info'
      );
      return;
    }
    const detail = describeSyncRejection(reason, t);
    n(
      t('কিছু পরিবর্তন সংরক্ষণ করা যায়নি', 'Some Changes Were Not Saved', 'تعذر حفظ بعض التغييرات'),
      t(
        `${detail ? `${detail} ` : ''}সর্বশেষ সংরক্ষিত তথ্য আবার লোড করা হয়েছে; অনুগ্রহ করে পুনরায় চেষ্টা করুন।`,
        `${detail ? `${detail} ` : ''}The latest saved data has been reloaded; please try again.`,
        `${detail ? `${detail} ` : ''}تمت إعادة تحميل آخر البيانات المحفوظة؛ يرجى المحاولة مرة أخرى.`
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
    for (const chunk of chunkOps(ops.map(withBase), MAX_SYNC_REQUEST_BYTES)) {
      const before = versionRef.current;
      const res = await postAdminSync(seenVersionRef.current, chunk);
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
        // A sync in which every op was refused answers 400 with the per-op reasons.
        const refused = (res.body as Partial<SyncResponse> | undefined)?.rejected;
        notifyRejected(
          res.code === 'TOO_LARGE' || res.code === 'RATE_LIMITED' ? res.code : refused?.[0]?.reason
        );
        await refetchRef.current();
        return 'rejected';
      }
      const { version, rejected } = res.data;
      if (rejected && rejected.length > 0) rejectedReasons.push(...rejected.map((r) => r.reason));
      if (typeof version === 'number') {
        if (version !== before + 1) versionJumped = true;
        versionRef.current = version;
        if (!rejected?.length) recordOwnWrites(chunk, version);
      }
    }

    if (exclude && replaceExcludeRef.current === exclude) replaceExcludeRef.current = null;
    if (rejectedReasons.length > 0) {
      notifyRejected(rejectedReasons.find((r) => r.startsWith(CONFLICT_REASON_PREFIX)) ?? rejectedReasons[0]);
      await refetchRef.current();
      return 'rejected';
    }
    lastServerRef.current = stripSecrets(snapshot);
    setState((prev) => stripConfirmedSecrets(prev, snapshot));
    markSynced();
    if (versionJumped) staleRef.current = true;
    return 'ok';
  };

  /** Visitors have nothing to persist: local edits are display-only and become the new base. */
  const flushVisitor = async (): Promise<'ok'> => {
    if (lastServerRef.current) lastServerRef.current = stripSecrets(stateRef.current);
    return 'ok';
  };

  const submitPublic = useCallback(async (items: PublicSubmitRequest['items']): Promise<PublicSubmitOutcome> => {
    const res = await postPublicSubmit(items);
    if (!res.ok) return { ok: false, status: res.status, code: res.code, error: res.error };
    if (audienceRef.current === 'staff') {
      // A signed-in staff member used a public form: show the stored record in the admin views.
      staleRef.current = true;
    } else if (res.data.version === versionRef.current + 1) {
      // Our own write is the only change: no need for the next poll to refetch the public state.
      versionRef.current = res.data.version;
    }
    return { ok: true, ids: Array.isArray(res.data.ids) ? res.data.ids : [] };
  }, []);

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
      window.clearTimeout(timer);
      const delay = audienceRef.current === 'staff' ? STAFF_POLL_MS : VISITOR_POLL_MS;
      timer = window.setTimeout(async () => {
        try {
          await tick();
        } finally {
          if (!cancelled) schedule();
        }
      }, delay);
    };
    restartPollRef.current = () => {
      if (!cancelled) schedule();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void tick();
      // Leaving the tab (switching away, closing): push pending staff edits right away.
      else if (hasPendingChanges()) void flush();
    };
    /** Ask before closing a tab that still holds staff edits the server has not confirmed. */
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasPendingChanges()) return;
      event.preventDefault();
      event.returnValue = '';
    };

    schedule();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      cancelled = true;
      restartPollRef.current = () => {};
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [flush, refetch, hasPendingChanges]);

  const currentVersion = useCallback(() => versionRef.current, []);

  return {
    storageMode,
    liveSyncStatus,
    demoAccounts,
    loginSetup,
    submitPublic,
    flush,
    refetch,
    requestFullReplace,
    resetToPublic,
    hasPendingChanges,
    currentVersion,
  };
}
