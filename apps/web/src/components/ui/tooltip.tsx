'use client';

import { Tooltip as TooltipPrimitive } from 'radix-ui';
import type { ComponentProps, ReactElement, ReactNode } from 'react';

/** Shares the 400 ms open delay between all tooltips below it; every Tooltip needs one above it. */
export function TooltipProvider({
  delayDuration = 400,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />;
}

type TooltipProps = {
  /** Repeats or explains what the trigger already says: a tooltip never is the only place for it. */
  content: ReactNode;
  /** One focusable element that accepts a ref, such as a Button. */
  children: ReactElement;
  side?: ComponentProps<typeof TooltipPrimitive.Content>['side'];
};

/** A short hint for its trigger on hover and on keyboard focus. */
export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={4}
          collisionPadding={8}
          className="z-dropdown max-w-xs rounded-md border border-line bg-surface-raised px-2 py-1 text-xs text-fg shadow-md"
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
