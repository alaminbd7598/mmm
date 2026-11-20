import packageJson from '../../package.json';
import type { AppReleaseEntry, AppVersionManagerConfig } from '../types/cms';

export interface AppVersionMetadata {
  version: string;
  tag: string;
  releaseDate: string;
  releaseTitle: string;
  changelog: string[];
  added: string[];
  improved: string[];
  removed: string[];
}

const PACKAGE_VERSION =
  typeof packageJson.version === 'string' && packageJson.version.trim()
    ? packageJson.version.trim()
    : '2.2.0';

/**
 * Single source of truth for the application semantic version and structured release notes.
 * Whenever package.json "version" bumps, resolveVersionManagerConfig automatically syncs
 * the latest release entry into both the Admin Dashboard and the Public Footer changelog modal.
 */
export const APP_VERSION_INFO: AppVersionMetadata = {
  version: PACKAGE_VERSION,
  tag: `v${PACKAGE_VERSION}`,
  releaseDate: '2026-11-20',
  releaseTitle:
    'v2.2.0 — Virtual Live Desk, 2027 Admission Token, Google Calendar Sync, AI Smart Publisher & Blog Portal',
  added: [
    'Virtual Office / Online-Offline Hybrid Live Desk with mandatory 3-field Lead-Capture Gate (Full Name, Phone, Email), live desk switchboard & Recharts peak-hours analytics',
    'Dedicated 2027 Admission Token Builder with exact 10-line Part A + Part B official fee schedule, Guardian auto-apply on Homepage Registration, and A4 Landscape Dual-Copy PDF (Office & Guardian Copy)',
    'Institutional Academic Calendar (separate from Teacher Leaves) with Bangladesh Govt & Islamic holidays, live Google Calendar sync with confirmation modal & .ics export',
    'AI Smart Publishing Assistant to parse Facebook links/posts or uploaded documents into Hifz Tree, Notice, Blog, Event, or News Ticker drafts with 1-click publish',
    'Public Blog Portal (/blog) with Markdown reader, Admin Blog CMS, and automated Bearer-authenticated webhook API (/api/blog/action-publish)',
    'Personal Staff Profile & Digital Signature Vault with canvas signature pad, auto-embedded Chairman/Principal/Coordinator signatures & live QR-verified Hifz Certificates',
    'Mobile App-Style customizable 5-slot Bottom Navigation Bar with live Branding Tab preview & configurator',
    'Official Maharat Recruitment Circulars (5 tracks) with Bangla QR ৳200 TrxID, PDF/DOC CV file upload & No-Login Application Status Tracker',
  ],
  improved: [
    'One-click cycling language switcher (বাং → EN → عر) without dropdown overlap and clean compact Login button alignment across mobile & desktop',
    'Unified split-screen Maharat Role-Based Login Portal with official Google Material Sign-In and External ERP portal links',
    'Homepage Leadership hierarchy reordered (Chairman Dr. Md. Nurullah on top, Acting Principal below) with larger portraits & CSS 3D tilt hover effect',
    'Balanced multi-screen responsive typography calibrated for Mobile, 14-inch laptops, 24-inch & 27-inch monitors',
    'Official 2027 Fee Guide rates synchronized across Fee Calculator, Admission Token 2027 & CMS seed data',
    'Renamed AI assistant everywhere to MMM AI Agent (এমএমএম এআই এজেন্ট) and Media Showcase (মিডিয়া শোকেস)',
  ],
  removed: [
    'Removed legacy footer "Admin Login" shortcut button for a cleaner institutional footer (EIIN: 140630 · MC: 21023)',
    'Removed top green-purple Live Deployment Sync banner and top-right Live Sync pill from Admin Dashboard',
    'Removed all numeric badge counters from the Admin Dashboard left sidebar',
  ],
  changelog: [
    'Virtual Office Hybrid Live Desk with strict server-side URL hiding until 3-field lead check-in',
    '2027 Admission Token Builder with Dual-Copy A4 Landscape PDF & Homepage auto-apply',
    'Institutional Academic Calendar with live Google Calendar OAuth sync & .ics export',
    'AI Smart Publishing Assistant, Public Blog Portal + Webhook API, QR-verified Certificates & Staff Signature Vault',
  ],
};

export const INITIAL_RELEASE_ENTRY: AppReleaseEntry = {
  id: `rel-v${APP_VERSION_INFO.version.replace(/\./g, '-')}`,
  version: APP_VERSION_INFO.version,
  tag: APP_VERSION_INFO.tag,
  title: APP_VERSION_INFO.releaseTitle,
  notes: APP_VERSION_INFO.changelog.join(' • '),
  added: APP_VERSION_INFO.added,
  improved: APP_VERSION_INFO.improved,
  removed: APP_VERSION_INFO.removed,
  createdAt: `${APP_VERSION_INFO.releaseDate}T09:00:00.000Z`,
  createdBy: 'Maharat Engineering & Admin',
};

export const PREVIOUS_BASELINE_RELEASE: AppReleaseEntry = {
  id: 'rel-v1-0-0',
  version: '1.0.0',
  tag: 'v1.0.0',
  title: 'Initial Production Release — Academic Portal, Hifz Lineage & Admin CMS',
  notes: 'Core public website, 1st–30th Hifzul Quran Lineage, Lead CRM, Teacher Leave Management & RBAC Matrix.',
  added: [
    'Core Maharat Model Madrasah public website with 3-language support (BN / EN / AR)',
    '1st–30th Hifzul Quran Honor Lineage Timeline & Photo Gallery',
    'Admin CMS with Lead-to-Admission CRM, Teacher Leaves & RBAC Permission Matrix',
  ],
  improved: ['Initial performance & accessibility baseline'],
  removed: [],
  createdAt: '2026-11-19T00:00:00.000Z',
  createdBy: 'Super Administrator',
};

export const DEFAULT_VERSION_MANAGER_CONFIG: AppVersionManagerConfig = {
  enabled: true,
  showInPublicFooter: true,
  showInAdminDashboard: true,
  activeVersion: APP_VERSION_INFO.version,
  currentVersion: APP_VERSION_INFO.version,
  releases: [INITIAL_RELEASE_ENTRY, PREVIOUS_BASELINE_RELEASE],
};
