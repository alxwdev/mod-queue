import { randomUUID } from 'node:crypto';
import { MAX_BULK_IDS, UNDO_WINDOW_MS } from '@modqueue/shared';
import { testPrisma, truncateAll } from '../../test/db';
import { execute } from '../../test/execute';
import {
  createAction,
  createAuthor,
  createCommunity,
  createContent,
  createModerator,
  createReason,
} from '../../test/factories';
import type { Moderator } from '../generated/prisma/client';
import type { Clock } from '../lib/clock';
import { createLoaders } from '../loaders';
import { moderate, undo } from './moderation-service';

const NOW = new Date('2026-01-10T12:00:00.000Z');
const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;
const now = () => NOW;

function after(ms: number): Clock {
  return () => new Date(NOW.getTime() + ms);
}

let moderator: Moderator;

beforeEach(async () => {
  await truncateAll();
  moderator = await createModerator();
});

function ctx(actor: Moderator = moderator, clock: Clock = now) {
  return { prisma: testPrisma, moderator: actor, now: clock };
}

async function createContentIds(count: number): Promise<string[]> {
  const community = await createCommunity();
  const author = await createAuthor();
  const ids: string[] = [];
  for (let n = 0; n < count; n += 1) {
    ids.push((await createContent({ communityId: community.id, authorId: author.id })).id);
  }
  return ids;
}

function statusOf(id: string) {
  return testPrisma.content.findUniqueOrThrow({ where: { id } }).then(({ status }) => status);
}

function activeBanOf(authorId: string) {
  return createLoaders(testPrisma, now).activeBans.load(authorId);
}

describe('moderate', () => {
  it('approves one item', async () => {
    const content = await createContent();

    const result = await moderate(ctx(), { type: 'APPROVE' }, [content.id]);

    expect(result.batchId).toEqual(expect.any(String));
    expect(result.results).toMatchObject([
      {
        contentId: content.id,
        outcome: 'APPLIED',
        handledBy: null,
        content: { id: content.id, status: 'APPROVED' },
      },
    ]);
    expect(await testPrisma.modAction.findMany()).toEqual([
      expect.objectContaining({
        batchId: result.batchId,
        type: 'APPROVE',
        createdAt: NOW,
        undoneAt: null,
        contentId: content.id,
        authorId: content.authorId,
        moderatorId: moderator.id,
        removalReasonId: null,
        reasonTitle: null,
        messageToUser: null,
      }),
    ]);
  });

  it('applies a bulk of 200 items as one batch', async () => {
    const ids = await createContentIds(MAX_BULK_IDS);

    const result = await moderate(ctx(), { type: 'APPROVE' }, ids);

    expect(result.results.map(({ contentId }) => contentId)).toEqual(ids);
    expect(result.results.every(({ outcome }) => outcome === 'APPLIED')).toBe(true);
    const actions = await testPrisma.modAction.findMany();
    expect(actions).toHaveLength(MAX_BULK_IDS);
    expect(new Set(actions.map(({ batchId }) => batchId))).toEqual(new Set([result.batchId]));
    expect(await testPrisma.content.count({ where: { status: 'APPROVED' } })).toBe(MAX_BULK_IDS);
  });

  it('reports an item handled before as ALREADY_HANDLED by the moderator of its latest action', async () => {
    const handler = await createModerator();
    const undoer = await createModerator();
    const content = await createContent({ status: 'REMOVED' });
    await createAction({
      contentId: content.id,
      createdAt: new Date(NOW.getTime() - 3 * MINUTE_MS),
    });
    await createAction({
      contentId: content.id,
      moderatorId: handler.id,
      type: 'REMOVE',
      createdAt: new Date(NOW.getTime() - 2 * MINUTE_MS),
    });
    // A newer action that was undone did not handle the item.
    await createAction({
      contentId: content.id,
      moderatorId: undoer.id,
      createdAt: new Date(NOW.getTime() - MINUTE_MS),
      undoneAt: new Date(NOW.getTime() - MINUTE_MS),
    });

    const result = await moderate(ctx(), { type: 'APPROVE' }, [content.id]);

    expect(result).toMatchObject({
      batchId: null,
      results: [
        {
          contentId: content.id,
          outcome: 'ALREADY_HANDLED',
          handledBy: { id: handler.id },
          content: { id: content.id, status: 'REMOVED' },
        },
      ],
    });
    expect(await testPrisma.modAction.count({ where: { moderatorId: moderator.id } })).toBe(0);
  });

  it('reports an unknown id and a not yet visible id as NOT_FOUND', async () => {
    const unknownId = randomUUID();
    const future = await createContent({ firstReportedAt: after(MINUTE_MS)() });

    const result = await moderate(ctx(), { type: 'APPROVE' }, [unknownId, future.id]);

    expect(result).toEqual({
      batchId: null,
      results: [
        { contentId: unknownId, outcome: 'NOT_FOUND', handledBy: null, content: null },
        { contentId: future.id, outcome: 'NOT_FOUND', handledBy: null, content: null },
      ],
    });
    expect(await statusOf(future.id)).toBe('PENDING');
  });

  it('returns the outcomes in the order of the ids', async () => {
    const [pending] = (await createContentIds(1)) as [string];
    const handled = await createContent({ status: 'APPROVED' });
    const unknownId = randomUUID();

    const result = await moderate(ctx(), { type: 'APPROVE' }, [handled.id, unknownId, pending]);

    expect(result.results.map(({ contentId, outcome }) => [contentId, outcome])).toEqual([
      [handled.id, 'ALREADY_HANDLED'],
      [unknownId, 'NOT_FOUND'],
      [pending, 'APPLIED'],
    ]);
    expect(result.batchId).toEqual(expect.any(String));
  });

  it('applies each id exactly once when two moderators approve the same ids at once', async () => {
    const other = await createModerator();
    const ids = await createContentIds(20);

    const results = await Promise.all([
      moderate(ctx(), { type: 'APPROVE' }, ids),
      moderate(ctx(other), { type: 'APPROVE' }, ids),
    ]);

    const applied = results.flatMap(({ results: items }) =>
      items.filter(({ outcome }) => outcome === 'APPLIED').map(({ contentId }) => contentId),
    );
    expect(applied.sort()).toEqual([...ids].sort());
    expect(await testPrisma.modAction.count()).toBe(ids.length);
  });

  it.each([
    ['archived', () => createReason({ archivedAt: NOW }).then(({ id }) => id)],
    ['unknown', () => Promise.resolve(randomUUID())],
  ])('rejects a removal reason that is %s with BAD_USER_INPUT', async (_name, reasonId) => {
    const content = await createContent();
    const removalReasonId = await reasonId();

    const removal = moderate(ctx(), { type: 'REMOVE', removalReasonId, messageToUser: null }, [
      content.id,
    ]);

    await expect(removal).rejects.toMatchObject({
      extensions: {
        code: 'BAD_USER_INPUT',
        fieldErrors: { removalReasonId: [expect.any(String)] },
      },
    });
    expect(await statusOf(content.id)).toBe('PENDING');
    expect(await testPrisma.modAction.count()).toBe(0);
  });

  it('removes the items and renders the message for each author', async () => {
    const reason = await createReason({ title: 'Spam' });
    const ann = await createAuthor({ username: 'ann' });
    const bob = await createAuthor({ username: 'bob' });
    const garden = await createCommunity({ name: 'Home Gardening' });
    const cats = await createCommunity({ name: 'Cats' });
    const first = await createContent({ authorId: ann.id, communityId: garden.id });
    const second = await createContent({ authorId: bob.id, communityId: cats.id });
    const messageToUser = 'Hi {{username}} from {{community}}: {{reason}}. {{duration}} {{foo}}';

    await moderate(ctx(), { type: 'REMOVE', removalReasonId: reason.id, messageToUser }, [
      first.id,
      second.id,
    ]);

    const actions = await testPrisma.modAction.findMany();
    const removal = {
      type: 'REMOVE',
      removalReasonId: reason.id,
      reasonTitle: 'Spam',
      banDurationDays: null,
      banExpiresAt: null,
    };
    expect(actions.find(({ contentId }) => contentId === first.id)).toMatchObject({
      ...removal,
      messageToUser: 'Hi ann from Home Gardening: Spam. {{duration}} {{foo}}',
    });
    expect(actions.find(({ contentId }) => contentId === second.id)).toMatchObject({
      ...removal,
      messageToUser: 'Hi bob from Cats: Spam. {{duration}} {{foo}}',
    });
    expect([await statusOf(first.id), await statusOf(second.id)]).toEqual(['REMOVED', 'REMOVED']);
  });

  it('bans the author until now + durationDays', async () => {
    const reason = await createReason();
    const content = await createContent();

    await moderate(
      ctx(),
      {
        type: 'BAN',
        removalReasonId: reason.id,
        messageToUser: 'Banned for {{duration}}.',
        durationDays: 7,
      },
      [content.id],
    );

    const expiresAt = new Date(NOW.getTime() + 7 * DAY_MS);
    expect(await testPrisma.modAction.findFirst()).toMatchObject({
      type: 'BAN',
      authorId: content.authorId,
      banDurationDays: 7,
      banExpiresAt: expiresAt,
      messageToUser: 'Banned for 7 days.',
    });
    expect(await statusOf(content.id)).toBe('REMOVED');
    expect(await activeBanOf(content.authorId)).toEqual({ createdAt: NOW, expiresAt });
  });

  it('bans the author permanently when durationDays is null', async () => {
    const reason = await createReason();
    const content = await createContent();

    await moderate(
      ctx(),
      {
        type: 'BAN',
        removalReasonId: reason.id,
        messageToUser: 'Banned: {{duration}}.',
        durationDays: null,
      },
      [content.id],
    );

    expect(await testPrisma.modAction.findFirst()).toMatchObject({
      banDurationDays: null,
      banExpiresAt: null,
      messageToUser: 'Banned: permanent.',
    });
    expect(await activeBanOf(content.authorId)).toEqual({ createdAt: NOW, expiresAt: null });
  });
});

describe('undo', () => {
  async function approveBatch(count = 2) {
    const ids = await createContentIds(count);
    const { batchId } = await moderate(ctx(), { type: 'APPROVE' }, ids);
    if (!batchId) throw new Error('The test batch applied nothing.');
    return { ids, batchId };
  }

  it('restores the items to PENDING and marks the actions as undone', async () => {
    const { ids, batchId } = await approveBatch();
    const undoTime = after(5 * MINUTE_MS);

    const result = await undo(ctx(moderator, undoTime), batchId);

    expect(result.batchId).toBe(batchId);
    expect(result.restored.map(({ id }) => id).sort()).toEqual([...ids].sort());
    expect(result.restored.every(({ status }) => status === 'PENDING')).toBe(true);
    expect(await testPrisma.content.count({ where: { status: 'PENDING' } })).toBe(ids.length);
    const actions = await testPrisma.modAction.findMany();
    expect(actions.map(({ undoneAt }) => undoneAt)).toEqual(ids.map(() => undoTime()));
  });

  it('leaves an item whose status is no longer the one that the action set', async () => {
    const content = await createContent({ status: 'APPROVED' });
    const action = await createAction({
      contentId: content.id,
      moderatorId: moderator.id,
      type: 'REMOVE',
      createdAt: NOW,
    });

    const result = await undo(ctx(), action.batchId);

    expect(result.restored).toEqual([]);
    expect(await statusOf(content.id)).toBe('APPROVED');
    expect(await testPrisma.modAction.findFirst()).toMatchObject({ undoneAt: NOW });
  });

  it('allows undo at the end of the undo window', async () => {
    const { batchId } = await approveBatch();

    const result = await undo(ctx(moderator, after(UNDO_WINDOW_MS)), batchId);

    expect(result.restored).toHaveLength(2);
  });

  it('rejects undo after the undo window with UNDO_EXPIRED', async () => {
    const { ids, batchId } = await approveBatch();

    const undoing = undo(ctx(moderator, after(UNDO_WINDOW_MS + 1)), batchId);

    await expect(undoing).rejects.toMatchObject({ extensions: { code: 'UNDO_EXPIRED' } });
    expect(await statusOf(ids[0] ?? '')).toBe('APPROVED');
  });

  it('rejects undo by another moderator with FORBIDDEN', async () => {
    const { ids, batchId } = await approveBatch();
    const other = await createModerator();

    await expect(undo(ctx(other), batchId)).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
    });
    expect(await statusOf(ids[0] ?? '')).toBe('APPROVED');
  });

  it.each([
    ['within', 0],
    ['after', UNDO_WINDOW_MS + 1],
  ])(
    'rejects a second undo of the same batch %s the undo window with NOT_FOUND',
    async (_name, ms) => {
      const { batchId } = await approveBatch();
      await undo(ctx(), batchId);

      await expect(undo(ctx(moderator, after(ms)), batchId)).rejects.toMatchObject({
        extensions: { code: 'NOT_FOUND' },
      });
    },
  );

  it('undoes a batch only once when two undos run at once', async () => {
    const { batchId } = await approveBatch();

    const outcomes = await Promise.allSettled([undo(ctx(), batchId), undo(ctx(), batchId)]);

    expect(outcomes.map(({ status }) => status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(outcomes.find(({ status }) => status === 'rejected')).toMatchObject({
      reason: { extensions: { code: 'NOT_FOUND' } },
    });
  });

  it.each([
    ['an unknown batch id', randomUUID()],
    ['a batch id that is not a UUID', 'abc'],
  ])('rejects %s with NOT_FOUND', async (_name, batchId) => {
    await expect(undo(ctx(), batchId)).rejects.toMatchObject({
      extensions: { code: 'NOT_FOUND' },
    });
  });

  it('ends the ban of an undone ban batch', async () => {
    const reason = await createReason();
    const content = await createContent();
    const { batchId } = await moderate(
      ctx(),
      { type: 'BAN', removalReasonId: reason.id, messageToUser: null, durationDays: null },
      [content.id],
    );

    await undo(ctx(), batchId ?? '');

    expect(await activeBanOf(content.authorId)).toBeNull();
    expect(await statusOf(content.id)).toBe('PENDING');
  });
});

describe('moderation mutations', () => {
  const APPROVE = /* GraphQL */ `
    mutation ApproveContent($input: ApproveInput!) {
      approveContent(input: $input) {
        batchId
        results {
          contentId
          outcome
          handledBy {
            username
          }
          content {
            id
            status
          }
        }
      }
    }
  `;
  const REMOVE = /* GraphQL */ `
    mutation RemoveContent($input: RemoveInput!) {
      removeContent(input: $input) {
        batchId
      }
    }
  `;
  const BAN = /* GraphQL */ `
    mutation BanAuthor($input: BanInput!) {
      banAuthor(input: $input) {
        batchId
      }
    }
  `;
  const UNDO = /* GraphQL */ `
    mutation UndoModeration($batchId: ID!) {
      undoModeration(batchId: $batchId) {
        batchId
        restored {
          id
          status
        }
      }
    }
  `;

  it('approveContent rejects 201 ids with BAD_USER_INPUT', async () => {
    const contentIds = Array.from({ length: MAX_BULK_IDS + 1 }, () => randomUUID());

    const result = await execute(APPROVE, { input: { contentIds } }, { moderator, now });

    expect(result.data).toBeNull();
    expect(result.errors?.[0]?.extensions).toMatchObject({
      code: 'BAD_USER_INPUT',
      fieldErrors: { contentIds: [expect.any(String)] },
    });
  });

  it('approveContent returns each outcome with handledBy and content', async () => {
    const [pending] = (await createContentIds(1)) as [string];
    const handled = await createContent({ status: 'REMOVED' });
    const handler = await createModerator({ username: 'mod_birch' });
    await createAction({ contentId: handled.id, moderatorId: handler.id, type: 'REMOVE' });

    const result = await execute(
      APPROVE,
      { input: { contentIds: [pending, handled.id] } },
      { moderator, now },
    );

    expect(result.errors).toBeUndefined();
    expect(result.data).toHaveProperty('approveContent.batchId', expect.any(String));
    expect(result.data).toHaveProperty('approveContent.results', [
      {
        contentId: pending,
        outcome: 'APPLIED',
        handledBy: null,
        content: { id: pending, status: 'APPROVED' },
      },
      {
        contentId: handled.id,
        outcome: 'ALREADY_HANDLED',
        handledBy: { username: 'mod_birch' },
        content: { id: handled.id, status: 'REMOVED' },
      },
    ]);
  });

  it('removeContent stores no message for an empty messageToUser', async () => {
    const reason = await createReason();
    const content = await createContent();

    const result = await execute(
      REMOVE,
      { input: { contentIds: [content.id], removalReasonId: reason.id, messageToUser: '  ' } },
      { moderator, now },
    );

    expect(result.errors).toBeUndefined();
    expect(await testPrisma.modAction.findFirst()).toMatchObject({
      type: 'REMOVE',
      messageToUser: null,
    });
  });

  it('banAuthor bans for durationDays with the trimmed message', async () => {
    const reason = await createReason();
    const content = await createContent();

    const result = await execute(
      BAN,
      {
        input: {
          contentIds: [content.id],
          removalReasonId: reason.id,
          durationDays: 3,
          messageToUser: '  Banned for {{duration}}.  ',
        },
      },
      { moderator, now },
    );

    expect(result.errors).toBeUndefined();
    expect(await testPrisma.modAction.findFirst()).toMatchObject({
      type: 'BAN',
      banDurationDays: 3,
      messageToUser: 'Banned for 3 days.',
    });
  });

  it('banAuthor rejects a missing durationDays with BAD_USER_INPUT', async () => {
    const reason = await createReason();
    const content = await createContent();

    const result = await execute(
      BAN,
      { input: { contentIds: [content.id], removalReasonId: reason.id } },
      { moderator, now },
    );

    expect(result.errors?.[0]?.extensions).toMatchObject({
      code: 'BAD_USER_INPUT',
      fieldErrors: { durationDays: [expect.any(String)] },
    });
  });

  it('undoModeration returns the restored items', async () => {
    const [id] = (await createContentIds(1)) as [string];
    const { batchId } = await moderate(ctx(), { type: 'APPROVE' }, [id]);

    const result = await execute(UNDO, { batchId }, { moderator, now });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      undoModeration: { batchId, restored: [{ id, status: 'PENDING' }] },
    });
  });
});
