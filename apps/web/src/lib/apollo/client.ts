import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { errorLink } from '@/lib/apollo/error-link';
import { typePolicies } from '@/lib/apollo/type-policies';

/** Creates an Apollo Client for the app's GraphQL API at `/api/graphql`. */
export function createApolloClient() {
  return new ApolloClient({
    link: ApolloLink.from([
      errorLink,
      new HttpLink({ uri: '/api/graphql', credentials: 'same-origin' }),
    ]),
    cache: new InMemoryCache({ typePolicies }),
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' },
    },
  });
}
