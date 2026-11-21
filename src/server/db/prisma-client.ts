import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../generated/prisma/client';

export type DbClient = PrismaClient;

/** Prisma client over the pure-JS MariaDB driver (works with MySQL 5.7+/8 and MariaDB 10.x). */
export function createPrismaClient(databaseUrl: string): DbClient {
  return new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });
}
