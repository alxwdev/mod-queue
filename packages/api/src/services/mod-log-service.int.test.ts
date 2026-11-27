import { testPrisma, truncateAll } from '../../test/db';
import { execute } from '../../test/execute';
import { createAction, createAuthor, createContent, createModerator } from '../../test/factories';
import type { ModLogFilter } from '../generated/resolvers-types';
import { encodeCursor } from '../lib/cursor';
import { countModLog, getModLogPage } from './mod-log-service';

const NOW = new Date('2026-01-10T12:00:00.000Z');
const HOUR_MS = 3_600_000;
const now = () => NOW;
const ctx = { prisma: testPrisma };

function hoursAgo(hours: number): Date {
  return new Date(NOW.getTime() - hours * HOUR_MS);
}

/** A fixed UUID per number, so that ties on createdAt have a known id order. */
function actionId(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

async function pageIds(filter: ModLogFilter): Promise<string[]> {
  const page = await getModLogPage(ctx, { first: 100, filter });
  return page.edges.map(({ node }) => node.id);
}

beforeEach(() => truncateAll());

describe('getModLogPage', () => {
  // Newest first: 4, 3, 2, 5, 1. Actions 2, 3 and 4 share createdAt, so only the id breaks
  // the ties at the page borders.
  async function createOrderFixture(): Promise<void> {
    const actions = [
      { n: 1, hours: 10 },
      { n: 2, hours: 5 },
      { n: 3, hours: 5 },
      { n: 4, hours: 5 },
      { n: 5, hours: 8 },
    ];
    for (const { n, hours } of actions) {
      await createAction({ id: actionId(n), createdAt: hoursAgo(hours) });
    }
  }

  it('lists the newest action first', async () => {
    await createOrderFixture();

    expect(await pageIds({})).toEqual([4, 3, 2, 5, 1].map(actionId));
  });

  it('walks three pages that equal one big query', async () => {
    await createOrderFixture();

    const pages: string[][] = [];
    let after: string | null = null;
    do {
      const page = await getModLogPage(ctx, { first: 2, after });
      pages.push(page.edges.map(({ node }) => node.id));
      after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
    } while (after);
    // A page size of exactly the five actions: a full last page has no next page.
    const all = await getModLogPage(ctx, { first: 5 });

    expect(pages).toEqual([[4, 3], [2, 5], [1]].map((page) => page.map(actionId)));
    expect(all.edges.map(({ node }) => node.id)).toEqual(pages.flat());
    expect(all.pageInfo).toEqual({ hasNextPage: false, endCursor: all.edges.at(-1)?.cursor });
  });

  it('clamps first to 1..100', async () => {
    await createOrderFixture();

    const page = await getModLogPage(ctx, { first: 0 });

    expect(page.edges.map(({ node }) => node.id)).toEqual([actionId(4)]);
    expect(page.pageInfo.hasNextPage).toBe(true);
  });

  it('lists an undone action with its undoneAt', async () => {
    const undoneAt = hoursAgo(1);
    await createAction({ id: actionId(1), undoneAt });

    const page = await getModLogPage(ctx, { first: 50 });

    expect(page.edges.map(({ node }) => node)).toMatchObject([{ id: actionId(1), undoneAt }]);
  });
});

describe('mod log filters', () => {
  // Newest first: 1, 2, 3, 4.
  async function createFilterFixture(): Promise<void> {
    const aurora = await createModerator({ username: 'aurora' });
    const boris = await createModerator({ username: 'boris' });
    const cleo = await createModerator({ username: 'cleo' });
    const actions = [
      { n: 1, type: 'APPROVE', moderatorId: aurora.id, at: hoursAgo(1) },
      { n: 2, type: 'REMOVE', moderatorId: boris.id, at: hoursAgo(2) },
      { n: 3, type: 'BAN', moderatorId: cleo.id, at: hoursAgo(3) },
      { n: 4, type: 'REMOVE', moderatorId: aurora.id, at: hoursAgo(4) },
    ] as const;
    for (const { n, type, moderatorId, at } of actions) {
      await createAction({ id: actionId(n), type, moderatorId, createdAt: at });
    }
  }

  it.each<[string, ModLogFilter, number[]]>([
    ['no filter', {}, [1, 2, 3, 4]],
    ['empty lists', { types: [], moderatorUsernames: [] }, [1, 2, 3, 4]],
    ['one type', { types: ['REMOVE'] }, [2, 4]],
    ['several types', { types: ['APPROVE', 'BAN'] }, [1, 3]],
    ['one moderator', { moderatorUsernames: ['aurora'] }, [1, 4]],
    ['several moderators', { moderatorUsernames: ['boris', 'cleo'] }, [2, 3]],
    ['an unknown moderator', { moderatorUsernames: ['nobody'] }, []],
    ['from, inclusive', { from: hoursAgo(3) }, [1, 2, 3]],
    ['to, exclusive', { to: hoursAgo(2) }, [3, 4]],
    ['from and to', { from: hoursAgo(3), to: hoursAgo(1) }, [2, 3]],
    ['type and moderator', { types: ['REMOVE'], moderatorUsernames: ['aurora'] }, [4]],
  ])('%s', async (_name, filter, expected) => {
    await createFilterFixture();

    expect(await pageIds(filter)).toEqual(expected.map(actionId));
    expect(await countModLog(ctx, filter)).toBe(expected.length);
  });
});

describe('mod log search', () => {
  async function createSearchFixture(): Promise<void> {
    const byTitle = await createContent({ title: 'Cheap WATCHES here', body: 'Plain body' });
    const byBody = await createContent({ title: 'Plain title', body: 'Buy my watches now' });
    const comment = await createContent({ type: 'COMMENT', title: null, body: 'No match' });
    const byAuthor = await createContent({
      authorId: (await createAuthor({ username: 'WatchFan_99' })).id,
      title: 'Plain title',
      body: 'Plain body',
    });
    await createAction({ id: actionId(1), contentId: byTitle.id, createdAt: hoursAgo(1) });
    await createAction({ id: actionId(2), contentId: byBody.id, createdAt: hoursAgo(2) });
    await createAction({ id: actionId(3), contentId: byAuthor.id, createdAt: hoursAgo(3) });
    await createAction({
      id: actionId(4),
      contentId: comment.id,
      type: 'REMOVE',
      reasonTitle: 'Watch spam',
      createdAt: hoursAgo(4),
    });
    await createAction({ id: actionId(5), contentId: comment.id, createdAt: hoursAgo(5) });
  }

  it.each<[string, string, number[]]>([
    ['title, case-insensitively', 'cheap watches', [1]],
    ['body', 'BUY MY', [2]],
    ['author', 'watchfan', [3]],
    ['reason', 'watch spam', [4]],
    ['all four', 'watch', [1, 2, 3, 4]],
    ['nothing', 'kittens', []],
  ])('matches the %s', async (_name, search, expected) => {
    await createSearchFixture();

    expect(await pageIds({ search })).toEqual(expected.map(actionId));
    expect(await countModLog(ctx, { search })).toBe(expected.length);
  });

  it('trims the search, and a blank search filters nothing', async () => {
    await createSearchFixture();

    expect(await pageIds({ search: '  cheap watches \n' })).toEqual([actionId(1)]);
    expect(await pageIds({ search: '   ' })).toHaveLength(5);
  });

  it('takes %, _ and \\ as plain characters', async () => {
    const titles = ['100% spam', '100 spam', 'low_effort', 'low-effort', 'C:\\temp', 'C:temp'];
    for (const [n, reasonTitle] of titles.entries()) {
      await createAction({ id: actionId(n), reasonTitle });
    }

    expect(await pageIds({ search: '100%' })).toEqual([actionId(0)]);
    expect(await pageIds({ search: 'low_' })).toEqual([actionId(2)]);
    expect(await pageIds({ search: 'C:\\t' })).toEqual([actionId(4)]);
  });

  it('accepts 100 characters after trimming and rejects 101', async () => {
    await createAction({ reasonTitle: 'a'.repeat(100) });

    expect(await countModLog(ctx, { search: ` ${'a'.repeat(100)} ` })).toBe(1);
    await expect(
      getModLogPage(ctx, { first: 50, filter: { search: 'a'.repeat(101) } }),
    ).rejects.toMatchObject({
      extensions: {
        code: 'BAD_USER_INPUT',
        fieldErrors: { 'filter.search': [expect.any(String)] },
      },
    });
  });
});

describe('Query.modLog', () => {
  const MOD_LOG = /* GraphQL */ `
    query ModLog($first: Int, $after: String, $filter: ModLogFilter) {
      modLog(first: $first, after: $after, filter: $filter) {
        edges {
          cursor
          node {
            id
            type
            undoneAt
            moderator {
              username
            }
            content {
              id
              title
            }
            author {
              username
            }
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

  interface ModLogData {
    modLog: {
      edges: {
        cursor: string;
        node: {
          id: string;
          type: string;
          undoneAt: string | null;
          moderator: { username: string };
          content: { id: string; title: string | null };
          author: { username: string };
        };
      }[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      totalCount: number;
    };
  }

  async function runModLog(variables: Record<string, unknown>) {
    const moderator = await createModerator();
    return execute<ModLogData>(MOD_LOG, variables, { moderator, now });
  }

  it('resolves the moderator, the content and the target author of an action', async () => {
    const moderator = await createModerator({ username: 'aurora' });
    const content = await createContent({ title: 'Spam post' });
    const target = await createAuthor({ username: 'spammer' });
    const undoneAt = hoursAgo(1);
    await createAction({
      id: actionId(1),
      type: 'BAN',
      moderatorId: moderator.id,
      contentId: content.id,
      authorId: target.id,
      undoneAt,
    });

    const result = await runModLog({});

    expect(result.errors).toBeUndefined();
    expect(result.data?.modLog.edges.map(({ node }) => node)).toEqual([
      {
        id: actionId(1),
        type: 'BAN',
        undoneAt: undoneAt.toISOString(),
        moderator: { username: 'aurora' },
        content: { id: content.id, title: 'Spam post' },
        author: { username: 'spammer' },
      },
    ]);
  });

  it('counts the whole filtered log in totalCount, also on a later page', async () => {
    for (const type of ['REMOVE', 'APPROVE', 'REMOVE', 'REMOVE'] as const) {
      await createAction({ type });
    }
    const filter = { types: ['REMOVE'] };

    const first = await runModLog({ first: 2, filter });
    const second = await runModLog({
      first: 2,
      filter,
      after: first.data?.modLog.pageInfo.endCursor,
    });

    expect(first.data?.modLog.totalCount).toBe(3);
    expect(second.data?.modLog.edges).toHaveLength(1);
    expect(second.data?.modLog.totalCount).toBe(3);
  });

  it.each([
    ['not base64url', 'not a cursor'],
    ['with a value of the wrong type', encodeCursor(['yesterday', actionId(1)])],
    ['with an id that is not a UUID', encodeCursor(['2026-01-01T00:00:00.000Z', '1'])],
    ['of the wrong length', encodeCursor([3, '2026-01-01T00:00:00.000Z', actionId(1)])],
  ])('rejects a cursor %s with BAD_USER_INPUT', async (_name, after) => {
    const result = await runModLog({ after });

    expect(result.data).toBeNull();
    expect(result.errors?.[0]?.extensions).toMatchObject({
      code: 'BAD_USER_INPUT',
      fieldErrors: { after: [expect.any(String)] },
    });
  });

  it('rejects a search over 100 characters with BAD_USER_INPUT', async () => {
    const result = await runModLog({ filter: { search: 'a'.repeat(101) } });

    expect(result.data).toBeNull();
    expect(result.errors?.[0]?.extensions).toMatchObject({
      code: 'BAD_USER_INPUT',
      fieldErrors: { 'filter.search': [expect.any(String)] },
    });
  });

  it('resolves the fields of the actions in Author.history', async () => {
    const moderator = await createModerator({ username: 'aurora' });
    const content = await createContent();
    await createAction({ type: 'REMOVE', moderatorId: moderator.id, contentId: content.id });

    const result = await execute<{
      content: {
        author: { history: { moderator: { username: string }; content: { id: string } }[] };
      };
    }>(
      /* GraphQL */ `
        query History($id: ID!) {
          content(id: $id) {
            author {
              history {
                moderator {
                  username
                }
                content {
                  id
                }
              }
            }
          }
        }
      `,
      { id: content.id },
      { moderator, now },
    );

    expect(result.errors).toBeUndefined();
    expect(result.data?.content.author.history).toEqual([
      { moderator: { username: 'aurora' }, content: { id: content.id } },
    ]);
  });
});
