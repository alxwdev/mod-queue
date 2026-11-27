import * as z from 'zod';
import type { GraphQLContext } from '../context';
import { userInputError } from '../errors';
import type { ModAction, Prisma } from '../generated/prisma/client';
import type { ModLogFilter } from '../generated/resolvers-types';
import { clampFirst, decodeCursor, encodeCursor } from '../lib/cursor';
import { parseTimeAndId } from '../lib/keyset';

/** Most actions of one mod log page. */
const MAX_PAGE_SIZE = 100;
const MAX_SEARCH_LENGTH = 100;

const ORDER_BY: Prisma.ModActionOrderByWithRelationInput[] = [
  { createdAt: 'desc' },
  { id: 'desc' },
];

const searchSchema = z
  .string()
  .trim()
  .max(MAX_SEARCH_LENGTH, `Shorten the search to ${MAX_SEARCH_LENGTH} characters or fewer.`);

export type ModLogContext = Pick<GraphQLContext, 'prisma'>;

export interface ModLogPageArgs {
  first: number;
  after?: string | null;
  filter?: ModLogFilter | null;
}

/** One mod log page: the parent of the GraphQL `ModActionConnection`. */
export interface ModLogConnection {
  edges: { cursor: string; node: ModAction }[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  /** The filter of the page, so that the `totalCount` field counts the same log. */
  filter: ModLogFilter | null | undefined;
}

function parseSearch(search: string | null | undefined): string {
  const result = searchSchema.safeParse(search ?? '');
  if (!result.success) {
    throw userInputError({ 'filter.search': result.error.issues.map(({ message }) => message) });
  }
  return result.data;
}

/**
 * The mod log as a Prisma filter, undone actions included. `from` is inclusive, `to` exclusive.
 * An empty list or a blank search filters nothing; a search over 100 characters throws
 * `BAD_USER_INPUT`.
 */
export function buildModLogWhere(
  filter: ModLogFilter | null | undefined,
): Prisma.ModActionWhereInput {
  const { types, moderatorUsernames, search, from, to }: ModLogFilter = filter ?? {};
  const text = parseSearch(search);
  // Prisma puts the value into an ILIKE pattern as it is, so `%` and `_` would be wildcards.
  // Backslash is the default escape character of Postgres patterns.
  const contains = { contains: text.replace(/[\\%_]/g, '\\$&'), mode: 'insensitive' } as const;
  return {
    // Prisma skips a condition whose value is undefined.
    type: types?.length ? { in: types } : undefined,
    moderator: moderatorUsernames?.length ? { username: { in: moderatorUsernames } } : undefined,
    createdAt: { gte: from ?? undefined, lt: to ?? undefined },
    OR: text
      ? [
          { content: { title: contains } },
          { content: { body: contains } },
          { author: { username: contains } },
          { reasonTitle: contains },
        ]
      : undefined,
  };
}

// The rows after the cursor row in the `ORDER_BY` order.
function afterCursor(after: string): Prisma.ModActionWhereInput {
  const [at, id] = parseTimeAndId(decodeCursor(after, ORDER_BY.length));
  return { OR: [{ createdAt: { lt: at } }, { createdAt: at, id: { lt: id } }] };
}

/** Returns one page of the mod log, newest first, after the cursor `after`. */
export async function getModLogPage(
  { prisma }: ModLogContext,
  { first, after, filter }: ModLogPageArgs,
): Promise<ModLogConnection> {
  const size = clampFirst(first, MAX_PAGE_SIZE);
  const logWhere = buildModLogWhere(filter);
  const where = after ? { AND: [logWhere, afterCursor(after)] } : logWhere;
  // One row more than the page size tells whether a next page exists.
  const rows = await prisma.modAction.findMany({ where, orderBy: ORDER_BY, take: size + 1 });
  const edges = rows.slice(0, size).map((node) => ({
    cursor: encodeCursor([node.createdAt.toISOString(), node.id]),
    node,
  }));
  return {
    edges,
    pageInfo: { hasNextPage: rows.length > size, endCursor: edges.at(-1)?.cursor ?? null },
    filter,
  };
}

/** Counts the mod log actions that match `filter`. */
export function countModLog(
  { prisma }: ModLogContext,
  filter: ModLogFilter | null | undefined,
): Promise<number> {
  return prisma.modAction.count({ where: buildModLogWhere(filter) });
}
