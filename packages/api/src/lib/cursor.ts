import type { GraphQLError } from 'graphql';
import * as z from 'zod';
import { userInputError } from '../errors';

/** One sort key value of a row: a number, a string or a date as an ISO string. */
export type CursorValue = string | number;

const cursorValues = z.array(z.union([z.string(), z.number()]));

/** Creates an opaque cursor: `base64url(JSON.stringify(values))`. */
export function encodeCursor(values: readonly CursorValue[]): string {
  return Buffer.from(JSON.stringify(values)).toString('base64url');
}

/** Creates the `BAD_USER_INPUT` error of a cursor that this API did not create. */
export function invalidCursor(): GraphQLError {
  return userInputError({
    after: ['This cursor is not valid. Load the list again from the start.'],
  });
}

/** Returns the `length` sort key values of a cursor, or throws `BAD_USER_INPUT`. */
export function decodeCursor(cursor: string, length: number): CursorValue[] {
  // Node's base64url decoder skips characters outside the alphabet, so check them first.
  if (!/^[A-Za-z0-9_-]+$/.test(cursor)) throw invalidCursor();
  let json: unknown;
  try {
    json = JSON.parse(Buffer.from(cursor, 'base64url').toString());
  } catch {
    throw invalidCursor();
  }
  const result = cursorValues.length(length).safeParse(json);
  if (!result.success) throw invalidCursor();
  return result.data;
}

/** Keeps a requested page size `first` between 1 and `max`. */
export function clampFirst(first: number, max: number): number {
  return Math.min(Math.max(first, 1), max);
}
