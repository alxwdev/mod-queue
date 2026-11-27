import type { ReactNode } from 'react';
import { MainNav } from './main-nav';
import { MobileNav } from './mobile-nav';
import { ModeratorSwitcher } from './moderator-switcher';
import { SettingsMenu } from './settings-menu';
import { SkipLink } from './skip-link';

/**
 * The console frame at the height of the screen: header, navigation and `main#main`. Only `main`
 * scrolls, so a screen can fill it with `h-full` (the queue list has its own scroll container).
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    // minmax(0, 1fr): the header never makes the page wider than the screen.
    <div className="grid h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] md:grid-rows-[auto_auto_minmax(0,1fr)] lg:grid-cols-[14rem_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)]">
      <SkipLink />
      <header className="col-span-full flex h-12 items-center gap-2 border-b border-line bg-surface px-4 md:px-6">
        <MobileNav />
        {/* 14 px below md: at 320 px the header needs the space for the moderator's name. */}
        <p className="shrink-0 text-sm font-semibold md:text-base">ModQueue</p>
        <div className="ml-auto flex min-w-0 items-center gap-1">
          <ModeratorSwitcher />
          <SettingsMenu />
        </div>
      </header>
      {/* Below md, the menu sheet of MobileNav has the links. */}
      <MainNav
        variant="shell"
        className="hidden border-b border-line bg-canvas px-6 py-1.5 md:block lg:overflow-y-auto lg:border-r lg:border-b-0 lg:p-3"
      />
      {/* tabIndex -1: the skip link can focus it. It is not a control, so it shows no focus ring. */}
      <main id="main" tabIndex={-1} className="min-w-0 overflow-y-auto p-4 outline-none md:p-6">
        {children}
      </main>
    </div>
  );
}
