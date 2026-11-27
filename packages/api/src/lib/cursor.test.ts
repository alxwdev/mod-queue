import { GraphQLError } from 'graphql';
import { clampFirst, decodeCursor, encodeCursor } from './cursor';

function expectBadCursor(decode: () => unknown): void {
  let caught: unknown;
  try {
    decode();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(GraphQLError);
  expect((caught as GraphQLError).extensions).toMatchObject({
    code: 'BAD_USER_INPUT',
    fieldErrors: { after: [expect.any(String)] },
  });
}

describe('encodeCursor and decodeCursor', () => {
  it('round-trip the sort key values', () => {
    const values = [3, '2026-01-01T10:00:00.000Z', '00000000-0000-4000-8000-000000000001'];

    expect(decodeCursor(encodeCursor(values), 3)).toEqual(values);
  });

  it('throw BAD_USER_INPUT for a cursor of another length', () => {
    const cursor = encodeCursor(['2026-01-01T10:00:00.000Z', 'id']);

    expectBadCursor(() => decodeCursor(cursor, 3));
  });

  it('throw BAD_USER_INPUT for broken base64', () => {
    // Node's decoder would skip the '!' and decode the rest as a valid cursor.
    expectBadCursor(() => decodeCursor(`${encodeCursor(['a', 1])}!`, 2));
    expectBadCursor(() => decodeCursor('', 2));
  });

  it('throw BAD_USER_INPUT for base64 that is not a JSON array of strings and numbers', () => {
    const encode = (json: string) => Buffer.from(json).toString('base64url');

    expectBadCursor(() => decodeCursor(encode('{"a":1}'), 1));
    expectBadCursor(() => decodeCursor(encode('[1,'), 2));
    expectBadCursor(() => decodeCursor(encode('[1,null]'), 2));
  });
});

describe('clampFirst', () => {
  it('keeps a page size between 1 and the maximum', () => {
    expect(clampFirst(-5, 100)).toBe(1);
    expect(clampFirst(0, 100)).toBe(1);
    expect(clampFirst(50, 100)).toBe(50);
    expect(clampFirst(101, 100)).toBe(100);
    expect(clampFirst(30, 20)).toBe(20);
  });
});
