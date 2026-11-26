import { parseArgs } from 'node:util';
import { createPrismaClient } from '../db';
import { isSeedPresetName } from './presets';
import { resetDemoData } from './reset';

// The seed deletes every row first, so a remote database needs an explicit --yes.
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      preset: { type: 'string', default: 'full' },
      yes: { type: 'boolean', default: false },
    },
  });
  const { preset, yes } = values;
  if (!isSeedPresetName(preset)) {
    exitWithError(`Unknown preset "${preset}". Use --preset full or --preset e2e.`);
  }

  // The same URL as the migrations (prisma.config.ts): the direct connection when there is one.
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) {
    exitWithError(
      'DATABASE_URL is not set. Add it to .env (see .env.example) or to the environment.',
    );
  }
  const host = new URL(url).hostname;
  if (!LOCAL_HOSTS.has(host) && !yes) {
    exitWithError(
      `The database host "${host}" is not localhost, and the seed deletes all its data. Add --yes to seed it.`,
    );
  }

  const prisma = createPrismaClient(url);
  try {
    const startedAt = performance.now();
    const summary = await resetDemoData(prisma, preset, new Date());
    const seconds = ((performance.now() - startedAt) / 1000).toFixed(1);
    const rows: [string, number][] = [
      ['visible pending', summary.visiblePending],
      ['scheduled', summary.scheduled],
      ['resolved', summary.resolved],
      ['reports', summary.reports],
      ['actions', summary.actions],
    ];
    const lines = rows.map(
      ([label, count]) => `  ${label.padEnd(16)}${count.toLocaleString('en-US').padStart(7)}`,
    );
    process.stdout.write(
      `Seeded preset "${preset}" on ${host} in ${seconds} s:\n${lines.join('\n')}\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

function exitWithError(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
