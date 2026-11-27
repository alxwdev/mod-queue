'use client';

import { cva } from 'class-variance-authority';
import { Activity, Inbox, ListChecks, ScrollText } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Ref } from 'react';

const navItems = [
  { href: '/queue', label: 'Queue', icon: Inbox },
  { href: '/log', label: 'Mod log', icon: ScrollText },
  { href: '/health', label: 'Queue health', icon: Activity },
  { href: '/reasons', label: 'Removal reasons', icon: ListChecks },
] as const;

type MainNavVariant = 'shell' | 'sheet';

const listVariants = cva('flex gap-1', {
  variants: {
    variant: {
      // A horizontal bar from md, a vertical sidebar from lg.
      shell: 'flex-row items-center lg:flex-col lg:items-stretch',
      sheet: 'flex-col',
    },
  },
});

const linkVariants = cva(
  'flex items-center gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap text-fg-muted transition-colors hover:text-fg aria-[current=page]:bg-accent-subtle aria-[current=page]:text-accent',
  {
    variants: {
      variant: {
        shell: 'h-8 hover:bg-surface lg:h-9',
        sheet: 'h-11 hover:bg-canvas',
      },
    },
  },
);

type MainNavProps = {
  /** `shell`: the bar and the sidebar of the app shell; `sheet`: the list in the phone menu. */
  variant: MainNavVariant;
  /** Runs when a link is activated, for example to close the menu sheet. */
  onNavigate?: () => void;
  className?: string;
  ref?: Ref<HTMLElement>;
};

function isCurrent(pathname: string | null, href: string) {
  return pathname === href || Boolean(pathname?.startsWith(`${href}/`));
}

/** The links to the four console screens; the link of the current screen has `aria-current="page"`. */
export function MainNav({ variant, onNavigate, className, ref }: MainNavProps) {
  const pathname = usePathname();

  return (
    <nav ref={ref} aria-label="Main" className={className}>
      <ul className={listVariants({ variant })}>
        {navItems.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isCurrent(pathname, href) ? 'page' : undefined}
              onClick={onNavigate}
              className={linkVariants({ variant })}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
