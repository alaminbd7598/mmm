import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import type { InstitutionalCalendarEvent } from '../types/cms';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

let cachedAuthInstance: Auth | null = null;
let cachedProvider: GoogleAuthProvider | null = null;

function getSafeAuth(): Auth | null {
  if (cachedAuthInstance) return cachedAuthInstance;
  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    cachedAuthInstance = getAuth(app);
    return cachedAuthInstance;
  } catch {
    return null;
  }
}

function getSafeProvider(): GoogleAuthProvider {
  if (!cachedProvider) {
    const p = new GoogleAuthProvider();
    SCOPES.forEach((scope) => p.addScope(scope));
    p.setCustomParameters({ prompt: 'select_account' });
    cachedProvider = p;
  }
  return cachedProvider;
}

// Keep OAuth access token strictly in memory (NEVER in localStorage/sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedGoogleUser: User | null = null;

export interface GoogleWorkspaceSession {
  user: {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string;
  };
  accessToken: string;
}

export function initGoogleWorkspaceAuth(
  onSignedIn?: (session: GoogleWorkspaceSession) => void,
  onSignedOut?: () => void
) {
  const auth = getSafeAuth();
  if (!auth) {
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => {
    if (user && cachedAccessToken) {
      cachedGoogleUser = user;
      onSignedIn?.({
        user: {
          uid: user.uid,
          displayName: user.displayName || user.email || 'Google User',
          email: user.email || '',
          photoURL: user.photoURL || '',
        },
        accessToken: cachedAccessToken,
      });
    } else if (!isSigningIn) {
      cachedGoogleUser = null;
      cachedAccessToken = null;
      onSignedOut?.();
    }
  });
}

export async function signInWithGoogleWorkspace(): Promise<GoogleWorkspaceSession> {
  const auth = getSafeAuth();
  if (!auth) {
    throw new Error('Google Sign-In service is currently unavailable. Please use User ID & Password.');
  }
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, getSafeProvider());
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || '';
    if (!accessToken) {
      throw new Error('Google Calendar access token was not returned. Please try again.');
    }
    cachedAccessToken = accessToken;
    cachedGoogleUser = result.user;
    return {
      user: {
        uid: result.user.uid,
        displayName: result.user.displayName || result.user.email || 'Google Account',
        email: result.user.email || '',
        photoURL: result.user.photoURL || '',
      },
      accessToken,
    };
  } finally {
    isSigningIn = false;
  }
}

export function getGoogleCalendarToken(): string | null {
  return cachedAccessToken;
}

export function getConnectedGoogleUser(): User | null {
  return cachedGoogleUser;
}

export async function signOutGoogleWorkspace(): Promise<void> {
  cachedAccessToken = null;
  cachedGoogleUser = null;
  const auth = getSafeAuth();
  if (!auth) return;
  try {
    await signOut(auth);
  } catch {
    // Ignore sign-out errors if not signed in
  }
}

/**
 * Fetches upcoming events from the user's primary Google Calendar AND Bangladesh Public Holidays calendar.
 */
export async function fetchGoogleCalendarEvents(
  accessToken: string,
  timeMinIso?: string,
  timeMaxIso?: string
): Promise<InstitutionalCalendarEvent[]> {
  const now = new Date();
  const minIso = timeMinIso || new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const maxIso = timeMaxIso || new Date(now.getFullYear() + 1, 5, 30).toISOString();

  const calendars = [
    { id: 'primary', category: 'google-sync' as const, source: 'google' as const },
    {
      id: encodeURIComponent('en.bd#holiday@group.v.calendar.google.com'),
      category: 'govt-holiday' as const,
      source: 'govt' as const,
    },
  ];

  const results: InstitutionalCalendarEvent[] = [];

  for (const cal of calendars) {
    try {
      const url = `https://www.googleapis.com/calendar/v3/calendars/${cal.id}/events?singleEvents=true&orderBy=startTime&maxResults=60&timeMin=${encodeURIComponent(minIso)}&timeMax=${encodeURIComponent(maxIso)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as {
        items?: Array<{
          id?: string;
          summary?: string;
          description?: string;
          start?: { date?: string; dateTime?: string };
          htmlLink?: string;
        }>;
      };
      for (const item of data.items || []) {
        const startRaw = item.start?.date || item.start?.dateTime || '';
        const dateStr = startRaw.slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;
        const summary = item.summary || 'Google Calendar Event';
        const isIslamic =
          /eid|ramadan|shab|ashura|milad|muharram|ঈদ|শবে|আশুরা/i.test(summary);
        results.push({
          id: `gcal-${item.id || Math.random().toString(36).slice(2, 8)}`,
          googleEventId: item.id,
          titleBn: summary,
          titleEn: summary,
          date: dateStr,
          time: item.start?.dateTime ? item.start.dateTime.slice(11, 16) : undefined,
          category: isIslamic ? 'islamic-holiday' : cal.category,
          descriptionBn: item.description || '',
          source: cal.source,
          htmlLink: item.htmlLink,
        });
      }
    } catch {
      // Continue with remaining calendars
    }
  }

  return results;
}

/**
 * Pushes an institutional event to the user's primary Google Calendar (MUST only be called after explicit user confirmation!).
 */
export async function pushEventToGoogleCalendar(
  accessToken: string,
  event: InstitutionalCalendarEvent
): Promise<{ id: string; htmlLink?: string }> {
  const startDate = event.date;
  const nextDay = new Date(`${startDate}T00:00:00Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const endDate = nextDay.toISOString().slice(0, 10);

  const payload = {
    summary: event.titleEn ? `${event.titleBn} (${event.titleEn})` : event.titleBn,
    description: `${event.descriptionBn || ''}\n\n— Maharat Model Madrasah (EIIN: 140630 | MC: 21023)`.trim(),
    start: { date: startDate },
    end: { date: endDate },
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Google Calendar sync failed (${res.status}): ${errText.slice(0, 160)}`);
  }

  const created = (await res.json()) as { id: string; htmlLink?: string };
  return { id: created.id, htmlLink: created.htmlLink };
}

/**
 * Deletes a previously synced event from the user's primary Google Calendar (MUST only be called after explicit user confirmation!).
 */
export async function deleteEventFromGoogleCalendar(
  accessToken: string,
  googleEventId: string
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleEventId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to remove Google Calendar event (${res.status})`);
  }
}
