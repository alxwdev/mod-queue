import { randomUUID } from 'node:crypto';
import {
  formatBanDuration,
  renderTemplate,
  type TemplateVars,
  UNDO_WINDOW_MS,
} from '@modqueue/shared';
import * as z from 'zod';
import type { GraphQLContext } from '../context';
import { forbidden, notFound, undoExpired, userInputError } from '../errors';
import type {
  Content,
  Moderator,
  Prisma,
  PrismaClient,
  RemovalReason,
} from '../generated/prisma/client';
import type { ContentStatus, ModActionType } from '../generated/prisma/enums';
import type { ModerationOutcome } from '../generated/resolvers-types';

const DAY_MS = 86_400_000;

export type ModerationContext = Pick<GraphQLContext, 'prisma' | 'moderator' | 'now'>;

/** What a command does to each item; REMOVE and BAN also need an active removal reason. */
export type ModerationCommand =
  | { type: 'APPROVE' }
  | { type: 'REMOVE'; removalReasonId: string; messageToUser: string | null }
  | {
      type: 'BAN';
      removalReasonId: string;
      messageToUser: string | null;
      /** `null` for a permanent ban. */
      durationDays: number | null;
    };

export interface ModerationItemResult {
  contentId: string;
  outcome: ModerationOutcome;
  /** The moderator of the latest non-undone action of an `ALREADY_HANDLED` item. */
  handledBy: Moderator | null;
  /** The item as it is after the command; `null` for `NOT_FOUND`. */
  content: Content | null;
}

export interface ModerationResult {
  /** `null` when the command applied to no item. */
  batchId: string | null;
  /** One result per id, in the order of the ids. */
  results: ModerationItemResult[];
}

export interface UndoResult {
  batchId: string;
  /** The items that are back in the queue. */
  restored: Content[];
}

interface UpdatedRow {
  id: string;
  authorId: string;
  communityId: string;
}

function statusSetBy(type: ModActionType): ContentStatus {
  return type === 'APPROVE' ? 'APPROVED' : 'REMOVED';
}

async function findActiveReason(tx: Prisma.TransactionClient, id: string): Promise<RemovalReason> {
  const reason = await tx.removalReason.findUnique({ where: { id } });
  if (!reason || reason.archivedAt) {
    throw userInputError({
      removalReasonId: ['This removal reason is no longer available. Choose another one.'],
    });
  }
  return reason;
}

function banFields(command: ModerationCommand, at: Date) {
  if (command.type !== 'BAN') return { banDurationDays: null, banExpiresAt: null };
  const { durationDays } = command;
  return {
    banDurationDays: durationDays,
    banExpiresAt: durationDays === null ? null : new Date(at.getTime() + durationDays * DAY_MS),
  };
}

/** Renders the message of each updated item with its author and community; by item id. */
async function renderMessages(
  tx: Prisma.TransactionClient,
  rows: UpdatedRow[],
  template: string | null,
  vars: TemplateVars,
): Promise<Map<string, string>> {
  if (template === null) return new Map();
  const authors = await tx.author.findMany({
    where: { id: { in: rows.map(({ authorId }) => authorId) } },
    select: { id: true, username: true },
  });
  const communities = await tx.community.findMany({
    where: { id: { in: rows.map(({ communityId }) => communityId) } },
    select: { id: true, name: true },
  });
  const usernames = new Map(authors.map(({ id, username }) => [id, username]));
  const communityNames = new Map(communities.map(({ id, name }) => [id, name]));
  return new Map(
    rows.map((row) => [
      row.id,
      renderTemplate(template, {
        ...vars,
        username: usernames.get(row.authorId),
        community: communityNames.get(row.communityId),
      }),
    ]),
  );
}

/** The moderator of the latest non-undone action of each item, by item id. */
async function findHandlers(
  prisma: PrismaClient,
  contentIds: string[],
): Promise<Map<string, Moderator>> {
  if (contentIds.length === 0) return new Map();
  const actions = await prisma.modAction.findMany({
    where: { contentId: { in: contentIds }, undoneAt: null },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: { contentId: true, moderator: true },
  });
  const handlers = new Map<string, Moderator>();
  // The rows are newest first, so the first action of each item is the latest one.
  for (const { contentId, moderator } of actions) {
    if (!handlers.has(contentId)) handlers.set(contentId, moderator);
  }
  return handlers;
}

async function describeResults(
  prisma: PrismaClient,
  contentIds: string[],
  applied: Set<string>,
  at: Date,
): Promise<ModerationItemResult[]> {
  const contents = await prisma.content.findMany({
    where: { id: { in: contentIds }, firstReportedAt: { lte: at } },
  });
  const contentById = new Map(contents.map((content) => [content.id, content]));
  const handlers = await findHandlers(
    prisma,
    contents.filter(({ id }) => !applied.has(id)).map(({ id }) => id),
  );
  return contentIds.map((contentId): ModerationItemResult => {
    const content = contentById.get(contentId);
    if (!content) return { contentId, outcome: 'NOT_FOUND', handledBy: null, content: null };
    if (applied.has(contentId)) return { contentId, outcome: 'APPLIED', handledBy: null, content };
    return {
      contentId,
      outcome: 'ALREADY_HANDLED',
      handledBy: handlers.get(contentId) ?? null,
      content,
    };
  });
}

/**
 * Applies `command` to the pending, visible items of `contentIds` as one batch. The other items
 * are `ALREADY_HANDLED` or `NOT_FOUND`. Throws `BAD_USER_INPUT` for an archived or unknown reason.
 */
export async function moderate(
  { prisma, moderator, now }: ModerationContext,
  command: ModerationCommand,
  contentIds: string[],
): Promise<ModerationResult> {
  const at = now();
  const batchId = randomUUID();
  const applied = await prisma.$transaction(async (tx) => {
    const reason =
      command.type === 'APPROVE' ? null : await findActiveReason(tx, command.removalReasonId);
    // `status = 'PENDING'` is the guard against parallel commands: a second command waits for the
    // row lock, then finds the item no longer pending and skips it. `updatedAt` is the real time,
    // as Prisma's @updatedAt sets it.
    const rows = await tx.$queryRaw<UpdatedRow[]>`
      UPDATE "Content"
      SET status = ${statusSetBy(command.type)}::"ContentStatus", "updatedAt" = ${new Date()}
      WHERE id = ANY(${contentIds}::uuid[]) AND status = 'PENDING' AND "firstReportedAt" <= ${at}
      RETURNING id, "authorId", "communityId"`;
    const messages = await renderMessages(
      tx,
      rows,
      command.type === 'APPROVE' ? null : command.messageToUser,
      {
        reason: reason?.title,
        duration: command.type === 'BAN' ? formatBanDuration(command.durationDays) : undefined,
      },
    );
    await tx.modAction.createMany({
      data: rows.map((row) => ({
        batchId,
        type: command.type,
        createdAt: at,
        contentId: row.id,
        authorId: row.authorId,
        moderatorId: moderator.id,
        removalReasonId: reason?.id ?? null,
        reasonTitle: reason?.title ?? null,
        messageToUser: messages.get(row.id) ?? null,
        ...banFields(command, at),
      })),
    });
    return new Set(rows.map(({ id }) => id));
  });
  return {
    batchId: applied.size > 0 ? batchId : null,
    results: await describeResults(prisma, contentIds, applied, at),
  };
}

const uuid = z.uuid();

/**
 * Undoes a batch of the acting moderator within the undo window: marks its actions as undone and
 * returns its items to the queue. Throws `NOT_FOUND`, `FORBIDDEN` or `UNDO_EXPIRED`.
 */
export async function undo(
  { prisma, moderator, now }: ModerationContext,
  batchId: string,
): Promise<UndoResult> {
  // Postgres fails on a malformed UUID; for the API it is just an unknown batch.
  if (!uuid.safeParse(batchId).success) throw notFound();
  const at = now();
  return prisma.$transaction(async (tx) => {
    const actions = await tx.modAction.findMany({ where: { batchId, undoneAt: null } });
    const [first] = actions;
    if (!first) throw notFound();
    if (first.moderatorId !== moderator.id) throw forbidden();
    if (at.getTime() - first.createdAt.getTime() > UNDO_WINDOW_MS) throw undoExpired();
    // A parallel undo of the batch waits for the row locks of this update, then updates nothing.
    const { count } = await tx.modAction.updateMany({
      where: { batchId, undoneAt: null },
      data: { undoneAt: at },
    });
    if (count === 0) throw notFound();
    // An item goes back only if it still has the status that the batch set.
    const restored = await tx.content.updateManyAndReturn({
      where: {
        id: { in: actions.map(({ contentId }) => contentId) },
        status: statusSetBy(first.type),
      },
      data: { status: 'PENDING' },
    });
    return { batchId, restored };
  });
}
