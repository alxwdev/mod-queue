import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

/** Text for screen readers only: it is in the accessibility tree but takes no space on screen. */
export function VisuallyHidden({ className, ...props }: ComponentProps<'span'>) {
  return <span className={cn('sr-only', className)} {...props} />;
}
