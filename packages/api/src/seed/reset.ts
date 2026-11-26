import type { PrismaClient } from '../generated/prisma/client';
import { type DatasetSummary, generateDataset, summarizeDataset } from './generate';
import type { SeedPresetName } from './presets';

const BATCH_SIZE = 1_000;
// The full preset inserts about 50,000 rows; Prisma's default of 5 s is too short for that.
const TRANSACTION_TIMEOUT_MS = 60_000;

/** Replaces all data with the demo data of `preset` in one transaction and returns its counts. */
export async function resetDemoData(
  prisma: PrismaClient,
  preset: SeedPresetName,
  now: Date,
): Promise<DatasetSummary> {
  const dataset = generateDataset(preset, { now });
  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`TRUNCATE TABLE "ModAction", "Report", "Content", "RemovalReason", "Author", "Community", "Moderator" RESTART IDENTITY CASCADE`;
      // Parents before children, so that every foreign key finds its row.
      await insertInBatches(dataset.moderators, (data) => tx.moderator.createMany({ data }));
      await insertInBatches(dataset.communities, (data) => tx.community.createMany({ data }));
      await insertInBatches(dataset.removalReasons, (data) =>
        tx.removalReason.createMany({ data }),
      );
      await insertInBatches(dataset.authors, (data) => tx.author.createMany({ data }));
      await insertInBatches(dataset.contents, (data) => tx.content.createMany({ data }));
      await insertInBatches(dataset.reports, (data) => tx.report.createMany({ data }));
      await insertInBatches(dataset.modActions, (data) => tx.modAction.createMany({ data }));
    },
    { timeout: TRANSACTION_TIMEOUT_MS },
  );
  return summarizeDataset(dataset, now);
}

async function insertInBatches<T>(rows: T[], insert: (batch: T[]) => Promise<unknown>) {
  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    await insert(rows.slice(start, start + BATCH_SIZE));
  }
}
