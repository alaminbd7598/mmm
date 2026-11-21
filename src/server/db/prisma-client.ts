import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../generated/prisma/client';

export type DbClient = PrismaClient;

/** How long a request waits for a database connection before it fails (driver default: 10 s). */
const ACQUIRE_TIMEOUT_MS = 4_000;

/**
 * DATABASE_URL with a shorter connection wait, so requests fail fast (503) while the database is
 * down instead of hanging. An `acquireTimeout` given in the URL by the owner is kept.
 */
export function withPoolDefaults(databaseUrl: string): string {
  try {
    const url = new URL(databaseUrl);
    if (!url.searchParams.has('acquireTimeout')) url.searchParams.set('acquireTimeout', String(ACQUIRE_TIMEOUT_MS));
    return url.toString();
  } catch {
    return databaseUrl;
  }
}

/** Prisma client over the pure-JS MariaDB driver (works with MySQL 5.7+/8 and MariaDB 10.x). */
export function createPrismaClient(databaseUrl: string): DbClient {
  return new PrismaClient({ adapter: new PrismaMariaDb(withPoolDefaults(databaseUrl)) });
}
