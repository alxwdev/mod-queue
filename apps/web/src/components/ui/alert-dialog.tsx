'use client';

import type { VariantProps } from 'class-variance-authority';
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button } from './button';
import { dialogContentVariants, dialogLayout, overlayClassName } from './dialog';

type AlertDialogProps = Pick<
  ComponentProps<typeof AlertDialogPrimitive.Root>,
  'open' | 'defaultOpen' | 'onOpenChange'
> &
  Pick<ComponentProps<typeof AlertDialogPrimitive.Content>, 'onCloseAutoFocus' | 'children'> &
  VariantProps<typeof dialogContentVariants> & {
    /** The visible heading; it is also the accessible name of the dialog. */
    title: ReactNode;
    /** A line below the title; it becomes the accessible description of the dialog. */
    description?: ReactNode;
    /** One button that opens the dialog; the focus returns to it when the dialog closes. */
    trigger?: ReactElement;
    /** The text of the button that confirms; the button also closes the dialog. */
    confirmLabel: string;
    confirmVariant?: 'primary' | 'danger';
    onConfirm?: () => void;
  };

/**
 * A modal dialog that asks to confirm an action. Only Cancel, the confirm button and `Esc` close
 * it, not a click outside. It opens with the focus on Cancel.
 */
export function AlertDialog({
  open,
  defaultOpen,
  onOpenChange,
  title,
  description,
  size,
  trigger,
  confirmLabel,
  confirmVariant = 'primary',
  onConfirm,
  onCloseAutoFocus,
  children,
}: AlertDialogProps) {
  return (
    <AlertDialogPrimitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogPrimitive.Trigger asChild>{trigger}</AlertDialogPrimitive.Trigger>}
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className={overlayClassName} />
        <AlertDialogPrimitive.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className={dialogContentVariants({ size })}
        >
          {/*
            No Close button, so the header needs no room for it. Without a body, the footer's top
            border already separates it.
          */}
          <div className={cn(dialogLayout.header, 'pr-4', !children && 'border-b-0')}>
            <AlertDialogPrimitive.Title className={dialogLayout.title}>
              {title}
            </AlertDialogPrimitive.Title>
            {description && (
              <AlertDialogPrimitive.Description className={dialogLayout.description}>
                {description}
              </AlertDialogPrimitive.Description>
            )}
          </div>
          {children && <div className={dialogLayout.body}>{children}</div>}
          <div className={dialogLayout.footer}>
            <AlertDialogPrimitive.Cancel asChild>
              <Button>Cancel</Button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <Button variant={confirmVariant} onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
