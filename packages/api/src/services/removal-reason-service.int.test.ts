import { randomUUID } from 'node:crypto';
import { testPrisma, truncateAll } from '../../test/db';
import { execute } from '../../test/execute';
import { createModerator, createReason } from '../../test/factories';
import type { Moderator } from '../generated/prisma/client';
import {
  archiveRemovalReason,
  createRemovalReason,
  listRemovalReasons,
  updateRemovalReason,
} from './removal-reason-service';

const NOW = new Date('2026-01-10T12:00:00.000Z');
const now = () => NOW;
const ctx = { prisma: testPrisma, now };

const SPAM = { title: 'Spam', messageTemplate: 'Hi {{username}}, this is spam.' };

let moderator: Moderator;

beforeEach(async () => {
  await truncateAll();
  moderator = await createModerator();
});

function titlesOf(reasons: { title: string }[]): string[] {
  return reasons.map(({ title }) => title);
}

describe('createRemovalReason', () => {
  it('creates the first reason at sortOrder 0', async () => {
    const reason = await createRemovalReason(ctx, SPAM);

    expect(reason).toMatchObject({ ...SPAM, sortOrder: 0, archivedAt: null });
    expect(await testPrisma.removalReason.count()).toBe(1);
  });

  it('puts a new reason after every reason, also an archived one', async () => {
    await createReason({ sortOrder: 4 });
    await createReason({ sortOrder: 7, archivedAt: NOW });

    const reason = await createRemovalReason(ctx, SPAM);

    expect(reason.sortOrder).toBe(8);
  });
});

describe('updateRemovalReason', () => {
  it('changes the title and the template and keeps the position', async () => {
    const reason = await createReason({ sortOrder: 3 });

    const updated = await updateRemovalReason(ctx, reason.id, SPAM);

    expect(updated).toMatchObject({ id: reason.id, ...SPAM, sortOrder: 3, archivedAt: null });
    expect(await testPrisma.removalReason.findUnique({ where: { id: reason.id } })).toEqual(
      updated,
    );
  });

  it.each([randomUUID(), 'not-a-uuid'])('gives NOT_FOUND for the id %s', async (id) => {
    await expect(updateRemovalReason(ctx, id, SPAM)).rejects.toMatchObject({
      extensions: { code: 'NOT_FOUND' },
    });
  });
});

describe('archiveRemovalReason', () => {
  it('sets archivedAt to the request time', async () => {
    const reason = await createReason();

    const archived = await archiveRemovalReason(ctx, reason.id);

    expect(archived).toMatchObject({ id: reason.id, archivedAt: NOW });
    expect(await testPrisma.removalReason.findUnique({ where: { id: reason.id } })).toEqual(
      archived,
    );
  });

  it('keeps the first archivedAt of an archived reason', async () => {
    const archivedAt = new Date('2026-01-05T00:00:00.000Z');
    const reason = await createReason({ archivedAt });

    expect(await archiveRemovalReason(ctx, reason.id)).toMatchObject({ archivedAt });
  });

  it.each([randomUUID(), 'not-a-uuid'])('gives NOT_FOUND for the id %s', async (id) => {
    await expect(archiveRemovalReason(ctx, id)).rejects.toMatchObject({
      extensions: { code: 'NOT_FOUND' },
    });
  });
});

describe('listRemovalReasons', () => {
  it('lists by sortOrder and hides archived reasons unless asked', async () => {
    await createReason({ title: 'Third', sortOrder: 2 });
    await createReason({ title: 'First', sortOrder: 0 });
    await createReason({ title: 'Archived', sortOrder: 1, archivedAt: NOW });

    expect(titlesOf(await listRemovalReasons(ctx, false))).toEqual(['First', 'Third']);
    expect(titlesOf(await listRemovalReasons(ctx, true))).toEqual(['First', 'Archived', 'Third']);
  });
});

describe('GraphQL', () => {
  const LIST = /* GraphQL */ `
    query RemovalReasons($includeArchived: Boolean) {
      removalReasons(includeArchived: $includeArchived) {
        title
        archivedAt
      }
    }
  `;
  const CREATE = /* GraphQL */ `
    mutation CreateRemovalReason($input: RemovalReasonInput!) {
      createRemovalReason(input: $input) {
        id
        title
        messageTemplate
        sortOrder
        archivedAt
      }
    }
  `;
  const UPDATE = /* GraphQL */ `
    mutation UpdateRemovalReason($id: ID!, $input: RemovalReasonInput!) {
      updateRemovalReason(id: $id, input: $input) {
        title
        messageTemplate
      }
    }
  `;
  const ARCHIVE = /* GraphQL */ `
    mutation ArchiveRemovalReason($id: ID!) {
      archiveRemovalReason(id: $id) {
        archivedAt
      }
    }
  `;

  function run(operation: string, variables: Record<string, unknown>) {
    return execute(operation, variables, { moderator, now });
  }

  it('creates, updates and archives a reason with trimmed fields', async () => {
    const created = await run(CREATE, {
      input: { title: '  Spam ', messageTemplate: ` ${SPAM.messageTemplate}  ` },
    });

    expect(created.errors).toBeUndefined();
    expect(created.data).toHaveProperty('createRemovalReason.title', 'Spam');
    expect(created.data).toHaveProperty('createRemovalReason.sortOrder', 0);
    const { id } = await testPrisma.removalReason.findFirstOrThrow();

    const updated = await run(UPDATE, {
      id,
      input: { title: 'Off-topic', messageTemplate: 'This is off-topic in {{community}}.' },
    });

    expect(updated).toEqual({
      data: {
        updateRemovalReason: {
          title: 'Off-topic',
          messageTemplate: 'This is off-topic in {{community}}.',
        },
      },
    });
    expect(await run(ARCHIVE, { id })).toEqual({
      data: { archiveRemovalReason: { archivedAt: NOW.toISOString() } },
    });
  });

  it('hides archived reasons by default and shows them with includeArchived: true', async () => {
    await createReason({ title: 'Active', sortOrder: 0 });
    await createReason({ title: 'Archived', sortOrder: 1, archivedAt: NOW });

    expect(await run(LIST, {})).toEqual({
      data: { removalReasons: [{ title: 'Active', archivedAt: null }] },
    });
    expect(await run(LIST, { includeArchived: true })).toEqual({
      data: {
        removalReasons: [
          { title: 'Active', archivedAt: null },
          { title: 'Archived', archivedAt: NOW.toISOString() },
        ],
      },
    });
  });

  it('returns fieldErrors for a short title and an unknown placeholder', async () => {
    const result = await run(CREATE, {
      input: { title: 'ab', messageTemplate: 'Hi {{user}}, this is spam.' },
    });

    expect(result.data).toBeNull();
    expect(result.errors?.[0]?.extensions).toMatchObject({
      code: 'BAD_USER_INPUT',
      fieldErrors: {
        title: ['Enter a title of at least 3 characters.'],
        messageTemplate: [
          'Remove the unknown placeholders {{user}}. You can use {{username}}, {{community}}, {{reason}}, {{duration}}.',
        ],
      },
    });
    expect(await testPrisma.removalReason.count()).toBe(0);
  });

  it('rejects an invalid update and keeps the reason as it is', async () => {
    const reason = await createReason();

    const result = await run(UPDATE, {
      id: reason.id,
      input: { title: 'ab', messageTemplate: 'x' },
    });

    expect(result.errors?.[0]?.extensions).toHaveProperty('code', 'BAD_USER_INPUT');
    expect(await testPrisma.removalReason.findUnique({ where: { id: reason.id } })).toEqual(reason);
  });
});
