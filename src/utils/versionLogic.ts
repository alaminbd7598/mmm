import {
  APP_VERSION_INFO,
  DEFAULT_VERSION_MANAGER_CONFIG,
  INITIAL_RELEASE_ENTRY,
} from '../config/appVersion';
import type {
  AppReleaseEntry,
  AppVersionManagerConfig,
  CMSState,
  ReleaseSnapshotData,
} from '../types/cms';

export type SemverBumpType = 'patch' | 'minor' | 'major';

const MAX_STORED_RELEASES = 25;

/**
 * Normalizes a semantic version string (e.g. "v2.2.0", "2.2", " 1.0.0 ") into "MAJOR.MINOR.PATCH".
 */
export function normalizeSemver(input?: string): string {
  if (!input || typeof input !== 'string') {
    return APP_VERSION_INFO.version;
  }
  const cleaned = input.trim().replace(/^v/i, '');
  const parts = cleaned.split('.').map((p) => Number.parseInt(p, 10));
  if (parts.length === 0 || Number.isNaN(parts[0]) || parts[0] < 0) {
    return APP_VERSION_INFO.version;
  }
  const major = Math.max(0, parts[0] || 0);
  const minor = Math.max(0, Number.isNaN(parts[1]) ? 0 : parts[1] || 0);
  const patch = Math.max(0, Number.isNaN(parts[2]) ? 0 : parts[2] || 0);
  return `${major}.${minor}.${patch}`;
}

export function compareSemver(a: string, b: string): number {
  const pa = normalizeSemver(a).split('.').map(Number);
  const pb = normalizeSemver(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return 1;
    if (pa[i] < pb[i]) return -1;
  }
  return 0;
}

/**
 * Computes the next semantic version for patch, minor, or major increments.
 */
export function bumpSemver(current: string, bumpType: SemverBumpType = 'patch'): string {
  const normalized = normalizeSemver(current);
  const [major, minor, patch] = normalized.split('.').map((n) => Number.parseInt(n, 10) || 0);
  if (bumpType === 'major') return `${major + 1}.0.0`;
  if (bumpType === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/**
 * Visibility predicate for the Public Website Footer version label.
 */
export function shouldShowPublicVersion(config?: AppVersionManagerConfig): boolean {
  if (!config) return false;
  return Boolean(config.enabled && config.showInPublicFooter);
}

/**
 * Visibility predicate for the Admin Dashboard version badge & release popover.
 */
export function shouldShowAdminVersion(config?: AppVersionManagerConfig): boolean {
  if (!config) return false;
  return Boolean(config.enabled && config.showInAdminDashboard);
}

/**
 * Returns a safe, complete AppVersionManagerConfig merged with defaults.
 * Automatically upgrades persisted older versions to APP_VERSION_INFO.version
 * and prepends the latest structured release notice if missing.
 */
export function resolveVersionManagerConfig(
  incoming?: Partial<AppVersionManagerConfig> | null
): AppVersionManagerConfig {
  if (!incoming || typeof incoming !== 'object') {
    return {
      ...DEFAULT_VERSION_MANAGER_CONFIG,
      currentVersion: DEFAULT_VERSION_MANAGER_CONFIG.activeVersion,
      releases: [...DEFAULT_VERSION_MANAGER_CONFIG.releases],
    };
  }

  const incomingVer = normalizeSemver(
    incoming.activeVersion || incoming.currentVersion || APP_VERSION_INFO.version
  );
  const existingReleases =
    Array.isArray(incoming.releases) && incoming.releases.length > 0
      ? [...incoming.releases]
      : [...DEFAULT_VERSION_MANAGER_CONFIG.releases];

  // Auto-sync: if codebase APP_VERSION_INFO.version is newer than saved state, auto-bump and prepend release notes
  let activeVersion = incomingVer;
  let releases = existingReleases;
  if (compareSemver(APP_VERSION_INFO.version, incomingVer) > 0) {
    activeVersion = APP_VERSION_INFO.version;
    const alreadyHas = releases.some(
      (r) => normalizeSemver(r.version) === normalizeSemver(APP_VERSION_INFO.version)
    );
    if (!alreadyHas) {
      releases = [INITIAL_RELEASE_ENTRY, ...releases].slice(0, MAX_STORED_RELEASES);
    }
  } else {
    // Ensure the current release entry has structured added/improved/removed if it matches APP_VERSION_INFO
    releases = releases.map((r) =>
      normalizeSemver(r.version) === normalizeSemver(APP_VERSION_INFO.version) &&
      (!r.added || r.added.length === 0)
        ? {
            ...r,
            added: INITIAL_RELEASE_ENTRY.added,
            improved: INITIAL_RELEASE_ENTRY.improved,
            removed: INITIAL_RELEASE_ENTRY.removed,
          }
        : r
    );
  }

  return {
    enabled:
      typeof incoming.enabled === 'boolean'
        ? incoming.enabled
        : DEFAULT_VERSION_MANAGER_CONFIG.enabled,
    showInPublicFooter:
      typeof incoming.showInPublicFooter === 'boolean'
        ? incoming.showInPublicFooter
        : DEFAULT_VERSION_MANAGER_CONFIG.showInPublicFooter,
    showInAdminDashboard:
      typeof incoming.showInAdminDashboard === 'boolean'
        ? incoming.showInAdminDashboard
        : DEFAULT_VERSION_MANAGER_CONFIG.showInAdminDashboard,
    activeVersion,
    currentVersion: activeVersion,
    releases,
  };
}

/**
 * Deep-clones only the configurable website/CMS state for a release snapshot,
 * deliberately excluding student leads, admin accounts, emails, leave requests,
 * and nested release history so rollbacks remain lightweight and never erase operational CRM/HR data.
 */
export function extractReleaseSnapshot(state: CMSState): ReleaseSnapshotData {
  const payload: ReleaseSnapshotData = {
    settings: state.settings,
    popupConfig: state.popupConfig,
    aiBotConfig: state.aiBotConfig,
    whatsappConfig: state.whatsappConfig,
    feeCalculatorConfig: state.feeCalculatorConfig,
    educationMethodConfig: state.educationMethodConfig,
    tenYearPlanConfig: state.tenYearPlanConfig,
    dayCareRoutineConfig: state.dayCareRoutineConfig,
    transportConfig: state.transportConfig,
    admissionExtraConfig: state.admissionExtraConfig,
    uniformConfig: state.uniformConfig,
    madrasahContextConfig: state.madrasahContextConfig,
    hifzTreeConfig: state.hifzTreeConfig,
    news: state.news,
    notices: state.notices,
    courses: state.courses,
    events: state.events,
    photoGallery: state.photoGallery,
    campusVideo: state.campusVideo,
    departmentVideos: state.departmentVideos,
    activityVideos: state.activityVideos,
    guardianReels: state.guardianReels,
  };
  return JSON.parse(JSON.stringify(payload)) as ReleaseSnapshotData;
}

/**
 * Records a new release snapshot and updates the active semantic version.
 */
export function createReleaseEntry(
  state: CMSState,
  params: {
    customVersion?: string;
    bumpType?: SemverBumpType;
    title: string;
    notes: string;
    added?: string[];
    improved?: string[];
    removed?: string[];
    createdBy: string;
    isAutoBackup?: boolean;
  }
): { nextConfig: AppVersionManagerConfig; createdRelease: AppReleaseEntry } {
  const currentConfig = resolveVersionManagerConfig(state.versionManager);
  const nextVersion =
    params.customVersion && params.customVersion.trim()
      ? normalizeSemver(params.customVersion)
      : bumpSemver(currentConfig.activeVersion, params.bumpType || 'minor');

  const timestamp = new Date().toISOString();
  const createdRelease: AppReleaseEntry = {
    id: `rel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    version: nextVersion,
    tag: `v${nextVersion}`,
    title: params.title.trim() || `Release v${nextVersion}`,
    notes: params.notes.trim() || 'Saved configuration and content snapshot.',
    added: (params.added || []).map((s) => s.trim()).filter(Boolean),
    improved: (params.improved || []).map((s) => s.trim()).filter(Boolean),
    removed: (params.removed || []).map((s) => s.trim()).filter(Boolean),
    createdAt: timestamp,
    createdBy: params.createdBy || 'Super Admin',
    isAutoBackup: Boolean(params.isAutoBackup),
    snapshot: extractReleaseSnapshot(state),
  };

  const hydratedExisting = currentConfig.releases.map((rel) =>
    !rel.snapshot && rel.version === currentConfig.activeVersion
      ? { ...rel, snapshot: extractReleaseSnapshot(state) }
      : rel
  );

  const combined = [createdRelease, ...hydratedExisting].slice(0, MAX_STORED_RELEASES);
  const activeVer = params.isAutoBackup ? currentConfig.activeVersion : nextVersion;

  const nextConfig: AppVersionManagerConfig = {
    ...currentConfig,
    activeVersion: activeVer,
    currentVersion: activeVer,
    releases: combined,
  };

  return { nextConfig, createdRelease };
}

/**
 * Rolls back website settings, theme/branding, content, courses, notices, and media
 * to a previously saved release snapshot while automatically creating a pre-rollback
 * safety backup snapshot so no current configuration is ever lost.
 */
export function rollbackToReleaseSnapshot(
  state: CMSState,
  releaseId: string,
  actorName: string
): {
  success: boolean;
  nextState?: CMSState;
  restoredRelease?: AppReleaseEntry;
  safetyBackup?: AppReleaseEntry;
  error?: string;
} {
  const currentConfig = resolveVersionManagerConfig(state.versionManager);
  const target = currentConfig.releases.find((r) => r.id === releaseId);

  if (!target) {
    return { success: false, error: 'Selected release version was not found.' };
  }
  if (!target.snapshot) {
    return {
      success: false,
      error: 'This release entry does not contain a restorable configuration snapshot.',
    };
  }

  const safetyBackup: AppReleaseEntry = {
    id: `rel-backup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    version: currentConfig.activeVersion,
    tag: `v${currentConfig.activeVersion}`,
    title: `Auto Safety Backup (Before rollback to ${target.tag})`,
    notes: `Automatically captured prior to restoring ${target.tag} — "${target.title}".`,
    createdAt: new Date().toISOString(),
    createdBy: actorName || 'Super Admin',
    isAutoBackup: true,
    snapshot: extractReleaseSnapshot(state),
  };

  const clonedSnapshot = JSON.parse(JSON.stringify(target.snapshot)) as ReleaseSnapshotData;

  const nextVersionManager: AppVersionManagerConfig = {
    ...currentConfig,
    activeVersion: target.version,
    currentVersion: target.version,
    releases: [safetyBackup, ...currentConfig.releases].slice(0, MAX_STORED_RELEASES),
  };

  const nextState: CMSState = {
    ...state,
    ...clonedSnapshot,
    leads: state.leads,
    users: state.users,
    emails: state.emails,
    leaveRequests: state.leaveRequests,
    complaints: state.complaints,
    rbacMatrix: state.rbacMatrix,
    versionManager: nextVersionManager,
  };

  return {
    success: true,
    nextState,
    restoredRelease: target,
    safetyBackup,
  };
}

/**
 * Validates and parses an imported JSON release snapshot file.
 */
export function validateImportedReleaseSnapshot(rawJson: string): {
  valid: boolean;
  entry?: AppReleaseEntry;
  error?: string;
} {
  try {
    const parsed = JSON.parse(rawJson) as Partial<AppReleaseEntry> & {
      release?: Partial<AppReleaseEntry>;
    };
    const candidate =
      parsed?.release && typeof parsed.release === 'object' ? parsed.release : parsed;

    if (!candidate || typeof candidate !== 'object') {
      return { valid: false, error: 'Invalid JSON structure.' };
    }
    if (
      !candidate.snapshot ||
      typeof candidate.snapshot !== 'object' ||
      !candidate.snapshot.settings
    ) {
      return {
        valid: false,
        error: 'The file does not contain a valid release snapshot payload (missing settings).',
      };
    }

    const version = normalizeSemver(candidate.version || candidate.tag);
    const entry: AppReleaseEntry = {
      id: `rel-imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      version,
      tag: `v${version}`,
      title:
        typeof candidate.title === 'string' && candidate.title.trim()
          ? candidate.title.trim()
          : `Imported Release v${version}`,
      notes:
        typeof candidate.notes === 'string' && candidate.notes.trim()
          ? candidate.notes.trim()
          : 'Imported from JSON release archive.',
      added: Array.isArray(candidate.added) ? candidate.added : undefined,
      improved: Array.isArray(candidate.improved) ? candidate.improved : undefined,
      removed: Array.isArray(candidate.removed) ? candidate.removed : undefined,
      createdAt:
        typeof candidate.createdAt === 'string' && candidate.createdAt.trim()
          ? candidate.createdAt
          : new Date().toISOString(),
      createdBy:
        typeof candidate.createdBy === 'string' && candidate.createdBy.trim()
          ? candidate.createdBy.trim()
          : 'Imported Archive',
      isAutoBackup: false,
      snapshot: candidate.snapshot as ReleaseSnapshotData,
    };

    return { valid: true, entry };
  } catch {
    return {
      valid: false,
      error: 'Unable to parse JSON file. Please select a valid snapshot file.',
    };
  }
}
