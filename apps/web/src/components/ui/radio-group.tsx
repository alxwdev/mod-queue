'use client';

import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type RadioGroupProps = Omit<
  ComponentProps<typeof RadioGroupPrimitive.Root>,
  'aria-label' | 'aria-labelledby'
> & {
  /** The visible name of the group. */
  label: ReactNode;
  /** A hint below the group label, linked through `aria-describedby`. */
  description?: ReactNode;
};

/** A labelled group of RadioGroupItems; the arrow keys move between them and select. */
export function RadioGroup({ label, description, className, children, ...props }: RadioGroupProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="flex flex-col">
        <span id={labelId} className="text-sm font-medium text-fg">
          {label}
        </span>
        {description && (
          <span id={descriptionId} className="text-xs text-fg-muted">
            {description}
          </span>
        )}
      </span>
      <RadioGroupPrimitive.Root
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        className="flex flex-col gap-2"
        {...props}
      >
        {children}
      </RadioGroupPrimitive.Root>
    </div>
  );
}

type RadioGroupItemProps = Omit<ComponentProps<typeof RadioGroupPrimitive.Item>, 'children'> & {
  /** The visible label; a click on it selects the item too. */
  label: ReactNode;
  /** A hint below the label, linked through `aria-describedby`. */
  description?: ReactNode;
};

/** One option of a RadioGroup. */
export function RadioGroupItem({
  label,
  description,
  id,
  className,
  ...props
}: RadioGroupItemProps) {
  const generatedId = useId();
  const itemId = id ?? generatedId;
  const descriptionId = description ? `${itemId}-description` : undefined;

  return (
    <span className={cn('flex items-start gap-2', className)}>
      <RadioGroupPrimitive.Item
        id={itemId}
        aria-describedby={descriptionId}
        className="peer mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-accent"
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-accent" />
      </RadioGroupPrimitive.Item>
      <span className="flex flex-col peer-disabled:opacity-50">
        <label htmlFor={itemId} className="text-sm text-fg">
          {label}
        </label>
        {description && (
          <span id={descriptionId} className="text-xs text-fg-muted">
            {description}
          </span>
        )}
      </span>
    </span>
  );
}
