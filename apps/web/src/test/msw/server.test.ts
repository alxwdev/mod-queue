import { graphql, HttpResponse } from 'msw';
import { server } from './server';

describe('MSW server', () => {
  it('answers a GraphQL query with the handler of the test', async () => {
    server.use(
      graphql.query('Me', () => HttpResponse.json({ data: { me: { username: 'mod_aurora' } } })),
    );

    const response = await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'query Me { me { username } }' }),
    });

    expect(await response.json()).toEqual({ data: { me: { username: 'mod_aurora' } } });
  });
});
