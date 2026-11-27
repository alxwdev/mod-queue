'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/feedback/error-state';
import { reportClientError } from '@/lib/monitoring/report-client-error';
import './globals.css';

// Replaces the root layout when it fails, so it renders its own document without the providers.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => reportClientError(error, { operationName: undefined }), [error]);

  return (
    <html lang="en">
      <body className="bg-canvas text-fg">
        {/* Error boundaries are client components and cannot export metadata. */}
        <title>Error · ModQueue</title>
        <main>
          <ErrorState
            headingLevel={1}
            title="Something went wrong"
            description="ModQueue stopped working. Retry, or reload the page if the error comes back."
            onRetry={retry}
          />
        </main>
      </body>
    </html>
  );
}
