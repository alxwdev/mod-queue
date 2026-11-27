import { CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ErrorStateProps = {
  title: string;
  /** A short message that says what to do next. */
  description: string;
  onRetry: () => void;
  /** 1 when the state is the whole page, 2 below a page title. */
  headingLevel?: 1 | 2;
};

/** A message in place of content that failed to load, with a Retry button. */
export function ErrorState({ title, description, onRetry, headingLevel = 2 }: ErrorStateProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <CircleAlert className="size-5 text-danger" />
      <Heading className="text-lg font-semibold">{title}</Heading>
      <p className="max-w-prose text-sm text-fg-muted">{description}</p>
      <Button variant="primary" className="mt-2" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
