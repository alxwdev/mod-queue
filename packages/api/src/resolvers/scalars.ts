import { GraphQLError, GraphQLScalarType, Kind } from 'graphql';
import * as z from 'zod';

const isoDateTime = z.iso.datetime({ offset: true });

function parseDateTime(value: unknown): Date {
  const result = isoDateTime.safeParse(value);
  if (!result.success) {
    throw new GraphQLError(
      `DateTime must be an ISO 8601 date-time such as "2026-01-01T12:00:00Z", not ${JSON.stringify(value)}.`,
    );
  }
  return new Date(result.data);
}

/** Dates go out as ISO 8601 strings in UTC and come in as `Date` objects. */
export const dateTimeScalar = new GraphQLScalarType<Date, string>({
  name: 'DateTime',
  description: 'An ISO 8601 date-time. The API returns it in UTC: "2026-01-01T12:00:00.000Z".',
  serialize(value) {
    const date = value instanceof Date ? value : parseDateTime(value);
    if (Number.isNaN(date.getTime())) {
      throw new GraphQLError('DateTime cannot serialize an invalid date.');
    }
    return date.toISOString();
  },
  parseValue: parseDateTime,
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError('DateTime must be a string.', { nodes: ast });
    }
    return parseDateTime(ast.value);
  },
});
