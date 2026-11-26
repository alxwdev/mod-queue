import { existsSync } from 'node:fs';
import type { Config } from 'jest';

// Jest does not read .env files. Load the root .env the same way as prisma.config.ts, so the
// global setup and the tests see DATABASE_URL_TEST. Variables that are already set (CI) win.
const envFile = '../../.env';
if (existsSync(envFile)) process.loadEnvFile(envFile);

// The thresholds are reported now and enforced from task 11.4, which sets the variable in CI.
const enforceThresholds = process.env.COVERAGE_THRESHOLDS === '1';

const config: Config = {
  testEnvironment: 'node',
  transform: { '^.+\\.[jt]s$': '@swc/jest' },
  // Faker 10 ships only ES modules, and Jest runs in CommonJS mode: let @swc/jest compile it.
  // The optional group matches pnpm's real path (node_modules/.pnpm/<name>@<version>/node_modules).
  transformIgnorePatterns: [
    '/node_modules/(?!(\\.pnpm/@faker-js\\+faker@[^/]+/node_modules/)?@faker-js/faker/)',
  ],
  globalSetup: '<rootDir>/test/global-setup.ts',
  // All integration tests share one database: parallel workers would truncate each other's rows.
  maxWorkers: 1,
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts', '!src/generated/**'],
  coverageThreshold: enforceThresholds
    ? { global: {}, './src/lib/': { lines: 80 }, './src/services/': { lines: 80 } }
    : undefined,
};

export default config;
