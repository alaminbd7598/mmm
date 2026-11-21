/**
 * Sample sign-ins of the in-memory demo store, keyed by seed user id. Server-side only: they are
 * handed to the login page by GET /api/state while the demo admin is enabled, and are never used
 * in database mode (see buildSeedPlan in ./seed.ts).
 */
export const DEMO_STAFF_PASSWORDS: Readonly<Record<string, string>> = {
  'usr-super': 'admin123',
  'usr-chairman': 'chairman123',
  'usr-principal': 'principal123',
  'usr-teacher': 'teacher123',
  'usr-manager': 'manager123',
};
