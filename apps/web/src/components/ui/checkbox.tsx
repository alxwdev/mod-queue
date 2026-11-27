'use client';

import { Check, Minus } from 'lucide-react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type CheckboxProps = Omit<ComponentProps<typeof CheckboxPrimitive.Root>, 'children'> & {
  /** The visible label; a click on it toggles the checkbox too. */
  label: ReactNode;
};

/** A labelled checkbox; `checked="indeterminate"` shows the mixed state. */
export function Checkbox({ label, id, className, ...props }: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <span className={cn('inline-flex items-start gap-2', className)}>
      <CheckboxPrimitive.Root
        id={checkboxId}
        className="group peer mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border border-line-strong bg-surface text-accent-fg transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=indeterminate]:border-accent data-[state=indeterminate]:bg-accent"
        {...props}
      >
        <CheckboxPrimitive.Indicator>
          <Check className="size-3.5 group-data-[state=indeterminate]:hidden" strokeWidth={3} />
          <Minus
            className="hidden size-3.5 group-data-[state=indeterminate]:block"
            strokeWidth={3}
          />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <label
        htmlFor={checkboxId}
        className="text-sm text-fg peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
      >
        {label}
      </label>
    </span>
  );
}
