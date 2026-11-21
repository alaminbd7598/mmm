/** Server-generated record ids and display timestamps for records created by the state APIs. */
import { randomUUID } from 'node:crypto';

export type IdFactory = (prefix: string) => string;

/** `<prefix>-<epoch ms>-<8 random hex>`: same shape as client ids, but unguessable and collision-free. */
export const newId: IdFactory = (prefix) => `${prefix}-${Date.now()}-${randomUUID().replace(/-/g, '').slice(0, 8)}`;

const DISPLAY_FORMAT = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Dhaka',
});

/**
 * `submittedAt` / note timestamps in the format the client store has always written
 * (e.g. "Nov 18, 2026, 11:20 AM"), in the institute's time zone.
 */
export const formatDisplayTimestamp = (date: Date): string => DISPLAY_FORMAT.format(date);
