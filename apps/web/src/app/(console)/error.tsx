'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/feedback/error-state';
import { reportClientError } from '@/lib/monitoring/report-client-error';

// Inside the app shell: the header and the navigation stay usable.
export default function ConsoleError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => reportClientError(error, { operationName: undefined }), [error]);

  return (
    <ErrorState
      headingLevel={1}
      title="Something went wrong"
      description="This page stopped working. Retry, or reload the page if the error comes back."
      onRetry={retry}
    />
  );
}
