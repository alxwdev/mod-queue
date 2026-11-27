import { randomUUID } from 'node:crypto';
import { testPrisma, truncateAll } from '../../test/db';
import { execute } from '../../test/execute';
import {
  createAction,
  createAuthor,
  createCommunity,
  createContent,
  createModerator,
} from '../../test/factories';

const NOW = new Date('2026-01-10T12:00:00.000Z');
const HOUR_MS = 3_600_000;
const now = () => NOW;

function hoursAgo(hours: number): Date {
  return new Date(NOW.getTime() - hours * HOUR_MS);
}

beforeEach(() => truncateAll());

describe('Query.content', () => {
  const CONTENT = /* GraphQL */ `
    query Content($id: ID!, $reports: Int, $history: Int) {
      content(id: $id) {
        id
        title
        reportCount
        reasonCounts {
          reason
          count
        }
        reports(first: $reports) {
          reason
          note
          createdAt
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
            createdAt
            expiresAt
          }
          history(first: $history) {
            type
            createdAt
          }
        }
      }
    }
  `;

  it('returns the item with its reports, community and author', async () => {
    const moderator = await createModerator();
    const community = await createCommunity({ slug: 'cats' });
    const author = await createAuthor({ username: 'author_kim' });
    const content = await createContent({
      title: 'Cheap watches',
      communityId: community.id,
      authorId: author.id,
      firstReportedAt: hoursAgo(5),
      reports: [
        { reason: 'SPAM', createdAt: hoursAgo(5) },
        { reason: 'OTHER', note: 'newest', createdAt: hoursAgo(1) },
        { reason: 'SPAM', createdAt: hoursAgo(3) },
      ],
    });
    await createAction({
      contentId: content.id,
      moderatorId: moderator.id,
      type: 'BAN',
      createdAt: hoursAgo(2),
      banExpiresAt: new Date(NOW.getTime() + 24 * HOUR_MS),
    });

    const result = await execute(CONTENT, { id: content.id, reports: 2 }, { moderator, now });

    expect(result).toEqual({
      data: {
        content: {
          id: content.id,
          title: 'Cheap watches',
          reportCount: 3,
          reasonCounts: [
            { reason: 'SPAM', count: 2 },
            { reason: 'OTHER', count: 1 },
          ],
          reports: [
            { reason: 'OTHER', note: 'newest', createdAt: '2026-01-10T11:00:00.000Z' },
            { reason: 'SPAM', note: null, createdAt: '2026-01-10T09:00:00.000Z' },
          ],
          community: { slug: 'cats' },
          author: {
            username: 'author_kim',
            stats: { removals: 0, bans: 1 },
            activeBan: {
              createdAt: '2026-01-10T10:00:00.000Z',
              expiresAt: '2026-01-11T12:00:00.000Z',
            },
            history: [{ type: 'BAN', createdAt: '2026-01-10T10:00:00.000Z' }],
          },
        },
      },
    });
  });

  it('returns null for an id that is not a UUID', async () => {
    const moderator = await createModerator();

    const result = await execute(CONTENT, { id: 'not-a-uuid' }, { moderator, now });

    expect(result).toEqual({ data: { content: null } });
  });
});

describe('Author.history', () => {
  const HISTORY = /* GraphQL */ `
    query History($id: ID!, $first: Int) {
      content(id: $id) {
        author {
          history(first: $first) {
            id
          }
        }
      }
    }
  `;

  interface HistoryData {
    content: { author: { history: { id: string }[] } };
  }

  it('lists removals and bans that are not undone, newest first', async () => {
    const moderator = await createModerator();
    const content = await createContent();
    const action = (data: Parameters<typeof createAction>[0]) =>
      createAction({ contentId: content.id, moderatorId: moderator.id, ...data });
    const oldRemoval = await action({ type: 'REMOVE', createdAt: hoursAgo(3) });
    await action({ type: 'APPROVE', createdAt: hoursAgo(2) });
    const ban = await action({ type: 'BAN', createdAt: hoursAgo(1) });
    await action({ type: 'REMOVE', createdAt: hoursAgo(0.5), undoneAt: NOW });

    const result = await execute<HistoryData>(HISTORY, { id: content.id }, { moderator, now });

    expect(result.data?.content.author.history).toEqual([{ id: ban.id }, { id: oldRemoval.id }]);
  });

  it('returns at most 20 actions', async () => {
    const moderator = await createModerator();
    const content = await createContent();
    await testPrisma.modAction.createMany({
      data: Array.from({ length: 21 }, (_, i) => ({
        batchId: randomUUID(),
        type: 'REMOVE' as const,
        createdAt: hoursAgo(i + 1),
        contentId: content.id,
        authorId: content.authorId,
        moderatorId: moderator.id,
      })),
    });

    const result = await execute<HistoryData>(
      HISTORY,
      { id: content.id, first: 50 },
      { moderator, now },
    );

    expect(result.data?.content.author.history).toHaveLength(20);
  });
});

describe('Query.communities', () => {
  it('returns every community ordered by name', async () => {
    const moderator = await createModerator();
    await createCommunity({ slug: 'dogs', name: 'Dogs' });
    await createCommunity({ slug: 'birds', name: 'Birds' });
    await createCommunity({ slug: 'cats', name: 'Cats' });

    const result = await execute('{ communities { slug name } }', {}, { moderator, now });

    expect(result).toEqual({
      data: {
        communities: [
          { slug: 'birds', name: 'Birds' },
          { slug: 'cats', name: 'Cats' },
          { slug: 'dogs', name: 'Dogs' },
        ],
      },
    });
  });
});
