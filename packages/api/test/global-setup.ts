import { execSync } from 'node:child_process';

/** Checks DATABASE_URL_TEST and applies the migrations to that database before any test runs. */
export default function globalSetup(): void {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) {
    throw new Error(
      'DATABASE_URL_TEST is not set. Add it to .env (see .env.example) or to the environment.',
    );
  }

  // truncateAll() deletes every row, so a wrong URL must never reach a dev or production database.
  const databaseName = new URL(url).pathname.slice(1);
  if (!databaseName.endsWith('_test')) {
    throw new Error(
      `DATABASE_URL_TEST must name a database that ends with "_test", not "${databaseName}".`,
    );
  }

  // prisma.config.ts migrates DATABASE_URL_UNPOOLED; the root .env does not override it here.
  execSync('pnpm exec prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL_UNPOOLED: url },
    stdio: 'pipe',
  });
}
