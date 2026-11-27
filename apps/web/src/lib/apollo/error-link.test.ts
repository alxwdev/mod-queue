import { CombinedGraphQLErrors, gql, ServerError } from '@apollo/client';
import { graphql, http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { reportClientError } from '../monitoring/report-client-error';
import { createApolloClient } from './client';

// A relative path: SWC resolves the `@/` alias only in imports, not in `jest.mock()`.
jest.mock('../monitoring/report-client-error');

const PROBE = gql`
  query Probe {
    me {
      id
    }
  }
`;

/** Answers the probe query with one GraphQL error per code; `null` gives an error without a code. */
function respondWithErrors(...codes: (string | null)[]) {
  server.use(
    graphql.query('Probe', () =>
      HttpResponse.json({
        data: null,
        errors: codes.map((code) =>
          code === null ? { message: 'Failed' } : { message: 'Failed', extensions: { code } },
        ),
      }),
    ),
  );
}

async function runProbe() {
  await expect(createApolloClient().query({ query: PROBE })).rejects.toThrow();
}

function reportedCalls() {
  return jest.mocked(reportClientError).mock.calls;
}

describe('errorLink', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it.each(['BAD_USER_INPUT', 'FORBIDDEN', 'UNDO_EXPIRED', 'NOT_FOUND'])(
    'does not report a GraphQL error with the code %s',
    async (code) => {
      respondWithErrors(code);

      await runProbe();

      expect(reportClientError).not.toHaveBeenCalled();
    },
  );

  it('reports a GraphQL error with another code, with the operation name', async () => {
    respondWithErrors('INTERNAL_SERVER_ERROR');

    await runProbe();

    expect(reportedCalls()).toHaveLength(1);
    const [error, context] = reportedCalls()[0] ?? [];
    expect(CombinedGraphQLErrors.is(error)).toBe(true);
    expect(context).toEqual({ operationName: 'Probe' });
  });

  it('reports a GraphQL error without a code', async () => {
    respondWithErrors(null);

    await runProbe();

    expect(reportedCalls()).toHaveLength(1);
  });

  it('reports a failed operation once when an unexpected error comes with an expected one', async () => {
    respondWithErrors('NOT_FOUND', 'INTERNAL_SERVER_ERROR', null);

    await runProbe();

    expect(reportedCalls()).toHaveLength(1);
  });

  it('reports a network error', async () => {
    server.use(graphql.query('Probe', () => HttpResponse.error()));

    await runProbe();

    expect(reportedCalls()).toHaveLength(1);
    const [error] = reportedCalls()[0] ?? [];
    expect(error).toBeInstanceOf(TypeError);
  });

  it('reports an HTTP error response without a GraphQL body', async () => {
    server.use(http.post('/api/graphql', () => new HttpResponse('Bad gateway', { status: 502 })));

    await runProbe();

    expect(reportedCalls()).toHaveLength(1);
    const [error] = reportedCalls()[0] ?? [];
    expect(ServerError.is(error)).toBe(true);
  });

  it('logs every error in development', async () => {
    jest.replaceProperty(process.env, 'NODE_ENV', 'development');
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    respondWithErrors('NOT_FOUND');

    await runProbe();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('Probe');
  });
});
