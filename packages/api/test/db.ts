import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

/** Prisma client for the test database. global-setup.ts has already checked and migrated it. */
export const testPrisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL_TEST ?? '' }),
  // Query events let a test count the SQL queries of an operation: testPrisma.$on('query', …).
  log: [{ emit: 'event', level: 'query' }],
});

// Jest gives every test file its own module registry, so every file gets its own client.
// Close its connection pool when the file ends, or the open connections keep Jest from exiting.
afterAll(() => testPrisma.$disconnect());

/** Deletes every row from every application table (all tables except Prisma's migration table). */
export async function truncateAll(): Promise<void> {
  const tables = await testPrisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const tableList = tables.map(({ tablename }) => `"public"."${tablename}"`).join(', ');
  await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList}`);
}
