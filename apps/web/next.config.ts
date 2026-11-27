import { existsSync } from 'node:fs';
import type { NextConfig } from 'next';

// Next.js reads .env files only from apps/web. Load the root .env the same way as
// packages/api/prisma.config.ts, so the API sees DATABASE_URL locally. Variables that are already
// set (Playwright, CI, Vercel) win over the file. Restart the server after a change to the file.
const envFile = '../../.env';
if (existsSync(envFile)) process.loadEnvFile(envFile);

const nextConfig: NextConfig = {
  // The workspace packages export TypeScript sources, so Next compiles them.
  transpilePackages: ['@modqueue/api', '@modqueue/shared'],
  poweredByHeader: false,
  // Agent rules live in the repo's CLAUDE.md; stop `next dev` from writing AGENTS.md.
  agentRules: false,
};

export default nextConfig;
