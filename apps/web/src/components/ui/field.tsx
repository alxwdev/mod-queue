'use client';

import { createContext, use, useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type FieldContextValue = {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
};

const FieldContext = createContext<FieldContextValue | null>(null);

type FieldProps = {
  label: ReactNode;
  /** A hint below the label. */
  description?: ReactNode;
  /** The error message below the control; it also marks the control invalid. */
  error?: ReactNode;
  /** The control's id; generated when not set. */
  id?: string;
  className?: string;
  /** One Input, Textarea or Select: it takes its id and ARIA attributes from the Field. */
  children: ReactNode;
};

/** A labelled form control with an optional description and error message. */
export function Field({ label, description, error, id, className, children }: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = joinIds(descriptionId, errorId);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={controlId} className="text-sm font-medium text-fg">
        {label}
      </label>
      {description && (
        <p id={descriptionId} className="text-xs text-fg-muted">
          {description}
        </p>
      )}
      <FieldContext value={{ id: controlId, describedBy, invalid: Boolean(error) }}>
        {children}
      </FieldContext>
      {error && (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

type ControlProps = {
  id?: string | undefined;
  'aria-describedby'?: string | undefined;
  'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling' | undefined;
};

/** The id and ARIA attributes of a control inside a Field; the control's own props win. */
export function useFieldControl(props: ControlProps): ControlProps {
  const field = use(FieldContext);
  return {
    id: props.id ?? field?.id,
    'aria-describedby': joinIds(field?.describedBy, props['aria-describedby']),
    'aria-invalid': props['aria-invalid'] ?? (field?.invalid ? true : undefined),
  };
}

function joinIds(...ids: (string | undefined)[]) {
  return ids.filter(Boolean).join(' ') || undefined;
}
