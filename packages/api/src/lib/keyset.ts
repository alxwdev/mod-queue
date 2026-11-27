import * as z from 'zod';
import type { Content, Prisma } from '../generated/prisma/client';
import type { QueueSort } from '../generated/resolvers-types';
import { invalidCursor, type CursorValue } from './cursor';

type QueueRow = Pick<Content, 'id' | 'firstReportedAt' | 'reportCount'>;

/** The order of a queue sort. The last field is always `id`, so no two rows tie. */
export function queueOrderBy(sort: QueueSort): Prisma.ContentOrderByWithRelationInput[] {
  switch (sort) {
    case 'OLDEST':
      return [{ firstReportedAt: 'asc' }, { id: 'asc' }];
    case 'NEWEST':
      return [{ firstReportedAt: 'desc' }, { id: 'desc' }];
    case 'MOST_REPORTED':
      return [{ reportCount: 'desc' }, { firstReportedAt: 'asc' }, { id: 'asc' }];
  }
}

/** The cursor values of a row: its values of the `queueOrderBy(sort)` fields, in that order. */
export function queueCursorValues(sort: QueueSort, row: QueueRow): CursorValue[] {
  const timeAndId = [row.firstReportedAt.toISOString(), row.id];
  return sort === 'MOST_REPORTED' ? [row.reportCount, ...timeAndId] : timeAndId;
}

const isoDate = z.iso.datetime().transform((value) => new Date(value));
// A malformed UUID would reach Postgres and fail there as an internal error.
const timeAndIdValues = z.tuple([isoDate, z.uuid()]);
const countTimeAndIdValues = z.tuple([z.int(), isoDate, z.uuid()]);

function parseValues<T extends z.ZodType>(schema: T, values: CursorValue[]): z.output<T> {
  const result = schema.safeParse(values);
  if (!result.success) throw invalidCursor();
  return result.data;
}

function afterTimeAndId(ascending: boolean, at: Date, id: string): Prisma.ContentWhereInput {
  return ascending
    ? { OR: [{ firstReportedAt: { gt: at } }, { firstReportedAt: at, id: { gt: id } }] }
    : { OR: [{ firstReportedAt: { lt: at } }, { firstReportedAt: at, id: { lt: id } }] };
}

/**
 * The rows after the cursor row in the `queueOrderBy(sort)` order. The condition uses the values,
 * not the row, so a cursor stays valid when its row changes. Values of the wrong type throw
 * `BAD_USER_INPUT`.
 */
export function queueKeysetWhere(
  sort: QueueSort,
  cursorValues: CursorValue[],
): Prisma.ContentWhereInput {
  if (sort === 'MOST_REPORTED') {
    const [reportCount, at, id] = parseValues(countTimeAndIdValues, cursorValues);
    return {
      OR: [{ reportCount: { lt: reportCount } }, { reportCount, ...afterTimeAndId(true, at, id) }],
    };
  }
  const [at, id] = parseValues(timeAndIdValues, cursorValues);
  return afterTimeAndId(sort === 'OLDEST', at, id);
}
