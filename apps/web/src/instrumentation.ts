import { captureRequestError } from '@sentry/nextjs';

/** Starts Sentry in the server runtime that loads this file. */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') await import('../sentry.server.config');
  if (process.env.NEXT_RUNTIME === 'edge') await import('../sentry.edge.config');
}

// Reports the errors that server components, route handlers and server actions throw.
export const onRequestError = captureRequestError;
