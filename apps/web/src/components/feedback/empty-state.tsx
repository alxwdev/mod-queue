import type { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  /** What the moderator can do next. */
  description?: string;
  /** One link or button. */
  action?: ReactNode;
  /** 1 when the state is the whole page, 2 below a page title. */
  headingLevel?: 1 | 2;
};

/** A message in place of content that does not exist, such as an empty list. */
export function EmptyState({ title, description, action, headingLevel = 2 }: EmptyStateProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <Heading className="text-lg font-semibold">{title}</Heading>
      {description && <p className="max-w-prose text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
