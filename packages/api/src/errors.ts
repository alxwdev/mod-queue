import { UNDO_WINDOW_MS } from '@modqueue/shared';
import { GraphQLError } from 'graphql';
import type * as z from 'zod';

/** The `extensions.code` values of the API errors. */
export type ErrorCode =
  'BAD_USER_INPUT' | 'NOT_FOUND' | 'FORBIDDEN' | 'UNDO_EXPIRED' | 'INTERNAL_SERVER_ERROR';

/** Messages per input field. The key is the field path joined with dots: `title`, `contentIds.3`. */
export type FieldErrors = Record<string, string[]>;

function apiError(
  code: ErrorCode,
  message: string,
  extensions: Record<string, unknown> = {},
): GraphQLError {
  return new GraphQLError(message, { extensions: { ...extensions, code } });
}

/** Creates a `BAD_USER_INPUT` error with messages per field in `extensions.fieldErrors`. */
export function userInputError(fieldErrors: FieldErrors): GraphQLError {
  return apiError('BAD_USER_INPUT', 'Some fields are not valid. Correct them and try again.', {
    fieldErrors,
  });
}

/** Creates a `NOT_FOUND` error. */
export function notFound(): GraphQLError {
  return apiError('NOT_FOUND', 'This item does not exist. Refresh the page and try again.');
}

/** Creates a `FORBIDDEN` error. */
export function forbidden(): GraphQLError {
  return apiError('FORBIDDEN', 'The current moderator is not allowed to do this.');
}

/** Creates an `UNDO_EXPIRED` error. */
export function undoExpired(): GraphQLError {
  const minutes = UNDO_WINDOW_MS / 60_000;
  return apiError('UNDO_EXPIRED', `Undo is no longer possible after ${minutes} minutes.`);
}

/** Returns the value parsed by `schema`, or throws `BAD_USER_INPUT` with the Zod issues as `fieldErrors`. */
export function parseInput<T extends z.ZodType>(schema: T, value: unknown): z.output<T> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;

  const fieldErrors: FieldErrors = {};
  for (const issue of result.error.issues) {
    // An issue of the whole input (a refinement on the root object) has an empty path: key ''.
    const field = issue.path.map(String).join('.');
    (fieldErrors[field] ??= []).push(issue.message);
  }
  throw userInputError(fieldErrors);
}
