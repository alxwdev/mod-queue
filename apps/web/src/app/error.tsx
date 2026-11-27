'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/feedback/error-state';
import { reportClientError } from '@/lib/monitoring/report-client-error';

// Catches errors of the app shell itself and of pages outside it; (console)/error.tsx catches the
// errors of the console pages inside the shell.
export default function RootError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => reportClientError(error, { operationName: undefined }), [error]);

  return (
    <main>
      <ErrorState
        headingLevel={1}
        title="Something went wrong"
        description="ModQueue stopped working. Retry, or reload the page if the error comes back."
        onRetry={retry}
      />
    </main>
  );
}
