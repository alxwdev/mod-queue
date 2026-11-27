'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import type { ComponentProps, MouseEvent } from 'react';
import { cn } from '@/lib/cn';

export const buttonVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center rounded-md text-sm font-medium whitespace-nowrap transition-colors select-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-hover',
        secondary: 'border border-line-strong bg-surface text-fg hover:bg-canvas active:bg-canvas',
        ghost: 'text-fg-muted hover:bg-canvas hover:text-fg active:bg-canvas',
        danger: 'bg-danger text-danger-fg hover:bg-danger-hover active:bg-danger-hover',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-9 px-4',
        lg: 'h-11 px-5 [&_svg]:size-5',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

export type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** Shows a spinner and ignores activation; the button keeps its width, name and focus. */
    loading?: boolean;
  };

/** A button in one of the design variants and sizes; `type` is "button" unless set. */
export function Button({
  variant,
  size,
  loading = false,
  type = 'button',
  className,
  children,
  onClick,
  ...props
}: ButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    // Not `disabled`: a disabled button loses focus, and the moderator's place with it.
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={handleClick}
      {...props}
    >
      {/* Transparent, not removed, while loading: the text keeps the width and the accessible name. */}
      <span className={cn('inline-flex items-center gap-2', loading && 'opacity-0')}>
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <LoaderCircle className="motion-safe:animate-spin" />
        </span>
      )}
    </button>
  );
}
