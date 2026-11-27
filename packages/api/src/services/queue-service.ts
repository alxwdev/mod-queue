import * as z from 'zod';
import type { GraphQLContext } from '../context';
import type { Content, Prisma } from '../generated/prisma/client';
import type { QueueAge, QueueFilter, QueueSort } from '../generated/resolvers-types';
import { clampFirst, decodeCursor, encodeCursor } from '../lib/cursor';
import { queueCursorValues, queueKeysetWhere, queueOrderBy } from '../lib/keyset';

const HOUR_MS = 3_600_000;
/** Most items of one queue page. */
const MAX_PAGE_SIZE = 100;

export type QueueContext = Pick<GraphQLContext, 'prisma' | 'now'>;

export interface QueuePageArgs {
  first: number;
  after?: string | null;
  filter?: QueueFilter | null;
  sort: QueueSort;
}

/** One queue page: the parent of the GraphQL `ContentConnection`. */
export interface QueueConnection {
  edges: { cursor: string; node: Content }[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  /** The filter of the page, so that the `totalCount` field counts the same queue. */
  filter: QueueFilter | null | undefined;
}

function hoursBefore(now: Date, hours: number): Date {
  return new Date(now.getTime() - hours * HOUR_MS);
}

function ageFilter(age: QueueAge | null | undefined, now: Date): Prisma.DateTimeFilter {
  switch (age) {
    case 'LAST_HOUR':
      return { gte: hoursBefore(now, 1) };
    case 'LAST_24_HOURS':
      return { gte: hoursBefore(now, 24) };
    case 'OLDER_THAN_24_HOURS':
      return { lt: hoursBefore(now, 24) };
    default:
      return {};
  }
}

/**
 * The queue as a Prisma filter: pending items that are visible at `now` and match `filter`.
 * An empty list filters nothing, like a missing one.
 */
export function buildQueueWhere(
  filter: QueueFilter | null | undefined,
  now: Date,
): Prisma.ContentWhereInput {
  const { reasons, types, communitySlugs, age }: QueueFilter = filter ?? {};
  return {
    status: 'PENDING',
    firstReportedAt: { ...ageFilter(age, now), lte: now },
    // Prisma skips a condition whose value is undefined.
    reports: reasons?.length ? { some: { reason: { in: reasons } } } : undefined,
    type: types?.length ? { in: types } : undefined,
    community: communitySlugs?.length ? { slug: { in: communitySlugs } } : undefined,
  };
}

/** Returns one page of the queue in `sort` order, after the cursor `after`. */
export async function getQueuePage(
  { prisma, now }: QueueContext,
  { first, after, filter, sort }: QueuePageArgs,
): Promise<QueueConnection> {
  const size = clampFirst(first, MAX_PAGE_SIZE);
  const orderBy = queueOrderBy(sort);
  const queueWhere = buildQueueWhere(filter, now());
  // A cursor holds the values of the orderBy fields, so its length is the number of fields.
  const where = after
    ? { AND: [queueWhere, queueKeysetWhere(sort, decodeCursor(after, orderBy.length))] }
    : queueWhere;
  // One row more than the page size tells whether a next page exists.
  const rows = await prisma.content.findMany({ where, orderBy, take: size + 1 });
  const edges = rows
    .slice(0, size)
    .map((node) => ({ cursor: encodeCursor(queueCursorValues(sort, node)), node }));
  return {
    edges,
    pageInfo: { hasNextPage: rows.length > size, endCursor: edges.at(-1)?.cursor ?? null },
    filter,
  };
}

/** Counts the queue items that match `filter`. */
export function countQueue(
  { prisma, now }: QueueContext,
  filter: QueueFilter | null | undefined,
): Promise<number> {
  return prisma.content.count({ where: buildQueueWhere(filter, now()) });
}

const uuid = z.uuid();

/** Returns a visible item of any status, or `null` for an unknown, not yet visible or malformed id. */
export async function getContent(
  { prisma, now }: QueueContext,
  id: string,
): Promise<Content | null> {
  // Postgres fails on a malformed UUID; for the API it is just an unknown item.
  if (!uuid.safeParse(id).success) return null;
  return prisma.content.findUnique({ where: { id, firstReportedAt: { lte: now() } } });
}
