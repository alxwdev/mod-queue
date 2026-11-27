'use client';

import type { MouseEvent } from 'react';

/** The first link of the page: it moves the focus past the header and the navigation to `main#main`. */
export function SkipLink() {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const main = document.getElementById('main');
    if (!main) return;
    // A fragment link does not move the focus in every browser; this does, and keeps the URL clean.
    event.preventDefault();
    main.focus();
  }

  return (
    <a
      href="#main"
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-toast focus:rounded-md focus:bg-surface-raised focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-accent focus:shadow-md"
    >
      Skip to main content
    </a>
  );
}
