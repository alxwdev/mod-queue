import { execSync } from 'node:child_process';

/** The E2E database: docker/postgres/init.sql creates it, and CI uses the same credentials. */
export const E2E_DATABASE_URL = 'postgresql://modqueue:modqueue@localhost:5432/modqueue_e2e';

/** Applies the migrations to the E2E database and seeds the `e2e` preset before any test runs. */
export default function globalSetup(): void {
  // The migrations and the seed prefer DATABASE_URL_UNPOOLED, and the root .env points both
  // variables at the dev database. Variables that are already set win over the file.
  const env = {
    ...process.env,
    DATABASE_URL: E2E_DATABASE_URL,
    DATABASE_URL_UNPOOLED: E2E_DATABASE_URL,
  };
  execSync('pnpm --filter @modqueue/api db:migrate:deploy', { env, stdio: 'pipe' });
  execSync('pnpm --filter @modqueue/api db:seed --preset e2e', { env, stdio: 'pipe' });
}
