import { randomUUID } from 'node:crypto';
import { testPrisma, truncateAll } from '../../test/db';
import { execute } from '../../test/execute';
import {
  createAction,
  createCommunity,
  createContent,
  createModerator,
} from '../../test/factories';
import type { QueueFilter, QueueSort } from '../generated/resolvers-types';
import { encodeCursor } from '../lib/cursor';
import { countQueue, getContent, getQueuePage } from './queue-service';

const NOW = new Date('2026-01-10T12:00:00.000Z');
const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const now = () => NOW;
const ctx = { prisma: testPrisma, now };

function msAgo(ms: number): Date {
  return new Date(NOW.getTime() - ms);
}

function hoursAgo(hours: number): Date {
  return msAgo(hours * HOUR_MS);
}

/** A fixed UUID per number, so that ties on the sort fields have a known id order. */
function itemId(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

function spamReports(count: number) {
  return Array.from({ length: count }, () => ({ reason: 'SPAM' as const }));
}

async function pageIds(filter: QueueFilter): Promise<string[]> {
  const page = await getQueuePage(ctx, { first: 100, filter, sort: 'OLDEST' });
  return page.edges.map(({ node }) => node.id);
}

beforeEach(() => truncateAll());

describe('getQueuePage', () => {
  // Items 2, 3 and 5 share firstReportedAt and reportCount, so that page borders of every
  // sort fall on ties that only the id breaks.
  async function createSortFixture(): Promise<void> {
    const items = [
      { n: 1, hours: 10, reports: 1 },
      { n: 2, hours: 8, reports: 3 },
      { n: 3, hours: 8, reports: 3 },
      { n: 4, hours: 6, reports: 2 },
      { n: 5, hours: 8, reports: 3 },
      { n: 6, hours: 4, reports: 2 },
    ];
    for (const { n, hours, reports } of items) {
      await createContent({
        id: itemId(n),
        firstReportedAt: hoursAgo(hours),
        reports: spamReports(reports),
      });
    }
  }

  async function walkPages(sort: QueueSort): Promise<string[][]> {
    const pages: string[][] = [];
    let after: string | null = null;
    do {
      const page = await getQueuePage(ctx, { first: 2, after, sort });
      pages.push(page.edges.map(({ node }) => node.id));
      after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
    } while (after);
    return pages;
  }

  it.each([
    [
      'OLDEST',
      [
        [1, 2],
        [3, 5],
        [4, 6],
      ],
    ],
    [
      'NEWEST',
      [
        [6, 4],
        [5, 3],
        [2, 1],
      ],
    ],
    [
      'MOST_REPORTED',
      [
        [2, 3],
        [5, 4],
        [6, 1],
      ],
    ],
  ] as const)('walks three %s pages that equal one big query', async (sort, expectedPages) => {
    await createSortFixture();

    const pages = await walkPages(sort);
    const all = await getQueuePage(ctx, { first: 100, sort });

    expect(pages).toEqual(expectedPages.map((page) => page.map(itemId)));
    expect(all.edges.map(({ node }) => node.id)).toEqual(expectedPages.flat().map(itemId));
    expect(all.pageInfo.hasNextPage).toBe(false);
  });

  it('clamps first to 1..100', async () => {
    await createSortFixture();

    const page = await getQueuePage(ctx, { first: 0, sort: 'OLDEST' });

    expect(page.edges.map(({ node }) => node.id)).toEqual([itemId(1)]);
    expect(page.pageInfo.hasNextPage).toBe(true);
  });
});

describe('queue filters', () => {
  // Oldest first: 5, 2, 4, 1, 3.
  async function createFilterFixture(): Promise<void> {
    const cats = await createCommunity({ slug: 'cats' });
    const dogs = await createCommunity({ slug: 'dogs' });
    const birds = await createCommunity({ slug: 'birds' });
    const items = [
      { n: 1, type: 'POST', communityId: cats.id, age: hoursAgo(2), reasons: ['SPAM'] },
      {
        n: 2,
        type: 'COMMENT',
        communityId: cats.id,
        age: hoursAgo(30),
        reasons: ['OFF_TOPIC', 'SPAM'],
      },
      { n: 3, type: 'POST', communityId: dogs.id, age: hoursAgo(0.5), reasons: ['MISLEADING'] },
      { n: 4, type: 'COMMENT', communityId: dogs.id, age: hoursAgo(5), reasons: ['OFF_TOPIC'] },
      { n: 5, type: 'POST', communityId: birds.id, age: hoursAgo(48), reasons: ['OTHER'] },
    ] as const;
    for (const { n, type, communityId, age, reasons } of items) {
      await createContent({
        id: itemId(n),
        type,
        communityId,
        firstReportedAt: age,
        reports: reasons.map((reason) => ({ reason })),
      });
    }
  }

  it.each<[string, QueueFilter, number[]]>([
    ['no filter', {}, [5, 2, 4, 1, 3]],
    ['empty lists', { reasons: [], types: [], communitySlugs: [] }, [5, 2, 4, 1, 3]],
    ['one reason, also when the item has other reports', { reasons: ['SPAM'] }, [2, 1]],
    ['several reasons', { reasons: ['OFF_TOPIC', 'MISLEADING'] }, [2, 4, 3]],
    ['type', { types: ['COMMENT'] }, [2, 4]],
    ['communities', { communitySlugs: ['dogs', 'birds'] }, [5, 4, 3]],
    ['last hour', { age: 'LAST_HOUR' }, [3]],
    ['last 24 hours', { age: 'LAST_24_HOURS' }, [4, 1, 3]],
    ['older than 24 hours', { age: 'OLDER_THAN_24_HOURS' }, [5, 2]],
    ['type and age', { types: ['COMMENT'], age: 'LAST_24_HOURS' }, [4]],
    [
      'all four',
      {
        reasons: ['SPAM', 'OFF_TOPIC'],
        types: ['COMMENT'],
        communitySlugs: ['cats'],
        age: 'OLDER_THAN_24_HOURS',
      },
      [2],
    ],
  ])('%s', async (_name, filter, expected) => {
    await createFilterFixture();

    expect(await pageIds(filter)).toEqual(expected.map(itemId));
    expect(await countQueue(ctx, filter)).toBe(expected.length);
  });

  it('keep only pending items', async () => {
    await createContent({ id: itemId(1), status: 'APPROVED' });
    await createContent({ id: itemId(2), status: 'REMOVED' });
    await createContent({ id: itemId(3) });

    expect(await pageIds({})).toEqual([itemId(3)]);
  });

  it('apply the age boundaries of the clock', async () => {
    const items = [
      { n: 1, at: msAgo(24 * HOUR_MS + 1) },
      { n: 2, at: msAgo(24 * HOUR_MS) },
      { n: 3, at: msAgo(HOUR_MS + 1) },
      { n: 4, at: msAgo(HOUR_MS) },
      { n: 5, at: NOW },
    ];
    for (const { n, at } of items) await createContent({ id: itemId(n), firstReportedAt: at });

    expect(await pageIds({ age: 'LAST_HOUR' })).toEqual([4, 5].map(itemId));
    expect(await pageIds({ age: 'LAST_24_HOURS' })).toEqual([2, 3, 4, 5].map(itemId));
    expect(await pageIds({ age: 'OLDER_THAN_24_HOURS' })).toEqual([itemId(1)]);
  });
});

describe('Query.queue', () => {
  const QUEUE = /* GraphQL */ `
    query Queue($first: Int, $after: String, $filter: QueueFilter, $sort: QueueSort) {
      queue(first: $first, after: $after, filter: $filter, sort: $sort) {
        edges {
          cursor
          node {
            id
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
      }
    }
  `;

  interface QueueData {
    queue: {
      edges: { cursor: string; node: { id: string } }[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      totalCount: number;
    };
  }

  async function runQueue(variables: Record<string, unknown>, clock = now) {
    const moderator = await createModerator();
    return execute<QueueData>(QUEUE, variables, { moderator, now: clock });
  }

  it('lists the oldest item first by default', async () => {
    await createContent({ id: itemId(1), firstReportedAt: hoursAgo(1) });
    await createContent({ id: itemId(2), firstReportedAt: hoursAgo(3) });
    await createContent({ id: itemId(3), firstReportedAt: hoursAgo(2) });

    const result = await runQueue({});

    expect(result.data?.queue.edges.map(({ node }) => node.id)).toEqual([2, 3, 1].map(itemId));
  });

  it('counts the whole filtered queue in totalCount, also on a later page', async () => {
    await createContent({ type: 'POST' });
    await createContent({ type: 'POST', status: 'APPROVED' });
    await createContent({ type: 'COMMENT' });
    await createContent({ type: 'POST' });
    await createContent({ type: 'POST' });
    const filter = { types: ['POST'] };

    const first = await runQueue({ first: 2, filter });
    const second = await runQueue({
      first: 2,
      filter,
      after: first.data?.queue.pageInfo.endCursor,
    });

    expect(first.data?.queue.totalCount).toBe(3);
    expect(second.data?.queue.edges).toHaveLength(1);
    expect(second.data?.queue.totalCount).toBe(3);
  });

  it.each([
    ['not base64url', { after: 'not a cursor' }],
    [
      'of another sort',
      { after: encodeCursor(['2026-01-01T00:00:00.000Z', itemId(1)]), sort: 'MOST_REPORTED' },
    ],
    ['with a value of the wrong type', { after: encodeCursor(['yesterday', itemId(1)]) }],
    ['with an id that is not a UUID', { after: encodeCursor(['2026-01-01T00:00:00.000Z', '1']) }],
  ])('rejects a cursor %s with BAD_USER_INPUT', async (_name, variables) => {
    const result = await runQueue(variables);

    expect(result.data).toBeNull();
    expect(result.errors?.[0]?.extensions).toMatchObject({
      code: 'BAD_USER_INPUT',
      fieldErrors: { after: [expect.any(String)] },
    });
  });

  it('hides an item until the clock reaches its firstReportedAt', async () => {
    const visible = await createContent({ firstReportedAt: hoursAgo(1) });
    const future = await createContent({ firstReportedAt: new Date(NOW.getTime() + MINUTE_MS) });
    const later = () => new Date(NOW.getTime() + MINUTE_MS);

    const before = await runQueue({});
    const after = await runQueue({}, later);

    expect(before.data?.queue.edges.map(({ node }) => node.id)).toEqual([visible.id]);
    expect(before.data?.queue.totalCount).toBe(1);
    expect(await getContent(ctx, future.id)).toBeNull();
    expect(after.data?.queue.edges.map(({ node }) => node.id)).toEqual([visible.id, future.id]);
    expect(after.data?.queue.totalCount).toBe(2);
    expect(await getContent({ prisma: testPrisma, now: later }, future.id)).toMatchObject({
      id: future.id,
    });
  });

  it('runs at most 6 SQL queries for a page of 50 with every batched nested field', async () => {
    const moderator = await createModerator();
    for (let i = 0; i < 50; i += 1) {
      const content = await createContent({
        firstReportedAt: msAgo(i * MINUTE_MS),
        reports: [{ reason: 'SPAM' }, { reason: 'OTHER' }],
      });
      // Every author has a removal and an active ban, so the author loaders return rows.
      await createAction({ contentId: content.id, moderatorId: moderator.id, type: 'REMOVE' });
      await createAction({ contentId: content.id, moderatorId: moderator.id, type: 'BAN' });
    }
    let queries = 0;
    testPrisma.$on('query', () => {
      queries += 1;
    });

    const result = await execute<{ queue: { edges: unknown[] } }>(
      /* GraphQL */ `
        {
          queue(first: 50) {
            edges {
              cursor
              node {
                id
                reasonCounts {
                  reason
                  count
                }
                community {
                  slug
                }
                author {
                  username
                  stats {
                    removals
                    bans
                  }
                  activeBan {
                    expiresAt
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `,
      {},
      { moderator, now },
    );

    expect(result.errors).toBeUndefined();
    expect(result.data?.queue.edges).toHaveLength(50);
    expect(queries).toBeLessThanOrEqual(6);
  });
});

describe('getContent', () => {
  it('returns a visible item of any status', async () => {
    const content = await createContent({ status: 'REMOVED', firstReportedAt: NOW });

    expect(await getContent(ctx, content.id)).toMatchObject({ id: content.id });
  });

  it('returns null for an unknown id and for an id that is not a UUID', async () => {
    expect(await getContent(ctx, randomUUID())).toBeNull();
    expect(await getContent(ctx, 'not-a-uuid')).toBeNull();
  });
});
