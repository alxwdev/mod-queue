import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { VisuallyHidden } from './visually-hidden';

type SpinnerProps = {
  /** What is loading; screen readers read it from the status region. */
  label?: string;
  className?: string;
};

/** A loading indicator with a text label for screen readers. */
export function Spinner({ label = 'Loading', className }: SpinnerProps) {
  return (
    <span role="status" className={cn('inline-flex text-fg-muted', className)}>
      <LoaderCircle className="size-4 motion-safe:animate-spin" />
      <VisuallyHidden>{label}</VisuallyHidden>
    </span>
  );
}
