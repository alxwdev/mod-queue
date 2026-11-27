'use client';

import { useSyncExternalStore } from 'react';

// The variables do not change while the page is open, so there is nothing to subscribe to.
function subscribe() {
  return () => {};
}

/** Shows the value that the browser gives a CSS variable of the root element. */
export function CssVariableValue({ name }: { name: `--${string}` }) {
  return useSyncExternalStore(
    subscribe,
    () => getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
    // The server has no styles: the value appears after hydration.
    () => '',
  );
}
