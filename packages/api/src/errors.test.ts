import { GraphQLError } from 'graphql';
import * as z from 'zod';
import { forbidden, notFound, parseInput, undoExpired, userInputError } from './errors';

const schema = z
  .object({
    title: z.string().trim().min(3),
    ids: z.array(z.uuid()).min(1),
  })
  .refine((input) => input.title !== 'forbidden', 'This title is not allowed.');

function catchError(run: () => unknown): GraphQLError {
  try {
    run();
  } catch (error) {
    if (error instanceof GraphQLError) return error;
    throw error;
  }
  throw new Error('Expected a GraphQLError, but nothing was thrown.');
}

describe('parseInput', () => {
  it('returns the parsed value', () => {
    const id = '0b5c7f62-4b5e-4f7e-9d43-0f3a3c2b1a10';

    expect(parseInput(schema, { title: '  Spam  ', ids: [id] })).toEqual({
      title: 'Spam',
      ids: [id],
    });
  });

  it('throws BAD_USER_INPUT with the messages per field path', () => {
    const error = catchError(() => parseInput(schema, { title: 'ab', ids: ['not-a-uuid'] }));

    expect(error.extensions.code).toBe('BAD_USER_INPUT');
    expect(error.extensions.fieldErrors).toEqual({
      title: [expect.any(String)],
      'ids.0': [expect.any(String)],
    });
  });

  it('puts an issue of the whole input under the empty key', () => {
    const id = '0b5c7f62-4b5e-4f7e-9d43-0f3a3c2b1a10';

    const error = catchError(() => parseInput(schema, { title: 'forbidden', ids: [id] }));

    expect(error.extensions.fieldErrors).toEqual({ '': ['This title is not allowed.'] });
  });
});

describe('error helpers', () => {
  it.each([
    [userInputError({ title: ['Too short.'] }), 'BAD_USER_INPUT'],
    [notFound(), 'NOT_FOUND'],
    [forbidden(), 'FORBIDDEN'],
    [undoExpired(), 'UNDO_EXPIRED'],
  ])('sets the code %#', (error, code) => {
    expect(error.extensions.code).toBe(code);
    expect(error.message).not.toBe('');
  });

  it('keeps the field errors', () => {
    expect(userInputError({ title: ['Too short.'] }).extensions.fieldErrors).toEqual({
      title: ['Too short.'],
    });
  });
});
