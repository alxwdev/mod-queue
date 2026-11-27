import type { GraphQLContext } from '../context';
import { Prisma } from '../generated/prisma/client';
import { clampFirst } from '../lib/cursor';
import type { ReasonCount } from '../loaders';
import { countQueue } from './queue-service';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const MAX_HOURS = 168;
const MAX_DAYS = 30;
const MAX_REASONS = 10;

export type HealthContext = Pick<GraphQLContext, 'prisma' | 'now'>;

/** The parent of the GraphQL `QueueHealth`: every field resolves on its own, only when requested. */
export type QueueHealthParent = Record<string, never>;

export interface QueueSummary {
  pendingCount: number;
  reportsLast24h: number;
  handledLast24h: number;
  /** `null` when no action was taken in the last 24 hours. */
  medianMinutesLast24h: number | null;
}

export interface HourlyCount {
  hour: Date;
  count: number;
}

export interface DailyMedian {
  day: Date;
  /** `null` for a day without actions. */
  medianMinutes: number | null;
}

function startOfUtcHour(date: Date): Date {
  return new Date(Math.floor(date.getTime() / HOUR_MS) * HOUR_MS);
}

function startOfUtcDay(date: Date): Date {
  return new Date(Math.floor(date.getTime() / DAY_MS) * DAY_MS);
}

// The first of `days` UTC days that end with the day of `at`.
function firstDay(at: Date, days: number): Date {
  return new Date(startOfUtcDay(at).getTime() - (clampFirst(days, MAX_DAYS) - 1) * DAY_MS);
}

// The columns are `timestamp` without a time zone and hold UTC. The Prisma adapter sends a Date
// as a UTC date-time without a zone, so `::timestamp` keeps it as it is.

// Minutes from the first report of the content to the action.
const MINUTES_TO_ACTION = Prisma.sql`extract(epoch FROM a."createdAt" - c."firstReportedAt") / 60`;

/** Returns the stat tiles: visible pending items, and the reports and actions of the last 24 hours. */
export async function getQueueSummary(ctx: HealthContext): Promise<QueueSummary> {
  const at = ctx.now();
  const since = new Date(at.getTime() - DAY_MS);
  const [pendingCount, [last24h]] = await Promise.all([
    countQueue(ctx, null),
    ctx.prisma.$queryRaw<Omit<QueueSummary, 'pendingCount'>[]>`
      SELECT
        (SELECT count(*)::int FROM "Report"
          WHERE "createdAt" BETWEEN ${since}::timestamp AND ${at}::timestamp) AS "reportsLast24h",
        (SELECT count(*)::int FROM "ModAction"
          WHERE "undoneAt" IS NULL
            AND "createdAt" BETWEEN ${since}::timestamp AND ${at}::timestamp) AS "handledLast24h",
        (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY ${MINUTES_TO_ACTION})::float8
          FROM "ModAction" a JOIN "Content" c ON c.id = a."contentId"
          WHERE a."undoneAt" IS NULL
            AND a."createdAt" BETWEEN ${since}::timestamp AND ${at}::timestamp
        ) AS "medianMinutesLast24h"`,
  ]);
  if (!last24h) throw new Error('The queue summary query returned no row.');
  return { pendingCount, ...last24h };
}

/**
 * Returns the reports per UTC hour, oldest first: `hours` buckets (clamped to 1..168) that end with
 * the current hour, zero-filled. The current hour counts the reports up to now.
 */
export function getReportsPerHour(ctx: HealthContext, hours: number): Promise<HourlyCount[]> {
  const at = ctx.now();
  const lastHour = startOfUtcHour(at);
  const firstHour = new Date(lastHour.getTime() - (clampFirst(hours, MAX_HOURS) - 1) * HOUR_MS);
  return ctx.prisma.$queryRaw<HourlyCount[]>`
    WITH counts AS (
      SELECT date_trunc('hour', "createdAt") AS hour, count(*)::int AS count
      FROM "Report"
      WHERE "createdAt" >= ${firstHour}::timestamp AND "createdAt" <= ${at}::timestamp
      GROUP BY 1
    )
    SELECT s.hour, coalesce(counts.count, 0) AS count
    FROM generate_series(${firstHour}::timestamp, ${lastHour}::timestamp, interval '1 hour') AS s(hour)
    LEFT JOIN counts USING (hour)
    ORDER BY s.hour`;
}

/**
 * Returns the median minutes from the first report to a non-undone action per UTC day, oldest
 * first: `days` days (clamped to 1..30) that end with today; `null` for a day without actions.
 */
export function getMedianTimeToAction(ctx: HealthContext, days: number): Promise<DailyMedian[]> {
  const at = ctx.now();
  const first = firstDay(at, days);
  return ctx.prisma.$queryRaw<DailyMedian[]>`
    WITH medians AS (
      SELECT date_trunc('day', a."createdAt") AS day,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY ${MINUTES_TO_ACTION})::float8 AS "medianMinutes"
      FROM "ModAction" a JOIN "Content" c ON c.id = a."contentId"
      WHERE a."undoneAt" IS NULL
        AND a."createdAt" >= ${first}::timestamp AND a."createdAt" <= ${at}::timestamp
      GROUP BY 1
    )
    SELECT s.day, medians."medianMinutes"
    FROM generate_series(${first}::timestamp, ${startOfUtcDay(at)}::timestamp, interval '1 day')
      AS s(day)
    LEFT JOIN medians USING (day)
    ORDER BY s.day`;
}

/**
 * Returns the most frequent report reasons of the same UTC days as `getMedianTimeToAction`, up to
 * now: at most `limit` (clamped to 1..10), count descending, equal counts in enum order.
 */
export async function getTopReasons(
  ctx: HealthContext,
  days: number,
  limit: number,
): Promise<ReasonCount[]> {
  const at = ctx.now();
  const groups = await ctx.prisma.report.groupBy({
    by: ['reason'],
    where: { createdAt: { gte: firstDay(at, days), lte: at } },
    _count: { _all: true },
    // Postgres orders enum values in the order of their declaration.
    orderBy: [{ _count: { reason: 'desc' } }, { reason: 'asc' }],
    take: clampFirst(limit, MAX_REASONS),
  });
  return groups.map(({ reason, _count }) => ({ reason, count: _count._all }));
}
