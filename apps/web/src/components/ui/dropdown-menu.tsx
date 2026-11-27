'use client';

import { Check, Circle } from 'lucide-react';
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type DropdownMenuProps = Pick<
  ComponentProps<typeof DropdownMenuPrimitive.Root>,
  'open' | 'defaultOpen' | 'onOpenChange'
> & {
  /** One button that opens the menu; the focus returns to it when the menu closes. */
  trigger: ReactElement;
  align?: ComponentProps<typeof DropdownMenuPrimitive.Content>['align'];
  /** Items, checkbox items, radio groups, labels and separators. */
  children: ReactNode;
};

/** A menu that opens from its trigger; the arrow keys move between the items. */
export function DropdownMenu({ trigger, align = 'start', children, ...props }: DropdownMenuProps) {
  return (
    // Not modal, as in the WAI-ARIA menu button pattern: a modal menu sets aria-hidden on the rest of
    // the page, which still has focusable controls, and axe reports `aria-hidden-focus`.
    <DropdownMenuPrimitive.Root modal={false} {...props}>
      <DropdownMenuPrimitive.Trigger asChild>{trigger}</DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align={align}
          sideOffset={4}
          collisionPadding={8}
          className="z-dropdown max-h-(--radix-dropdown-menu-content-available-height) min-w-48 overflow-y-auto rounded-md border border-line bg-surface-raised p-1 text-sm text-fg shadow-md motion-safe:data-[state=closed]:animate-fade-out motion-safe:data-[state=open]:animate-fade-in"
        >
          {children}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

// The focused item gets the global focus ring; the negative offset keeps it inside the menu.
const itemClassName =
  'relative flex h-8 cursor-default items-center gap-2 rounded-sm px-2 -outline-offset-2 select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-canvas';

/** A menu item that runs an action; the menu closes after it. */
export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return <DropdownMenuPrimitive.Item className={cn(itemClassName, className)} {...props} />;
}

/** A menu item with a check mark that turns an option on or off. */
export function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem className={cn(itemClassName, 'pl-8', className)} {...props}>
      <DropdownMenuPrimitive.ItemIndicator className="absolute left-2 flex size-4 items-center justify-center text-accent">
        <Check className="size-4" />
      </DropdownMenuPrimitive.ItemIndicator>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

/** A group of DropdownMenuRadioItems with one selected `value`; it needs no styles of its own. */
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

/** One option of a DropdownMenuRadioGroup. */
export function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem className={cn(itemClassName, 'pl-8', className)} {...props}>
      <DropdownMenuPrimitive.ItemIndicator className="absolute left-2 flex size-4 items-center justify-center text-accent">
        <Circle className="size-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

/** A heading for the items below it; it cannot be focused. */
export function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn('px-2 py-1.5 text-xs font-medium text-fg-muted', className)}
      {...props}
    />
  );
}

/** A line between groups of items. */
export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn('-mx-1 my-1 h-px bg-line', className)}
      {...props}
    />
  );
}
