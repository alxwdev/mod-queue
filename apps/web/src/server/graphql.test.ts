import { type CreateGraphQLHandlerOptions, createGraphQLHandler } from '@modqueue/api';
import { captureException, flush } from '@sentry/nextjs';
import { after } from 'next/server';
import { handleGraphQLRequest } from './graphql';

// A factory, not automock: the real package loads its seed, which imports faker (ES modules only).
jest.mock('@modqueue/api', () => ({
  createGraphQLHandler: jest.fn(() => () => Promise.resolve(new Response('{}'))),
  getPrisma: jest.fn(() => 'prisma client'),
  systemClock: jest.fn(),
}));
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  flush: jest.fn(() => Promise.resolve(true)),
}));
// `after` works only inside a Next.js request; keep its callback to run it by hand.
jest.mock('next/server', () => ({ after: jest.fn() }));

const createGraphQLHandlerMock = jest.mocked(createGraphQLHandler);
const captureExceptionMock = jest.mocked(captureException);
const afterMock = jest.mocked(after);

function graphQLRequest(): Request {
  return new Request('http://localhost/api/graphql', { method: 'POST', body: '{}' });
}

/** The `reportError` option that the module gave the API. */
function reportError(): CreateGraphQLHandlerOptions['reportError'] {
  const options = createGraphQLHandlerMock.mock.calls[0]?.[0];
  if (!options) throw new Error('The GraphQL handler was not created.');
  return options.reportError;
}

describe('handleGraphQLRequest', () => {
  beforeEach(() => {
    captureExceptionMock.mockClear();
    afterMock.mockClear();
  });

  it('sends an unexpected API error to Sentry with its operation name as a tag', async () => {
    await handleGraphQLRequest(graphQLRequest());
    const error = new Error('Database is down');

    reportError()(error, { operationName: 'Queue' });

    expect(captureExceptionMock).toHaveBeenCalledWith(error, {
      tags: { 'graphql.operation': 'Queue' },
    });
  });

  it('sends an error without an operation name without a tag', async () => {
    await handleGraphQLRequest(graphQLRequest());
    const error = new Error('Context failed');

    reportError()(error, { operationName: null });

    expect(captureExceptionMock).toHaveBeenCalledWith(error, undefined);
  });

  it('flushes the Sentry events after each response', async () => {
    await handleGraphQLRequest(graphQLRequest());
    await handleGraphQLRequest(graphQLRequest());

    expect(afterMock).toHaveBeenCalledTimes(2);
    const flushAfterResponse = afterMock.mock.calls[0]?.[0];
    expect(flushAfterResponse).toEqual(expect.any(Function));
    if (typeof flushAfterResponse === 'function') await flushAfterResponse();
    expect(flush).toHaveBeenCalledWith(2000);
    expect(createGraphQLHandlerMock).toHaveBeenCalledTimes(1);
  });
});
