import { randomUUID } from 'node:crypto';
import type { Prisma } from '../src/generated/prisma/client';
import { testPrisma } from './db';

/** Default time of factory rows, so that no row depends on the wall clock. */
export const FACTORY_DATE = new Date('2026-01-01T00:00:00.000Z');

// Every test file has its own module registry, so a counter would restart in each file and
// collide with rows that an earlier file left in the database.
function uniqueSuffix(): string {
  return randomUUID().slice(0, 8);
}

/** Inserts a moderator with a unique username. */
export function createModerator(data: Partial<Prisma.ModeratorUncheckedCreateInput> = {}) {
  const username = `mod_${uniqueSuffix()}`;
  return testPrisma.moderator.create({ data: { username, displayName: username, ...data } });
}

/** Inserts a community with a unique slug. */
export function createCommunity(data: Partial<Prisma.CommunityUncheckedCreateInput> = {}) {
  const slug = `community-${uniqueSuffix()}`;
  return testPrisma.community.create({ data: { slug, name: slug, ...data } });
}

/** Inserts an author with a unique username. */
export function createAuthor(data: Partial<Prisma.AuthorUncheckedCreateInput> = {}) {
  return testPrisma.author.create({ data: { username: `author_${uniqueSuffix()}`, ...data } });
}

export type ContentInput = Partial<
  Omit<Prisma.ContentUncheckedCreateInput, 'reportCount' | 'reports'>
> & {
  /** Every content has at least one report; the default is one SPAM report. */
  reports?: Partial<Prisma.ReportCreateManyContentInput>[];
};

/**
 * Inserts a content with its reports and creates the community and author when they are not given.
 * `reportCount` is the number of reports; a report without `createdAt` gets `firstReportedAt`.
 */
export async function createContent({ reports = [{}], ...data }: ContentInput = {}) {
  const firstReportedAt = data.firstReportedAt ?? FACTORY_DATE;
  const communityId = data.communityId ?? (await createCommunity()).id;
  const authorId = data.authorId ?? (await createAuthor()).id;
  return testPrisma.content.create({
    data: {
      type: 'POST',
      title: 'Test post',
      body: 'Test body',
      ...data,
      firstReportedAt,
      communityId,
      authorId,
      reportCount: reports.length,
      reports: {
        createMany: {
          data: reports.map((report) => ({
            reason: 'SPAM' as const,
            createdAt: firstReportedAt,
            ...report,
          })),
        },
      },
    },
  });
}

/** Inserts a removal reason. */
export function createReason(data: Partial<Prisma.RemovalReasonUncheckedCreateInput> = {}) {
  return testPrisma.removalReason.create({
    data: { title: 'Test reason', messageTemplate: 'Removed for {{reason}}.', ...data },
  });
}

/**
 * Inserts a mod action and creates the content and moderator when they are not given.
 * The target author is the content's author unless `authorId` is given.
 */
export async function createAction(data: Partial<Prisma.ModActionUncheckedCreateInput> = {}) {
  const content =
    data.contentId === undefined
      ? await createContent()
      : await testPrisma.content.findUniqueOrThrow({ where: { id: data.contentId } });
  const moderatorId = data.moderatorId ?? (await createModerator()).id;
  return testPrisma.modAction.create({
    data: {
      batchId: randomUUID(),
      type: 'APPROVE',
      createdAt: FACTORY_DATE,
      ...data,
      contentId: content.id,
      authorId: data.authorId ?? content.authorId,
      moderatorId,
    },
  });
}
