import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'packages/api/src/schema/*.graphql.ts',
  ignoreNoDocuments: true,
  generates: {
    'apps/web/src/gql/': {
      preset: 'client',
      documents: ['apps/web/src/**/*.{ts,tsx}', '!apps/web/src/gql/**'],
      presetConfig: { fragmentMasking: false },
      config: {
        // client-preset 7 replaced `enumsAsTypes` with `enumType`.
        enumType: 'string-literal',
        useTypeImports: true,
        scalars: { DateTime: 'string' },
      },
    },
    'packages/api/src/generated/resolvers-types.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        contextType: '../context#GraphQLContext',
        mappers: {
          Content: './prisma/client#Content',
          Author: './prisma/client#Author',
          Community: './prisma/client#Community',
          Moderator: './prisma/client#Moderator',
          ModAction: './prisma/client#ModAction',
          RemovalReason: './prisma/client#RemovalReason',
          Report: './prisma/client#Report',
          // The parent carries the filter, so that `totalCount` resolves only when requested.
          ContentConnection: '../services/queue-service#QueueConnection',
        },
        // The Prisma models have the same names as the GraphQL types they map to.
        mapperTypeSuffix: 'Model',
        // String unions, so that Prisma enum values fit the resolver types.
        enumsAsTypes: true,
        // tsconfig has `verbatimModuleSyntax`.
        useTypeImports: true,
        scalars: { DateTime: 'Date | string' },
      },
    },
  },
};

export default config;
