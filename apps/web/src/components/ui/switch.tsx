'use client';

import { Switch as SwitchPrimitive } from 'radix-ui';
import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type SwitchProps = Omit<ComponentProps<typeof SwitchPrimitive.Root>, 'children'> & {
  /** The visible label; a click on it toggles the switch too. */
  label: ReactNode;
  /** A hint below the label, linked through `aria-describedby`. */
  description?: ReactNode;
};

/** A labelled on/off switch for a setting that applies at once. */
export function Switch({ label, description, id, className, ...props }: SwitchProps) {
  const generatedId = useId();
  const switchId = id ?? generatedId;
  const descriptionId = description ? `${switchId}-description` : undefined;

  return (
    <span className={cn('flex items-start justify-between gap-3', className)}>
      <span className="flex flex-col">
        <label htmlFor={switchId} className="text-sm font-medium text-fg">
          {label}
        </label>
        {description && (
          <span id={descriptionId} className="text-xs text-fg-muted">
            {description}
          </span>
        )}
      </span>
      <SwitchPrimitive.Root
        id={switchId}
        aria-describedby={descriptionId}
        className="inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-line-strong p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-accent"
        {...props}
      >
        <SwitchPrimitive.Thumb className="size-4 rounded-full bg-surface shadow-sm transition-transform data-[state=checked]:translate-x-4" />
      </SwitchPrimitive.Root>
    </span>
  );
}
