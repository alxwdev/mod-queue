import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

/** Renders `ui` the way the app does, with the browser URL set to `route`. */
export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  window.history.pushState({}, '', route);
  return render(ui);
}
