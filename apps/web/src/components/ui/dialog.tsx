'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { IconButton } from './icon-button';

/** The scrim behind a dialog or a sheet. */
export const overlayClassName =
  'fixed inset-0 z-overlay bg-scrim motion-safe:data-[state=closed]:animate-fade-out motion-safe:data-[state=open]:animate-fade-in';

/** A dialog box: the whole screen below `md`, a centred box of the chosen width from `md`. */
export const dialogContentVariants = cva(
  'fixed inset-0 z-overlay flex flex-col bg-surface-raised text-fg shadow-lg motion-safe:data-[state=closed]:animate-fade-out motion-safe:data-[state=open]:animate-fade-in md:inset-auto md:top-1/2 md:left-1/2 md:max-h-[calc(100dvh-4rem)] md:w-[calc(100%-4rem)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg',
  {
    variants: { size: { sm: 'md:max-w-96', md: 'md:max-w-128', lg: 'md:max-w-160' } },
    defaultVariants: { size: 'md' },
  },
);

/**
 * The parts of a dialog or a sheet. Only the body scrolls, so the header and the footer stay in
 * view; without a body, the footer still sits at the bottom of a full-screen dialog. The header
 * leaves room on the right for the Close button.
 */
export const dialogLayout = {
  header: 'flex flex-col gap-1 border-b border-line py-3 pr-14 pl-4',
  title: 'text-lg font-semibold',
  description: 'text-sm text-fg-muted',
  body: 'min-h-0 flex-1 overflow-y-auto p-4',
  footer: 'mt-auto flex flex-wrap justify-end gap-2 border-t border-line px-4 py-3',
  close: 'absolute top-2.5 right-3',
};

type DialogProps = Pick<
  ComponentProps<typeof DialogPrimitive.Root>,
  'open' | 'defaultOpen' | 'onOpenChange'
> &
  Pick<ComponentProps<typeof DialogPrimitive.Content>, 'onCloseAutoFocus' | 'children'> &
  VariantProps<typeof dialogContentVariants> & {
    /** The visible heading; it is also the accessible name of the dialog. */
    title: ReactNode;
    /** A line below the title; it becomes the accessible description of the dialog. */
    description?: ReactNode;
    /** One button that opens the dialog; the focus returns to it when the dialog closes. */
    trigger?: ReactElement;
    /** The buttons at the bottom. A submit button there needs the `form` attribute of its form. */
    footer?: ReactNode;
  };

/** A modal dialog; `Esc`, the Close button and a click outside close it. */
export function Dialog({
  open,
  defaultOpen,
  onOpenChange,
  title,
  description,
  size,
  trigger,
  footer,
  onCloseAutoFocus,
  children,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlayClassName} />
        <DialogPrimitive.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className={dialogContentVariants({ size })}
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
