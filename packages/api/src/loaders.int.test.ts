import { randomUUID } from 'node:crypto';
import { testPrisma, truncateAll } from '../test/db';
import {
  createAction,
  createAuthor,
  createCommunity,
  createContent,
  createModerator,
} from '../test/factories';
import { createLoaders } from './loaders';

const NOW = new Date('2026-01-10T00:00:00.000Z');
const HOUR_MS = 3_600_000;

function hoursFromNow(hours: number): Date {
  return new Date(NOW.getTime() + hours * HOUR_MS);
}

function loaders() {
  return createLoaders(testPrisma, () => NOW);
}

beforeEach(() => truncateAll());

describe('row loaders', () => {
  it('return the rows in the order of the keys', async () => {
    const [first, second] = [await createAuthor(), await createAuthor()];
    const [community, moderator] = [await createCommunity(), await createModerator()];
    const { authors, communities, moderators } = loaders();

    expect(await authors.loadMany([second.id, first.id])).toEqual([second, first]);
    expect(await communities.load(community.id)).toEqual(community);
    expect(await moderators.load(moderator.id)).toEqual(moderator);
  });

  it('reject an id without a row', async () => {
    const id = randomUUID();

    await expect(loaders().authors.load(id)).rejects.toThrow(`Author ${id} does not exist.`);
  });
});

describe('reasonCounts', () => {
  it('counts the reports per reason, count descending and ties in enum order', async () => {
    const content = await createContent({
      reports: [
        { reason: 'OTHER' },
        { reason: 'SPAM' },
        { reason: 'OFF_TOPIC' },
        { reason: 'SPAM' },
        { reason: 'SPAM' },
      ],
    });
    const other = await createContent({ reports: [{ reason: 'MISLEADING' }] });

    expect(await loaders().reasonCounts.loadMany([content.id, other.id])).toEqual([
      [
        { reason: 'SPAM', count: 3 },
        { reason: 'OFF_TOPIC', count: 1 },
        { reason: 'OTHER', count: 1 },
      ],
      [{ reason: 'MISLEADING', count: 1 }],
    ]);
  });
});

describe('authorStats', () => {
  it('counts removals per item and bans per batch, without undone actions', async () => {
    const author = await createAuthor();
    const authorId = author.id;
    const removeBatch = randomUUID();
    const banBatch = randomUUID();
    await createAction({ authorId, type: 'REMOVE', batchId: removeBatch });
    await createAction({ authorId, type: 'REMOVE', batchId: removeBatch });
    await createAction({ authorId, type: 'REMOVE', undoneAt: NOW });
    await createAction({ authorId, type: 'BAN', batchId: banBatch });
    await createAction({ authorId, type: 'BAN', batchId: banBatch });
    await createAction({ authorId, type: 'BAN' });
    await createAction({ authorId, type: 'BAN', undoneAt: NOW });
    await createAction({ authorId, type: 'APPROVE' });
    const clean = await createAuthor();

    expect(await loaders().authorStats.loadMany([authorId, clean.id])).toEqual([
      { removals: 2, bans: 2 },
      { removals: 0, bans: 0 },
    ]);
  });
});

describe('activeBans', () => {
  it('returns the latest ban that is permanent or not expired yet', async () => {
    const author = await createAuthor();
    const authorId = author.id;
    await createAction({ authorId, type: 'BAN', createdAt: hoursFromNow(-48), banExpiresAt: null });
    await createAction({
      authorId,
      type: 'BAN',
      createdAt: hoursFromNow(-30),
      banExpiresAt: hoursFromNow(24),
    });
    // Newer, but expired or undone: neither replaces the active ban above.
    await createAction({
      authorId,
      type: 'BAN',
      createdAt: hoursFromNow(-26),
      banExpiresAt: hoursFromNow(-2),
    });
    await createAction({ authorId, type: 'BAN', createdAt: hoursFromNow(-1), undoneAt: NOW });

    expect(await loaders().activeBans.load(authorId)).toEqual({
      createdAt: hoursFromNow(-30),
      expiresAt: hoursFromNow(24),
    });
  });

  it('returns null for an expired, an undone and a missing ban', async () => {
    const [expired, undone, never] = [
      await createAuthor(),
      await createAuthor(),
      await createAuthor(),
    ];
    await createAction({ authorId: expired.id, type: 'BAN', banExpiresAt: NOW });
    await createAction({ authorId: undone.id, type: 'BAN', banExpiresAt: null, undoneAt: NOW });

    expect(await loaders().activeBans.loadMany([expired.id, undone.id, never.id])).toEqual([
      null,
      null,
      null,
    ]);
  });
});
