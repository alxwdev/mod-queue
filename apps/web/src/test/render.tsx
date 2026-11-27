import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { ApolloProvider } from '@/lib/apollo/apollo-provider';

/** Renders `ui` the way the app does, with the browser URL set to `route`. */
export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  window.history.pushState({}, '', route);
  // A wrapper, so that `rerender` keeps the providers; each render gets its own client and cache.
  return render(ui, { wrapper: ApolloProvider });
}
