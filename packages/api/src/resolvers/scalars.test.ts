import { Kind } from 'graphql';
import { dateTimeScalar } from './scalars';

describe('DateTime', () => {
  it('serializes a Date as an ISO string in UTC', () => {
    expect(dateTimeScalar.serialize(new Date('2026-01-01T12:00:00Z'))).toBe(
      '2026-01-01T12:00:00.000Z',
    );
  });

  it('serializes an ISO string with an offset in UTC', () => {
    expect(dateTimeScalar.serialize('2026-01-01T14:00:00+02:00')).toBe('2026-01-01T12:00:00.000Z');
  });

  it('rejects an invalid Date and a string that is not a date-time', () => {
    expect(() => dateTimeScalar.serialize(new Date('nope'))).toThrow('invalid date');
    expect(() => dateTimeScalar.serialize('2026-01-01')).toThrow('ISO 8601');
  });

  it('parses a variable into a Date', () => {
    expect(dateTimeScalar.parseValue('2026-01-01T12:00:00Z')).toEqual(
      new Date('2026-01-01T12:00:00Z'),
    );
  });

  it('rejects variables that are not ISO date-times', () => {
    expect(() => dateTimeScalar.parseValue('yesterday')).toThrow('ISO 8601');
    expect(() => dateTimeScalar.parseValue(1_767_268_800_000)).toThrow('ISO 8601');
  });

  it('parses a string literal and rejects other literals', () => {
    expect(
      dateTimeScalar.parseLiteral({ kind: Kind.STRING, value: '2026-01-01T12:00:00.000Z' }),
    ).toEqual(new Date('2026-01-01T12:00:00Z'));
    expect(() => dateTimeScalar.parseLiteral({ kind: Kind.INT, value: '1' })).toThrow(
      'must be a string',
    );
  });
});
