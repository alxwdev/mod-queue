import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The workspace packages export TypeScript sources, so Next compiles them.
  transpilePackages: ['@modqueue/api', '@modqueue/shared'],
  poweredByHeader: false,
  // Agent rules live in the repo's CLAUDE.md; stop `next dev` from writing AGENTS.md.
  agentRules: false,
};

export default nextConfig;
