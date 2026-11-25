import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

/** Creates a Prisma client that connects to `url` through the node-postgres driver adapter. */
export function createPrismaClient(url: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

// Dev servers re-run modules on every change; the globalThis cache keeps one connection pool.
const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };
let client: PrismaClient | undefined;

/** Returns the shared Prisma client for `DATABASE_URL` and creates it on first use. */
export function getPrisma(): PrismaClient {
  client ??= globalForPrisma.prisma ?? createPrismaClient(readDatabaseUrl());
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client;
  return client;
}

function readDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add it to .env (see .env.example) or to the environment.',
    );
  }
  return url;
}
