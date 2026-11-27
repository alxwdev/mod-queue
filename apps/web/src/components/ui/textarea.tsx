'use client';

import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';
import { useFieldControl } from './field';
import { controlClassName } from './input';

/** A multi-line text input; inside a Field it gets its id, description and error state. */
export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  const fieldProps = useFieldControl(props);
  return (
    <textarea
      className={cn(controlClassName, 'min-h-20 resize-y py-2', className)}
      {...props}
      {...fieldProps}
    />
  );
}
