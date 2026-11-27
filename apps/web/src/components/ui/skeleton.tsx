import { cn } from '@/lib/cn';

type SkeletonProps = {
  /** The fixed size of the content that loads (`h-4 w-32`), so nothing moves when it arrives. */
  className: string;
};

/**
 * A placeholder block for loading content. It is hidden from screen readers: the loading region
 * announces its state itself (for example with `aria-busy` or a Spinner).
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('block shrink-0 rounded-md bg-line motion-safe:animate-pulse', className)}
    />
  );
}
