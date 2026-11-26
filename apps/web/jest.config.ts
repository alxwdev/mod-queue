import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

// The thresholds are reported now and enforced from task 11.4, which sets the variable in CI.
const enforceThresholds = process.env.COVERAGE_THRESHOLDS === '1';

const config: Config = {
  testEnvironment: 'jest-fixed-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Only colocated unit and component tests: the Playwright specs in e2e/ are not Jest tests.
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/gql/**',
    '!src/test/**',
  ],
  coverageThreshold: enforceThresholds
    ? { global: {}, './src/**/hooks/**': { lines: 80 }, './src/**/lib/**': { lines: 80 } }
    : undefined,
};

// MSW 2 is CommonJS, but some of its dependencies ship only ES modules, and Jest runs in CommonJS
// mode: let SWC compile them. The optional group matches pnpm's real path
// (node_modules/.pnpm/<name>@<version>/node_modules/<name>).
const esmPackages = ['rettime', 'until-async', '@open-draft/deferred-promise'];
const esmNames = esmPackages.join('|');
const esmPnpmNames = esmPackages.map((name) => name.replace('/', '\\+')).join('|');
const nodeModulesPattern = `/node_modules/(?!(\\.pnpm/(${esmPnpmNames})@[^/]+/node_modules/)?(${esmNames})/)`;

// next/jest only appends custom transformIgnorePatterns to its own '/node_modules/' patterns, and
// any matching pattern skips the file, so replace its node_modules patterns instead.
export default async function jestConfig(): Promise<Config> {
  const nextConfig = await createJestConfig(config)();
  const otherPatterns = (nextConfig.transformIgnorePatterns ?? []).filter(
    (pattern) => !pattern.includes('node_modules'),
  );
  return { ...nextConfig, transformIgnorePatterns: [nodeModulesPattern, ...otherPatterns] };
}
