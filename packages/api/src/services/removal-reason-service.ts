import * as z from 'zod';
import type { GraphQLContext } from '../context';
import { notFound } from '../errors';
import type { RemovalReason } from '../generated/prisma/client';

export type RemovalReasonContext = Pick<GraphQLContext, 'prisma' | 'now'>;

/** The validated fields of a removal reason. */
export interface RemovalReasonData {
  title: string;
  messageTemplate: string;
}

const uuid = z.uuid();

// Postgres fails on a malformed UUID; for the API it is just an unknown reason.
function assertUuid(id: string): void {
  if (!uuid.safeParse(id).success) throw notFound();
}

/** Lists the removal reasons by `sortOrder`; archived ones only with `includeArchived`. */
export function listRemovalReasons(
  { prisma }: RemovalReasonContext,
  includeArchived: boolean,
): Promise<RemovalReason[]> {
  return prisma.removalReason.findMany({
    where: includeArchived ? {} : { archivedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });
}

/** Creates a removal reason at the end of the list. */
export async function createRemovalReason(
  { prisma }: RemovalReasonContext,
  data: RemovalReasonData,
): Promise<RemovalReason> {
  // Archived reasons count too, so that a new reason never shares a position with an old one.
  const { _max } = await prisma.removalReason.aggregate({ _max: { sortOrder: true } });
  const sortOrder = _max.sortOrder === null ? 0 : _max.sortOrder + 1;
  return prisma.removalReason.create({ data: { ...data, sortOrder } });
}

/** Changes the title and the message template of a removal reason; `NOT_FOUND` for an unknown id. */
export async function updateRemovalReason(
  { prisma }: RemovalReasonContext,
  id: string,
  data: RemovalReasonData,
): Promise<RemovalReason> {
  assertUuid(id);
  const [reason] = await prisma.removalReason.updateManyAndReturn({ where: { id }, data });
  if (!reason) throw notFound();
  return reason;
}

/** Archives a removal reason at the request time; an archived reason keeps its first `archivedAt`. */
export async function archiveRemovalReason(
  { prisma, now }: RemovalReasonContext,
  id: string,
): Promise<RemovalReason> {
  assertUuid(id);
  const [archived] = await prisma.removalReason.updateManyAndReturn({
    where: { id, archivedAt: null },
    data: { archivedAt: now() },
  });
  if (archived) return archived;
  const reason = await prisma.removalReason.findUnique({ where: { id } });
  if (!reason) throw notFound();
  return reason;
}
