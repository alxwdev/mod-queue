import {
  BAN_DURATION_DAYS,
  CONTENT_TYPES,
  MAX_BULK_IDS,
  MOD_ACTION_TYPES,
  QUEUE_AGES,
  QUEUE_SORTS,
  REPORT_REASONS,
} from './constants';

describe('constants', () => {
  it('limits a bulk command to 200 ids', () => {
    expect(MAX_BULK_IDS).toBe(200);
  });

  it.each<[string, readonly unknown[]]>([
    ['REPORT_REASONS', REPORT_REASONS],
    ['CONTENT_TYPES', CONTENT_TYPES],
    ['MOD_ACTION_TYPES', MOD_ACTION_TYPES],
    ['QUEUE_SORTS', QUEUE_SORTS],
    ['QUEUE_AGES', QUEUE_AGES],
    ['BAN_DURATION_DAYS', BAN_DURATION_DAYS],
  ])('%s is non-empty and has no duplicates', (_name, values) => {
    expect(values.length).toBeGreaterThan(0);
    expect(new Set(values).size).toBe(values.length);
  });
});
