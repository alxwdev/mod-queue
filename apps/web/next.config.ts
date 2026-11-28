import { existsSync } from 'node:fs';
import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';

// Next.js reads .env files only from apps/web. Load the root .env the same way as
// packages/api/prisma.config.ts, so the API sees DATABASE_URL locally. Variables that are already
// set (Playwright, CI, Vercel) win over the file. Restart the server after a change to the file.
const envFile = '../../.env';
if (existsSync(envFile)) process.loadEnvFile(envFile);

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  // The workspace packages export TypeScript sources, so Next compiles them.
  transpilePackages: ['@modqueue/api', '@modqueue/shared'],
  poweredByHeader: false,
  // Agent rules live in the repo's CLAUDE.md; stop `next dev` from writing AGENTS.md.
  agentRules: false,
  headers: () => Promise.resolve([{ source: '/:path*', headers: securityHeaders }]),
};

// SENTRY_ORG, SENTRY_PROJECT and SENTRY_AUTH_TOKEN configure the source map upload; only Vercel
// builds have the token, so local and CI builds upload nothing.
export default withSentryConfig(nextConfig, {
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  // The build sends no usage data of its own to Sentry.
  telemetry: false,
  silent: !process.env.CI,
});
