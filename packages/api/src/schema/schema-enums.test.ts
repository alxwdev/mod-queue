import {
  CONTENT_TYPES,
  MOD_ACTION_TYPES,
  QUEUE_AGES,
  QUEUE_SORTS,
  REPORT_REASONS,
} from '@modqueue/shared';
import { buildASTSchema, isEnumType, parse } from 'graphql';
import * as prismaEnums from '../generated/prisma/enums';
import { typeDefs } from './index';

const schema = buildASTSchema(parse(typeDefs.join('\n')));

function graphqlEnumValues(name: string): string[] {
  const type = schema.getType(name);
  if (!isEnumType(type)) throw new Error(`${name} is not an enum in the GraphQL schema`);
  return type.getValues().map((value) => value.name);
}

describe('GraphQL enums', () => {
  it.each<[string, readonly string[]]>([
    ['ReportReason', REPORT_REASONS],
    ['ContentType', CONTENT_TYPES],
    ['ModActionType', MOD_ACTION_TYPES],
    ['QueueSort', QUEUE_SORTS],
    ['QueueAge', QUEUE_AGES],
  ])('%s equals the shared constant', (name, values) => {
    expect(graphqlEnumValues(name)).toEqual(values);
  });

  it.each<[string, Record<string, string>]>([
    ['ReportReason', prismaEnums.ReportReason],
    ['ContentType', prismaEnums.ContentType],
    ['ContentStatus', prismaEnums.ContentStatus],
    ['ModActionType', prismaEnums.ModActionType],
  ])('%s equals the Prisma enum', (name, prismaEnum) => {
    expect(graphqlEnumValues(name)).toEqual(Object.values(prismaEnum));
  });
});
