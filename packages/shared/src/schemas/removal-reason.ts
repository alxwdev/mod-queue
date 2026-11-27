import * as z from 'zod';
import { findUnknownPlaceholders, TEMPLATE_PLACEHOLDERS } from '../template';

const TITLE_MIN = 3;
const TITLE_MAX = 60;
const TEMPLATE_MIN = 10;
const TEMPLATE_MAX = 1000;

const knownPlaceholders = TEMPLATE_PLACEHOLDERS.map((name) => `{{${name}}}`).join(', ');

/** A removal reason: trimmed title of 3–60 characters, trimmed message template of 10–1000 characters without unknown placeholders. */
export const removalReasonSchema = z.object({
  title: z
    .string()
    .trim()
    .min(TITLE_MIN, `Enter a title of at least ${TITLE_MIN} characters.`)
    .max(TITLE_MAX, `Shorten the title to ${TITLE_MAX} characters or fewer.`),
  messageTemplate: z
    .string()
    .trim()
    .min(TEMPLATE_MIN, `Enter a message of at least ${TEMPLATE_MIN} characters.`)
    .max(TEMPLATE_MAX, `Shorten the message to ${TEMPLATE_MAX} characters or fewer.`)
    .superRefine((template, ctx) => {
      const unknown = findUnknownPlaceholders(template);
      if (unknown.length === 0) return;
      const names = unknown.map((name) => `{{${name}}}`).join(', ');
      ctx.addIssue({
        code: 'custom',
        message: `Remove the unknown placeholders ${names}. You can use ${knownPlaceholders}.`,
      });
    }),
});
