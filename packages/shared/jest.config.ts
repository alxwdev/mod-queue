import type { Config } from 'jest';

// The thresholds are reported now and enforced from task 11.4, which sets the variable in CI.
const enforceThresholds = process.env.COVERAGE_THRESHOLDS === '1';

const config: Config = {
  testEnvironment: 'node',
  transform: { '^.+\\.ts$': '@swc/jest' },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts'],
  // `global` covers src only: collectCoverageFrom has no other files.
  coverageThreshold: enforceThresholds ? { global: { lines: 80 } } : undefined,
};

export default config;
