'use client';

import { cva } from 'class-variance-authority';
import type { ReactElement } from 'react';
import { cn } from '@/lib/cn';
import { Button, type ButtonProps } from './button';
import { Tooltip } from './tooltip';

// Square: the width equals the height of each Button size.
const iconButtonVariants = cva('px-0', {
  variants: { size: { sm: 'w-8', md: 'w-9', lg: 'w-11' } },
  defaultVariants: { size: 'md' },
});

type IconButtonProps = Omit<ButtonProps, 'children' | 'aria-label' | 'aria-labelledby'> & {
  /** The accessible name; the tooltip shows the same text. */
  label: string;
  /** A lucide-react icon; lucide hides it from screen readers. */
  children: ReactElement;
};

/** A button with only an icon: `label` names it, and a tooltip shows the label on hover and focus. */
export function IconButton({ label, size, className, ...props }: IconButtonProps) {
  return (
    <Tooltip content={label}>
      <Button
        aria-label={label}
        size={size}
        className={cn(iconButtonVariants({ size }), className)}
        {...props}
      />
    </Tooltip>
  );
}
