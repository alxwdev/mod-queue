import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState } from '@/components/feedback/empty-state';

export const metadata: Metadata = {
  title: 'Page not found · ModQueue',
};

// Outside the app shell: the root not-found page renders only in the root layout.
export default function NotFound() {
  return (
    <main>
      <EmptyState
        headingLevel={1}
        title="Page not found"
        description="Check the address, or go to the queue."
        action={
          <Link
            href="/queue"
            className="text-sm font-medium text-accent underline underline-offset-4 hover:text-accent-hover"
          >
            Go to the queue
          </Link>
        }
      />
    </main>
  );
}
