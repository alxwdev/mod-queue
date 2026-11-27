import { gql, type TypedDocumentNode } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { screen } from '@testing-library/react';
import { graphql, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

interface MeData {
  me: { __typename: 'Moderator'; id: string; username: string };
}

const ME: TypedDocumentNode<MeData> = gql`
  query Me {
    me {
      id
      username
    }
  }
`;

const meData: MeData = { me: { __typename: 'Moderator', id: 'm1', username: 'mod_aurora' } };

function Username() {
  const { data } = useQuery(ME);
  return <p>{data ? data.me.username : 'Loading'}</p>;
}

describe('ApolloProvider', () => {
  it('runs a query through /api/graphql and renders the result', async () => {
    server.use(graphql.link('/api/graphql').query('Me', () => HttpResponse.json({ data: meData })));

    renderWithProviders(<Username />);

    expect(await screen.findByText('mod_aurora')).toBeInTheDocument();
  });

  it('keeps one client across renders', async () => {
    let requests = 0;
    server.use(
      graphql.link('/api/graphql').query('Me', () => {
        requests += 1;
        return HttpResponse.json({ data: meData });
      }),
    );

    const { rerender } = renderWithProviders(<Username />);
    await screen.findByText('mod_aurora');
    rerender(<Username />);

    expect(screen.getByText('mod_aurora')).toBeInTheDocument();
    expect(requests).toBe(1);
  });

  it('shows cached data at once and refetches it when a query mounts again', async () => {
    const usernames = ['mod_aurora', 'mod_birch'];
    server.use(
      graphql.link('/api/graphql').query('Me', () =>
        HttpResponse.json({
          data: { me: { ...meData.me, username: usernames.shift() ?? 'mod_unknown' } },
        }),
      ),
    );

    const { rerender } = renderWithProviders(<Username />);
    await screen.findByText('mod_aurora');
    rerender(<></>);
    rerender(<Username />);

    expect(screen.getByText('mod_aurora')).toBeInTheDocument();
    expect(await screen.findByText('mod_birch')).toBeInTheDocument();
  });
});
