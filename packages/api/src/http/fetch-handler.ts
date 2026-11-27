import { type ApolloServer, type BaseContext, HeaderMap } from '@apollo/server';

/** Handles one HTTP request of the Web Fetch API, as a Next.js route handler does. */
export type FetchHandler = (request: Request) => Promise<Response>;

function invalidJsonResponse(): Response {
  return Response.json(
    {
      errors: [
        {
          message: 'The request body is not valid JSON. Send a JSON object with a "query" field.',
          extensions: { code: 'BAD_REQUEST' },
        },
      ],
    },
    { status: 400 },
  );
}

/** Starts `server` and returns a handler that runs Web Fetch API requests through it. */
export function createFetchHandler<TContext extends BaseContext>(
  server: ApolloServer<TContext>,
  getContext: (request: Request) => Promise<TContext>,
): FetchHandler {
  // Serverless functions cannot await a start before the first request; a failed start is
  // logged, and every request then fails with an error.
  server.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();

  return async (request) => {
    const headers = new HeaderMap();
    request.headers.forEach((value, name) => headers.set(name, value));

    let body: unknown;
    if (request.method === 'POST') {
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        return invalidJsonResponse();
      }
    }

    const response = await server.executeHTTPGraphQLRequest({
      httpGraphQLRequest: {
        method: request.method,
        headers,
        search: new URL(request.url).search,
        body,
      },
      context: () => getContext(request),
    });
    if (response.body.kind === 'chunked') {
      // Only incremental delivery (@defer, @stream) gives a chunked body, and graphql 16 has none.
      throw new Error('Incremental delivery is not supported.');
    }
    return new Response(response.body.string, {
      status: response.status ?? 200,
      headers: [...response.headers],
    });
  };
}
