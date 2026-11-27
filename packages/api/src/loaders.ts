import { REPORT_REASONS } from '@modqueue/shared';
import DataLoader from 'dataloader';
import type { Author, Community, Moderator, PrismaClient } from './generated/prisma/client';
import type { ReportReason } from './generated/prisma/enums';
import type { Clock } from './lib/clock';

export interface ReasonCount {
  reason: ReportReason;
  count: number;
}

export interface AuthorStats {
  removals: number;
  bans: number;
}

export interface ActiveBan {
  createdAt: Date;
  /** `null` for a permanent ban. */
  expiresAt: Date | null;
}

export interface Loaders {
  authors: DataLoader<string, Author>;
  communities: DataLoader<string, Community>;
  moderators: DataLoader<string, Moderator>;
  /** Report counts per reason of a content, count descending. */
  reasonCounts: DataLoader<string, ReasonCount[]>;
  /** Removal and ban counts of an author, by author id. */
  authorStats: DataLoader<string, AuthorStats>;
  /** The active ban of an author, by author id; `null` when the author is not banned. */
  activeBans: DataLoader<string, ActiveBan | null>;
}

/** Puts `rows` in the order of `ids`. An id without a row gets an Error, so its `load` rejects. */
function orderById<T extends { id: string }>(
  ids: readonly string[],
  rows: T[],
  model: string,
): (T | Error)[] {
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  return ids.map((id) => rowsById.get(id) ?? new Error(`${model} ${id} does not exist.`));
}

// Equal counts keep the order of the reason enum, so the result does not depend on the database.
function compareReasonCounts(a: ReasonCount, b: ReasonCount): number {
  return b.count - a.count || REPORT_REASONS.indexOf(a.reason) - REPORT_REASONS.indexOf(b.reason);
}

/** Creates the per-request DataLoaders; each one batches its keys into one SQL query. */
export function createLoaders(prisma: PrismaClient, now: Clock): Loaders {
  return {
    authors: new DataLoader(async (ids) =>
      orderById(ids, await prisma.author.findMany({ where: { id: { in: [...ids] } } }), 'Author'),
    ),
    communities: new DataLoader(async (ids) =>
      orderById(
        ids,
        await prisma.community.findMany({ where: { id: { in: [...ids] } } }),
        'Community',
      ),
    ),
    moderators: new DataLoader(async (ids) =>
      orderById(
        ids,
        await prisma.moderator.findMany({ where: { id: { in: [...ids] } } }),
        'Moderator',
      ),
    ),

    reasonCounts: new DataLoader(async (contentIds) => {
      const groups = await prisma.report.groupBy({
        by: ['contentId', 'reason'],
        where: { contentId: { in: [...contentIds] } },
        _count: { _all: true },
      });
      const countsByContent = new Map<string, ReasonCount[]>();
      for (const group of groups) {
        const counts = countsByContent.get(group.contentId) ?? [];
        counts.push({ reason: group.reason, count: group._count._all });
        countsByContent.set(group.contentId, counts);
      }
      return contentIds.map((id) => (countsByContent.get(id) ?? []).sort(compareReasonCounts));
    }),

    authorStats: new DataLoader(async (authorIds) => {
      // One row per author, type and batch: a bulk ban of three items by one author is one ban,
      // but each removed item is one removal.
      const groups = await prisma.modAction.groupBy({
        by: ['authorId', 'type', 'batchId'],
        where: {
          authorId: { in: [...authorIds] },
          type: { in: ['REMOVE', 'BAN'] },
          undoneAt: null,
        },
        _count: { _all: true },
      });
      const statsByAuthor = new Map<string, AuthorStats>();
      for (const group of groups) {
        const stats = statsByAuthor.get(group.authorId) ?? { removals: 0, bans: 0 };
        if (group.type === 'REMOVE') stats.removals += group._count._all;
        else stats.bans += 1;
        statsByAuthor.set(group.authorId, stats);
      }
      return authorIds.map((id) => statsByAuthor.get(id) ?? { removals: 0, bans: 0 });
    }),

    activeBans: new DataLoader(async (authorIds) => {
      const bans = await prisma.modAction.findMany({
        where: {
          authorId: { in: [...authorIds] },
          type: 'BAN',
          undoneAt: null,
          OR: [{ banExpiresAt: null }, { banExpiresAt: { gt: now() } }],
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: { authorId: true, createdAt: true, banExpiresAt: true },
      });
      const latestByAuthor = new Map<string, ActiveBan>();
      for (const ban of bans) {
        // The rows are newest first, so the first ban of each author is the latest one.
        if (!latestByAuthor.has(ban.authorId)) {
          latestByAuthor.set(ban.authorId, {
            createdAt: ban.createdAt,
            expiresAt: ban.banExpiresAt,
          });
        }
      }
      return authorIds.map((id) => latestByAuthor.get(id) ?? null);
    }),
  };
}
