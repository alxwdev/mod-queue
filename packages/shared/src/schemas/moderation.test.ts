import { MAX_BULK_IDS } from '../constants';
import {
  approveInputSchema,
  banDurationDaysSchema,
  banInputSchema,
  contentIdsSchema,
  messageSchema,
  removeInputSchema,
} from './moderation';

function uuids(count: number): string[] {
  return Array.from(
    { length: count },
    (_, n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  );
}

const [ID] = uuids(1) as [string];
const REASON_ID = '11111111-1111-4111-8111-111111111111';

describe('contentIdsSchema', () => {
  it.each([1, MAX_BULK_IDS])('accepts %i unique ids', (count) => {
    expect(contentIdsSchema.safeParse(uuids(count)).success).toBe(true);
  });

  it.each([0, MAX_BULK_IDS + 1])('rejects %i ids', (count) => {
    expect(contentIdsSchema.safeParse(uuids(count)).success).toBe(false);
  });

  it('rejects duplicate ids', () => {
    expect(contentIdsSchema.safeParse([ID, ID]).success).toBe(false);
  });

  it('rejects an id that is not a UUID, at its index', () => {
    const result = contentIdsSchema.safeParse([ID, 'abc']);

    expect(result.error?.issues.map((issue) => issue.path)).toEqual([[1]]);
  });
});

describe('messageSchema', () => {
  it('trims the message', () => {
    expect(messageSchema.parse('  Hi  ')).toBe('Hi');
  });

  it('accepts 1000 characters after trimming', () => {
    expect(messageSchema.safeParse(` ${'a'.repeat(1000)} `).success).toBe(true);
  });

  it('rejects a message over 1000 characters', () => {
    expect(messageSchema.safeParse('a'.repeat(1001)).success).toBe(false);
  });
});

describe('banDurationDaysSchema', () => {
  it.each([1, 3, 7, 30, null])('accepts %p', (days) => {
    expect(banDurationDaysSchema.safeParse(days).success).toBe(true);
  });

  it.each([0, 2, 365, undefined, '7'])('rejects %p', (days) => {
    expect(banDurationDaysSchema.safeParse(days).success).toBe(false);
  });
});

describe('input schemas', () => {
  it('approveInputSchema reports bad ids at contentIds', () => {
    const result = approveInputSchema.safeParse({ contentIds: [] });

    expect(result.error?.issues.map((issue) => issue.path)).toEqual([['contentIds']]);
  });

  it('removeInputSchema returns a trimmed message', () => {
    const input = { contentIds: [ID], removalReasonId: REASON_ID, messageToUser: ' Hi ' };

    expect(removeInputSchema.parse(input)).toEqual({ ...input, messageToUser: 'Hi' });
  });

  it.each([undefined, null, '', '   '])(
    'removeInputSchema returns a null message for %p',
    (message) => {
      const input = { contentIds: [ID], removalReasonId: REASON_ID, messageToUser: message };

      expect(removeInputSchema.parse(input).messageToUser).toBeNull();
    },
  );

  it('removeInputSchema rejects a removal reason id that is not a UUID', () => {
    const result = removeInputSchema.safeParse({ contentIds: [ID], removalReasonId: 'abc' });

    expect(result.error?.issues.map((issue) => issue.path)).toEqual([['removalReasonId']]);
  });

  it('banInputSchema requires durationDays; null is a permanent ban', () => {
    const input = { contentIds: [ID], removalReasonId: REASON_ID };

    expect(banInputSchema.safeParse(input).success).toBe(false);
    expect(banInputSchema.parse({ ...input, durationDays: null }).durationDays).toBeNull();
    expect(banInputSchema.parse({ ...input, durationDays: 7 }).durationDays).toBe(7);
  });
});
