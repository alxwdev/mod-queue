import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

/** A keyboard key, such as a shortcut hint. */
export function Kbd({ className, ...props }: ComponentProps<'kbd'>) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-line bg-canvas px-1 font-mono text-xs text-fg-muted',
        className,
      )}
      {...props}
    />
  );
}
