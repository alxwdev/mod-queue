'use client';

import { Button } from '@/components/ui/button';

/** Throws in a click handler; no error boundary catches it, so Sentry's global handler reports it. */
export function ThrowTestErrorButton() {
  return (
    <Button
      variant="danger"
      onClick={() => {
        throw new Error('Sentry test error from /dev/ui');
      }}
    >
      Throw test error
    </Button>
  );
}
