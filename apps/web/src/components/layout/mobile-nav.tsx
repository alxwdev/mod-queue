'use client';

import { Menu } from 'lucide-react';
import { useRef, useState } from 'react';
import { IconButton } from '@/components/ui/icon-button';
import { Sheet } from '@/components/ui/sheet';
import { MainNav } from './main-nav';

/** Below md: a menu button that opens the navigation in a full-screen sheet. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  function focusFirstLink(event: Event) {
    // Radix skips links when it focuses the first control on open, and the body has only links:
    // without this, the focus lands on Close and opens its tooltip.
    const firstLink = navRef.current?.querySelector('a');
    if (!firstLink) return;
    event.preventDefault();
    firstLink.focus();
  }

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      onOpenAutoFocus={focusFirstLink}
      side="full"
      title="Menu"
      trigger={
        <IconButton label="Menu" variant="ghost" size="sm" className="md:hidden">
          <Menu />
        </IconButton>
      }
    >
      {/* The sheet stays open after a client-side navigation: a link closes it. */}
      <MainNav ref={navRef} variant="sheet" onNavigate={() => setOpen(false)} />
    </Sheet>
  );
}
