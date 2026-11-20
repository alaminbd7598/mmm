import test from 'node:test';
import assert from 'node:assert/strict';
import { APP_VERSION_INFO } from '../config/appVersion';
import { INITIAL_CMS_STATE } from '../data/seedData';
import { mergeLiveCMSState } from './cmsLogic';
import {
  bumpSemver,
  createReleaseEntry,
  normalizeSemver,
  resolveVersionManagerConfig,
  rollbackToReleaseSnapshot,
  shouldShowAdminVersion,
  shouldShowPublicVersion,
  validateImportedReleaseSnapshot,
} from './versionLogic';

test('Version semver helpers normalize and increment patch, minor, and major versions cleanly', () => {
  assert.equal(normalizeSemver('v1.2.3'), '1.2.3');
  assert.equal(normalizeSemver('2.4'), '2.4.0');
  assert.equal(bumpSemver('1.0.0', 'patch'), '1.0.1');
  assert.equal(bumpSemver('1.0.4', 'minor'), '1.1.0');
  assert.equal(bumpSemver('1.3.9', 'major'), '2.0.0');
});

test('Version visibility predicates enforce master toggle and independent placement switches', () => {
  const base = resolveVersionManagerConfig({
    enabled: true,
    showInPublicFooter: true,
    showInAdminDashboard: true,
    activeVersion: '1.0.0',
  });
  assert.equal(shouldShowPublicVersion(base), true);
  assert.equal(shouldShowAdminVersion(base), true);

  // Turning off master hides everywhere regardless of individual toggles
  const masterOff = { ...base, enabled: false };
  assert.equal(shouldShowPublicVersion(masterOff), false);
  assert.equal(shouldShowAdminVersion(masterOff), false);

  // Independent switches control each placement separately
  const onlyAdmin = { ...base, showInPublicFooter: false, showInAdminDashboard: true };
  assert.equal(shouldShowPublicVersion(onlyAdmin), false);
  assert.equal(shouldShowAdminVersion(onlyAdmin), true);

  const onlyPublic = { ...base, showInPublicFooter: true, showInAdminDashboard: false };
  assert.equal(shouldShowPublicVersion(onlyPublic), true);
  assert.equal(shouldShowAdminVersion(onlyPublic), false);
});

test('Release snapshot creation and rollback restore previous config while preserving leads and saving an auto safety backup', () => {
  const v1State = {
    ...INITIAL_CMS_STATE,
    settings: {
      ...INITIAL_CMS_STATE.settings,
      heroTitle: 'Original v1.0.0 Hero Title',
    },
  };

  // Capture next minor release from current APP_VERSION_INFO
  const expectedMinor = bumpSemver(APP_VERSION_INFO.version, 'minor');
  const { nextConfig: cfgV11, createdRelease: relV11 } = createReleaseEntry(v1State, {
    bumpType: 'minor',
    title: `Client Approved v${expectedMinor}`,
    notes: 'Original hero title snapshot',
    createdBy: 'Super Admin',
  });
  assert.equal(relV11.tag, `v${expectedMinor}`);
  assert.equal(cfgV11.activeVersion, expectedMinor);

  // Simulate later edit + a new student lead arriving
  const editedState = {
    ...v1State,
    versionManager: cfgV11,
    settings: {
      ...v1State.settings,
      heroTitle: 'Modified v1.2.0 Experimental Title',
    },
    leads: [
      ...v1State.leads,
      {
        id: 'lead-new-preserved',
        name: 'Preserved Applicant',
        phone: '01700-000001',
        email: 'preserved@example.com',
        courseId: v1State.courses[0].id,
        courseTitle: v1State.courses[0].title,
        message: 'Must survive rollback',
        status: 'New' as const,
        source: 'Registration Form' as const,
        submittedAt: '2026-11-19 10:00 AM',
      },
    ],
  };

  // Roll back to v1.1.0
  const rollback = rollbackToReleaseSnapshot(editedState, relV11.id, 'Super Admin');
  assert.equal(rollback.success, true);
  assert.ok(rollback.nextState);
  assert.equal(rollback.nextState.settings.heroTitle, 'Original v1.0.0 Hero Title');
  assert.equal(rollback.nextState.versionManager?.activeVersion, expectedMinor);
  // Operational CRM leads must remain intact
  assert.equal(
    rollback.nextState.leads.some((l) => l.id === 'lead-new-preserved'),
    true
  );
  // Pre-rollback auto safety backup must be recorded at index 0
  assert.equal(rollback.nextState.versionManager?.releases[0]?.isAutoBackup, true);
  assert.equal(
    rollback.nextState.versionManager?.releases[0]?.snapshot?.settings.heroTitle,
    'Modified v1.2.0 Experimental Title'
  );
});

test('Release snapshot JSON import validates structure and rejects invalid files', () => {
  const { createdRelease } = createReleaseEntry(INITIAL_CMS_STATE, {
    bumpType: 'patch',
    title: 'Exportable Release',
    notes: 'Archived for client',
    createdBy: 'Super Admin',
  });
  const exportedJson = JSON.stringify({ release: createdRelease });
  const ok = validateImportedReleaseSnapshot(exportedJson);
  assert.equal(ok.valid, true);
  assert.equal(ok.entry?.tag, createdRelease.tag);

  const bad = validateImportedReleaseSnapshot('{"hello":"world"}');
  assert.equal(bad.valid, false);
});

test('mergeLiveCMSState migrates legacy transport_van asset path and initializes versionManager', () => {
  const merged = mergeLiveCMSState(
    {
      transportConfig: {
        ...INITIAL_CMS_STATE.transportConfig,
        vehicleImageUrl: '/assets/legacy/transport_van.png',
      },
    },
    INITIAL_CMS_STATE
  );
  assert.equal(merged.transportConfig.vehicleImageUrl, '/assets/maharat/transport-van.png');
  assert.ok(merged.versionManager);
  assert.equal(merged.versionManager?.activeVersion, APP_VERSION_INFO.version);
});
