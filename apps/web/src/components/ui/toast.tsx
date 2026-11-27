'use client';

import { CircleAlert, CircleCheck, TriangleAlert, X } from 'lucide-react';
import { Toast as ToastPrimitive } from 'radix-ui';
import { createContext, use, useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button } from './button';
import { IconButton } from './icon-button';
import { TooltipProvider } from './tooltip';

type ToastVariant = 'neutral' | 'success' | 'warning' | 'danger';

type ToastOptions = {
  title: string;
  description?: string;
  /** `danger` is for errors: screen readers announce it at once (`type="foreground"`). */
  variant?: ToastVariant;
  /** One button; it also closes the toast. */
  action?: {
    label: string;
    onClick: () => void;
    /** What screen readers announce in place of the button; the label by default. */
    altText?: string;
  };
  /** In milliseconds; 5000 by default. */
  duration?: number;
};

type ToastEntry = ToastOptions & { id: number; open: boolean };

type ToastContextValue = {
  show: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/** Holds the toasts that `useToast().show()` adds and renders them in the viewport. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const lastId = useRef(0);

  const show = useCallback((options: ToastOptions) => {
    lastId.current += 1;
    const id = lastId.current;
    // A closed toast stays in the list until here, so that Radix can play its exit animation.
    setToasts((current) => [
      ...current.filter((toast) => toast.open),
      { ...options, id, open: true },
    ]);
  }, []);

  const close = useCallback((id: number) => {
    setToasts((current) =>
      current.map((toast) => (toast.id === id ? { ...toast, open: false } : toast)),
    );
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext value={value}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {/* Own provider for the Close tooltips: the app's TooltipProvider sits below this one. */}
        <TooltipProvider>
          {toasts.map(({ id, open, ...options }) => (
            <ToastCard
              key={id}
              open={open}
              onOpenChange={(isOpen) => {
                if (!isOpen) close(id);
              }}
              {...options}
            />
          ))}
        </TooltipProvider>
        <ToastPrimitive.Viewport className="fixed inset-x-0 bottom-20 z-toast flex flex-col gap-2 px-4 md:right-6 md:bottom-6 md:left-auto md:w-96 md:px-0" />
      </ToastPrimitive.Provider>
    </ToastContext>
  );
}

/** Shows toasts through `show({ title, description, variant, action, duration })`. */
export function useToast(): ToastContextValue {
  const context = use(ToastContext);
  if (!context) throw new Error('useToast needs a ToastProvider above it.');
  return context;
}

const variantIcons = {
  neutral: null,
  success: <CircleCheck className="size-4 text-success" />,
  warning: <TriangleAlert className="size-4 text-warning" />,
  danger: <CircleAlert className="size-4 text-danger" />,
} satisfies Record<ToastVariant, ReactNode>;

type ToastCardProps = ToastOptions & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function ToastCard({
  title,
  description,
  variant = 'neutral',
  action,
  duration,
  open,
  onOpenChange,
}: ToastCardProps) {
  return (
    <ToastPrimitive.Root
      type={variant === 'danger' ? 'foreground' : 'background'}
      duration={duration}
      open={open}
      onOpenChange={onOpenChange}
      className={cn(
        'relative flex items-start gap-3 rounded-lg border border-line bg-surface-raised p-3 pr-12 text-sm text-fg shadow-md',
        'motion-safe:data-[state=closed]:animate-fade-out motion-safe:data-[state=open]:animate-slide-in-right',
        // Radix sets the swipe distance in these variables; the toast follows the finger.
        'data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-[translate] data-[swipe=end]:translate-x-(--radix-toast-swipe-end-x) data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x)',
      )}
    >
      {variantIcons[variant] && <span className="mt-0.5 shrink-0">{variantIcons[variant]}</span>}
      {/*
        Radix joins the text of the parts into the announcement without spaces ("ApprovedPress Z
        to undo"). The {' '} text nodes add them; a flex container does not render them.
      */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <ToastPrimitive.Title className="font-medium">{title}</ToastPrimitive.Title>
        {description && (
          <>
            {' '}
            <ToastPrimitive.Description className="text-fg-muted">
              {description}
            </ToastPrimitive.Description>
          </>
        )}
      </div>
      {action && (
        <>
          {' '}
          <ToastPrimitive.Action altText={action.altText ?? action.label} asChild>
            <Button size="sm" className="self-center" onClick={action.onClick}>
              {action.label}
            </Button>
          </ToastPrimitive.Action>
        </>
      )}
      <ToastPrimitive.Close asChild>
        <IconButton label="Close" variant="ghost" size="sm" className="absolute top-2 right-2">
          <X />
        </IconButton>
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}
