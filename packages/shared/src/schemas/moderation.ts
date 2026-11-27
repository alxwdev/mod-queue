import * as z from 'zod';
import { BAN_DURATION_DAYS, MAX_BULK_IDS } from '../constants';

const MAX_MESSAGE_LENGTH = 1000;

/** The items of one moderation command: 1 to `MAX_BULK_IDS` unique UUIDs. */
export const contentIdsSchema = z
  .array(z.uuid('This item id is not valid. Refresh the page and try again.'))
  .min(1, 'Select at least one item.')
  .max(MAX_BULK_IDS, `Select at most ${MAX_BULK_IDS} items.`)
  .refine((ids) => new Set(ids).size === ids.length, 'Select each item only once.');

/** The message to the user: trimmed, at most 1000 characters. */
export const messageSchema = z
  .string()
  .trim()
  .max(MAX_MESSAGE_LENGTH, `Shorten the message to ${MAX_MESSAGE_LENGTH} characters or fewer.`);

/** A ban length in days, or `null` for a permanent ban. */
export const banDurationDaysSchema = z
  .literal(BAN_DURATION_DAYS, 'Choose a ban of 1, 3, 7 or 30 days, or a permanent ban.')
  .nullable();

// A missing, null or empty message means that the user gets no message.
const optionalMessageSchema = messageSchema.nullish().transform((message) => message || null);

export const approveInputSchema = z.object({ contentIds: contentIdsSchema });

export const removeInputSchema = z.object({
  contentIds: contentIdsSchema,
  removalReasonId: z.uuid('Choose a removal reason.'),
  messageToUser: optionalMessageSchema,
});

export const banInputSchema = removeInputSchema.extend({ durationDays: banDurationDaysSchema });
