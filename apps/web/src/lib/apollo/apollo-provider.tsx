'use client';

import { ApolloProvider as BaseApolloProvider } from '@apollo/client/react';
import { type ReactNode, useState } from 'react';
import { createApolloClient } from '@/lib/apollo/client';

/** Gives its children one Apollo Client, created on the first render. */
export function ApolloProvider({ children }: { children: ReactNode }) {
  // Not at module scope: on the server, one client would share its cache between requests.
  const [client] = useState(() => createApolloClient());
  return <BaseApolloProvider client={client}>{children}</BaseApolloProvider>;
}
