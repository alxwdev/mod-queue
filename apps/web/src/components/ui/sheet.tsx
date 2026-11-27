'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { dialogLayout, overlayClassName } from './dialog';
import { IconButton } from './icon-button';

const sheetVariants = cva(
  'fixed inset-y-0 right-0 z-overlay flex flex-col bg-surface-raised text-fg shadow-lg motion-safe:data-[state=closed]:animate-slide-out-right motion-safe:data-[state=open]:animate-slide-in-right',
  {
    variants: {
      side: {
        // Tablet: a panel at the right edge.
        right: 'w-[min(32rem,90vw)]',
        // Phone: the whole screen.
        full: 'left-0',
      },
    },
    defaultVariants: { side: 'right' },
  },
);

type SheetProps = Pick<
  ComponentProps<typeof DialogPrimitive.Root>,
  'open' | 'defaultOpen' | 'onOpenChange'
> &
  Pick<ComponentProps<typeof DialogPrimitive.Content>, 'children' | 'onOpenAutoFocus'> &
  VariantProps<typeof sheetVariants> & {
    /** The visible heading; it is also the accessible name of the sheet. */
    title: ReactNode;
    /** A line below the title; it becomes the accessible description of the sheet. */
    description?: ReactNode;
    /** One button that opens the sheet; the focus returns to it when the sheet closes. */
    trigger?: ReactElement;
    /** Content at the bottom, such as the phone action bar; it stays in view while the body scrolls. */
    footer?: ReactNode;
    /** `"queue"` lets the queue shortcuts work inside the sheet (`useHotkeys`). */
    'data-hotkeys-scope'?: 'queue';
  };

/** A modal panel that slides in from the right; the focus stays inside it until it closes. */
export function Sheet({
  open,
  defaultOpen,
  onOpenChange,
  title,
  description,
  side,
  trigger,
  footer,
  'data-hotkeys-scope': hotkeysScope,
  onOpenAutoFocus,
  children,
}: SheetProps) {
  return (
    <DialogPrimitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlayClassName} />
        <DialogPrimitive.Content
          data-hotkeys-scope={hotkeysScope}
          onOpenAutoFocus={onOpenAutoFocus}
          className={sheetVariants({ side })}
        >
          <div className={dialogLayout.header}>
            <DialogPrimitive.Title className={dialogLayout.title}>{title}</DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className={dialogLayout.description}>
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          <div className={dialogLayout.body}>{children}</div>
          {footer && <div className={dialogLayout.footer}>{footer}</div>}
          {/* Last in the DOM: on open, Radix focuses the first control of the body, not Close. */}
          <DialogPrimitive.Close asChild>
            <IconButton label="Close" variant="ghost" size="sm" className={dialogLayout.close}>
              <X />
            </IconButton>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
