import { testPrisma, truncateAll } from '../../test/db';
import { createModerator } from '../../test/factories';
import { createContext } from '../context';
import { createApolloServer } from '../server';
import { createFetchHandler } from './fetch-handler';

const GRAPHQL_URL = 'http://localhost:3000/api/graphql';
const server = createApolloServer({ reportError: jest.fn(), isProduction: false });
const handle = createFetchHandler(server, (request) =>
  createContext({ request, prisma: testPrisma, now: () => new Date('2026-01-10T00:00:00.000Z') }),
);

beforeAll(async () => {
  await truncateAll();
  await createModerator({ username: 'mod_aurora' });
});

afterAll(() => server.stop());

describe('createFetchHandler', () => {
  it('answers a POST with JSON', async () => {
    const response = await handle(
      new Request(GRAPHQL_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: '{ me { username } }' }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch('application/json');
    expect(await response.json()).toEqual({ data: { me: { username: 'mod_aurora' } } });
  });

  it('answers a POST with invalid JSON with 400', async () => {
    const response = await handle(
      new Request(GRAPHQL_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{ "query": ',
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      errors: [
        {
          message: 'The request body is not valid JSON. Send a JSON object with a "query" field.',
          extensions: { code: 'BAD_REQUEST' },
        },
      ],
    });
  });

  it('answers a GET with the query in the query string', async () => {
    const query = encodeURIComponent('{ me { username } }');

    // Apollo's CSRF protection needs a header that a plain cross-site GET cannot send.
    const response = await handle(
      new Request(`${GRAPHQL_URL}?query=${query}`, {
        headers: { 'apollo-require-preflight': 'true' },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { me: { username: 'mod_aurora' } } });
  });

  it('blocks a GET without a preflight header as a possible CSRF', async () => {
    const query = encodeURIComponent('{ me { username } }');

    const response = await handle(new Request(`${GRAPHQL_URL}?query=${query}`));

    expect(response.status).toBe(400);
    expect(await response.text()).toMatch('Cross-Site Request Forgery');
  });
});
