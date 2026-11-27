import { testPrisma, truncateAll } from '../../test/db';
import { execute } from '../../test/execute';
import { createAction, createContent, createModerator } from '../../test/factories';
import type { ReportReason } from '../generated/prisma/enums';
import {
  getMedianTimeToAction,
  getQueueSummary,
  getReportsPerHour,
  getTopReasons,
} from './health-service';

// Half past the hour, so the current hour and the current day are not complete.
const NOW = new Date('2026-01-10T12:30:00.000Z');
const MINUTE_MS = 60_000;
const now = () => NOW;
const ctx = { prisma: testPrisma, now };

function minutesAgo(minutes: number): Date {
  return new Date(NOW.getTime() - minutes * MINUTE_MS);
}

function hoursAgo(hours: number): Date {
  return minutesAgo(hours * 60);
}

/** Creates an action at `actedAt`, `minutes` after the first report of its content. */
async function createTimedAction(
  actedAt: Date,
  minutes: number,
  undoneAt: Date | null = null,
): Promise<void> {
  const content = await createContent({
    status: 'APPROVED',
    firstReportedAt: new Date(actedAt.getTime() - minutes * MINUTE_MS),
  });
  await createAction({ contentId: content.id, createdAt: actedAt, undoneAt });
}

/** Creates one content with one report per reason, all at `createdAt`. */
async function createReports(createdAt: Date, reasons: ReportReason[] = ['SPAM']): Promise<void> {
  await createContent({
    firstReportedAt: createdAt,
    reports: reasons.map((reason) => ({ reason, createdAt })),
  });
}

beforeEach(() => truncateAll());

describe('getQueueSummary', () => {
  it('counts only the visible pending items', async () => {
    await createContent({ firstReportedAt: hoursAgo(30) });
    await createContent({ firstReportedAt: NOW });
    await createContent({ status: 'REMOVED', firstReportedAt: hoursAgo(2) });
    await createContent({ firstReportedAt: minutesAgo(-1) });

    expect((await getQueueSummary(ctx)).pendingCount).toBe(2);
  });

  it('counts the reports from 24 hours ago up to now', async () => {
    await createReports(hoursAgo(24));
    await createReports(NOW, ['SPAM', 'OTHER']);
    await createReports(minutesAgo(24 * 60 + 1));
    // A report after the clock: its item is not visible yet.
    await createReports(minutesAgo(-1));

    expect((await getQueueSummary(ctx)).reportsLast24h).toBe(3);
  });

  it('counts the non-undone actions of the last 24 hours and their median minutes', async () => {
    // An even set: 10, 20, 30, 40.
    await createTimedAction(hoursAgo(1), 30);
    await createTimedAction(hoursAgo(24), 10);
    await createTimedAction(hoursAgo(3), 20);
    await createTimedAction(NOW, 40);
    await createTimedAction(minutesAgo(24 * 60 + 1), 1000);
    await createTimedAction(hoursAgo(2), 1000, hoursAgo(1));
    await createTimedAction(minutesAgo(-1), 1000);

    const summary = await getQueueSummary(ctx);

    expect(summary.handledLast24h).toBe(4);
    expect(summary.medianMinutesLast24h).toBe(25);
  });

  it('gives zeros and a null median without data', async () => {
    expect(await getQueueSummary(ctx)).toEqual({
      pendingCount: 0,
      reportsLast24h: 0,
      handledLast24h: 0,
      medianMinutesLast24h: null,
    });
  });
});

describe('getReportsPerHour', () => {
  it('gives one zero-filled UTC bucket per hour, ending with the current hour', async () => {
    await createReports(new Date('2026-01-10T09:59:59.999Z'));
    await createReports(new Date('2026-01-10T10:00:00.000Z'), ['SPAM', 'OTHER']);
    await createReports(new Date('2026-01-10T12:00:00.000Z'));
    await createReports(NOW);
    // After the clock, in the current hour.
    await createReports(minutesAgo(-1));

    expect(await getReportsPerHour(ctx, 4)).toEqual([
      { hour: new Date('2026-01-10T09:00:00.000Z'), count: 1 },
      { hour: new Date('2026-01-10T10:00:00.000Z'), count: 2 },
      { hour: new Date('2026-01-10T11:00:00.000Z'), count: 0 },
      { hour: new Date('2026-01-10T12:00:00.000Z'), count: 2 },
    ]);
  });

  it('does not count reports before the first bucket', async () => {
    await createReports(new Date('2026-01-10T10:59:59.999Z'));

    expect(await getReportsPerHour(ctx, 2)).toEqual([
      { hour: new Date('2026-01-10T11:00:00.000Z'), count: 0 },
      { hour: new Date('2026-01-10T12:00:00.000Z'), count: 0 },
    ]);
  });

  it('clamps hours to 1..168', async () => {
    const most = await getReportsPerHour(ctx, 500);
    const least = await getReportsPerHour(ctx, 0);

    expect(most).toHaveLength(168);
    expect(most[0]?.hour).toEqual(new Date('2026-01-03T13:00:00.000Z'));
    expect(least).toEqual([{ hour: new Date('2026-01-10T12:00:00.000Z'), count: 0 }]);
  });
});

describe('getMedianTimeToAction', () => {
  it('gives the median per UTC day for odd and even sets, null for a day without actions', async () => {
    // 2026-01-08: 10, 20, 60 (odd). 2026-01-10: 10, 20, 30, 100 (even).
    await createTimedAction(new Date('2026-01-08T00:00:00.000Z'), 10);
    await createTimedAction(new Date('2026-01-08T12:00:00.000Z'), 60);
    await createTimedAction(new Date('2026-01-08T23:59:59.999Z'), 20);
    await createTimedAction(new Date('2026-01-10T00:00:00.000Z'), 100);
    await createTimedAction(new Date('2026-01-10T01:00:00.000Z'), 10);
    await createTimedAction(new Date('2026-01-10T02:00:00.000Z'), 30);
    await createTimedAction(NOW, 20);

    expect(await getMedianTimeToAction(ctx, 3)).toEqual([
      { day: new Date('2026-01-08T00:00:00.000Z'), medianMinutes: 20 },
      { day: new Date('2026-01-09T00:00:00.000Z'), medianMinutes: null },
      { day: new Date('2026-01-10T00:00:00.000Z'), medianMinutes: 25 },
    ]);
  });

  it('excludes undone actions, actions after the clock and actions before the first day', async () => {
    await createTimedAction(hoursAgo(1), 10);
    await createTimedAction(hoursAgo(2), 1000, hoursAgo(1));
    await createTimedAction(minutesAgo(-1), 1000);
    await createTimedAction(new Date('2026-01-09T23:59:59.999Z'), 1000);

    expect(await getMedianTimeToAction(ctx, 1)).toEqual([
      { day: new Date('2026-01-10T00:00:00.000Z'), medianMinutes: 10 },
    ]);
  });

  it('clamps days to 1..30', async () => {
    const most = await getMedianTimeToAction(ctx, 31);
    const least = await getMedianTimeToAction(ctx, 0);

    expect(most).toHaveLength(30);
    expect(most[0]?.day).toEqual(new Date('2025-12-12T00:00:00.000Z'));
    expect(least).toEqual([{ day: new Date('2026-01-10T00:00:00.000Z'), medianMinutes: null }]);
  });
});

describe('getTopReasons', () => {
  it('orders the reasons by count, equal counts in enum order, and applies the limit', async () => {
    await createReports(hoursAgo(1), ['OTHER', 'OFF_TOPIC', 'LOW_EFFORT', 'SPAM']);
    await createReports(hoursAgo(2), ['OFF_TOPIC', 'OTHER', 'LOW_EFFORT']);
    await createReports(hoursAgo(3), ['OFF_TOPIC']);

    expect(await getTopReasons(ctx, 14, 3)).toEqual([
      { reason: 'OFF_TOPIC', count: 3 },
      { reason: 'LOW_EFFORT', count: 2 },
      { reason: 'OTHER', count: 2 },
    ]);
  });

  it('counts the reports of the same UTC days as the median chart, up to now', async () => {
    await createReports(new Date('2026-01-09T00:00:00.000Z'), ['SPAM']);
    await createReports(NOW, ['SPAM']);
    await createReports(new Date('2026-01-08T23:59:59.999Z'), ['OTHER']);
    await createReports(minutesAgo(-1), ['OTHER']);

    expect(await getTopReasons(ctx, 2, 6)).toEqual([{ reason: 'SPAM', count: 2 }]);
  });

  it('clamps days to 1..30 and limit to 1..10', async () => {
    await createReports(new Date('2025-12-12T00:00:00.000Z'), ['SPAM', 'SPAM']);
    await createReports(new Date('2025-12-11T23:59:59.999Z'), ['OTHER', 'OTHER', 'OTHER']);
    await createReports(hoursAgo(1), ['RULE_BREAK']);

    expect(await getTopReasons(ctx, 31, 50)).toEqual([
      { reason: 'SPAM', count: 2 },
      { reason: 'RULE_BREAK', count: 1 },
    ]);
    expect(await getTopReasons(ctx, 31, 0)).toEqual([{ reason: 'SPAM', count: 2 }]);
  });
});

describe('Query.queueHealth', () => {
  const QUEUE_HEALTH = /* GraphQL */ `
    query QueueHealth {
      queueHealth {
        summary {
          pendingCount
          reportsLast24h
          handledLast24h
          medianMinutesLast24h
        }
        reportsPerHour {
          hour
          count
        }
        medianTimeToAction {
          day
          medianMinutes
        }
        topReasons {
          reason
          count
        }
      }
    }
  `;

  interface QueueHealthData {
    queueHealth: {
      summary: Record<string, number | null>;
      reportsPerHour: { hour: string; count: number }[];
      medianTimeToAction: { day: string; medianMinutes: number | null }[];
      topReasons: { reason: string; count: number }[];
    };
  }

  it('answers with the default sizes', async () => {
    const moderator = await createModerator();
    await createReports(hoursAgo(1), ['SPAM', 'OTHER', 'OTHER']);
    await createTimedAction(hoursAgo(1), 15);

    const result = await execute<QueueHealthData>(QUEUE_HEALTH, {}, { moderator, now });

    expect(result.errors).toBeUndefined();
    const health = result.data?.queueHealth;
    expect(health?.summary).toEqual({
      pendingCount: 1,
      reportsLast24h: 4,
      handledLast24h: 1,
      medianMinutesLast24h: 15,
    });
    expect(health?.reportsPerHour).toHaveLength(48);
    expect(health?.reportsPerHour.at(-1)).toEqual({ hour: '2026-01-10T12:00:00.000Z', count: 0 });
    expect(health?.reportsPerHour.at(-2)).toEqual({ hour: '2026-01-10T11:00:00.000Z', count: 4 });
    expect(health?.medianTimeToAction).toHaveLength(14);
    expect(health?.medianTimeToAction.at(-1)).toEqual({
      day: '2026-01-10T00:00:00.000Z',
      medianMinutes: 15,
    });
    expect(health?.topReasons).toEqual([
      { reason: 'SPAM', count: 2 },
      { reason: 'OTHER', count: 2 },
    ]);
  });
});
