'use client';

import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';
import { useFieldControl } from './field';

// Shared by Input, Textarea and Select. 16 px text on phones: iOS zooms into smaller inputs.
export const controlClassName =
  'w-full rounded-md border border-line-strong bg-surface px-3 text-base text-fg placeholder:text-fg-subtle disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger md:text-sm';

/** A text input; inside a Field it gets its id, description and error state. */
export function Input({ className, ...props }: ComponentProps<'input'>) {
  const fieldProps = useFieldControl(props);
  return <input className={cn(controlClassName, 'h-9', className)} {...props} {...fieldProps} />;
}
