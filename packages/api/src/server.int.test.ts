import { type ApolloServer, HeaderMap } from '@apollo/server';
import { testPrisma, truncateAll } from '../test/db';
import { createModerator } from '../test/factories';
import type { GraphQLContext } from './context';
import type { Moderator } from './generated/prisma/client';
import { createLoaders } from './loaders';
import { createApolloServer, type ReportError } from './server';

const now = () => new Date('2026-01-10T00:00:00.000Z');
const servers: ApolloServer<GraphQLContext>[] = [];
let moderator: Moderator;

beforeAll(async () => {
  await truncateAll();
  moderator = await createModerator();
});

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.stop()));
});

async function startServer(isProduction: boolean, reportError: ReportError) {
  const server = createApolloServer({ reportError, isProduction });
  servers.push(server);
  await server.start();
  return server;
}

function contextFor(acting: Moderator): GraphQLContext {
  return { prisma: testPrisma, moderator: acting, loaders: createLoaders(testPrisma, now), now };
}

// `displayName` is non-null in the schema, so `me { displayName }` fails like a resolver bug.
function brokenModerator(): Moderator {
  // @ts-expect-error -- a null in a non-null column is the unexpected server error under test.
  return { ...moderator, displayName: null };
}

async function run(
  server: ApolloServer<GraphQLContext>,
  query: string,
  variables: Record<string, unknown> = {},
  acting = moderator,
) {
  const response = await server.executeOperation(
    { query, variables },
    { contextValue: contextFor(acting) },
  );
  if (response.body.kind !== 'single') throw new Error('Expected a single result.');
  return response.body.singleResult;
}

describe('unexpected errors', () => {
  it('are reported with the operation name and keep their message outside production', async () => {
    const reportError = jest.fn<void, Parameters<ReportError>>();
    const server = await startServer(false, reportError);

    const result = await run(server, 'query Me { me { displayName } }', {}, brokenModerator());

    expect(result.errors?.[0]?.message).toMatch('Cannot return null');
    expect(result.errors?.[0]?.extensions?.code).toBe('INTERNAL_SERVER_ERROR');
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledWith(expect.any(Error), { operationName: 'Me' });
  });

  it('are masked in production', async () => {
    const server = await startServer(true, jest.fn());

    const result = await run(server, 'query Me { me { displayName } }', {}, brokenModerator());

    expect(result.errors).toEqual([
      {
        message: 'Something went wrong on the server. Try again later.',
        locations: [{ line: 1, column: 17 }],
        path: ['me', 'displayName'],
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      },
    ]);
  });
});

describe('errors with a code', () => {
  it('keep their message in production and are not reported', async () => {
    const reportError = jest.fn<void, Parameters<ReportError>>();
    const server = await startServer(true, reportError);

    const input = await run(
      server,
      'query Check($flag: Boolean!) { me @include(if: $flag) { id } }',
      { flag: 'yes' },
    );
    const validation = await run(server, '{ me { unknownField } }');

    expect(input.errors?.[0]?.extensions?.code).toBe('BAD_USER_INPUT');
    expect(input.errors?.[0]?.message).toMatch('$flag');
    expect(validation.errors?.[0]?.extensions?.code).toBe('GRAPHQL_VALIDATION_FAILED');
    expect(validation.errors?.[0]?.message).toMatch('unknownField');
    expect(reportError).not.toHaveBeenCalled();
  });
});

describe('a failed context', () => {
  it('is reported and masked in production', async () => {
    const reportError = jest.fn<void, Parameters<ReportError>>();
    const server = await startServer(true, reportError);
    const failure = new Error('connect ECONNREFUSED 127.0.0.1:5432');

    const response = await server.executeHTTPGraphQLRequest({
      httpGraphQLRequest: {
        method: 'POST',
        headers: new HeaderMap([['content-type', 'application/json']]),
        search: '',
        body: { query: '{ me { id } }' },
      },
      context: () => Promise.reject(failure),
    });

    expect(response.status).toBe(500);
    expect(response.body.kind === 'complete' && response.body.string).not.toMatch('ECONNREFUSED');
    expect(reportError).toHaveBeenCalledWith(failure, { operationName: null });
  });
});

describe('landing page', () => {
  async function getPage(isProduction: boolean) {
    const server = await startServer(isProduction, jest.fn());
    return server.executeHTTPGraphQLRequest({
      httpGraphQLRequest: {
        method: 'GET',
        headers: new HeaderMap([['accept', 'text/html']]),
        search: '',
        body: undefined,
      },
      context: () => Promise.resolve(contextFor(moderator)),
    });
  }

  it('shows Apollo Sandbox outside production', async () => {
    const response = await getPage(false);

    expect(response.headers.get('content-type')).toMatch('text/html');
    expect(response.body.kind === 'complete' && response.body.string).toMatch('embeddable-sandbox');
  });

  it('is off in production', async () => {
    const response = await getPage(true);

    expect(response.headers.get('content-type')).not.toMatch('text/html');
  });
});
