import { init } from '@sentry/nextjs';

const appEnv = process.env.NEXT_PUBLIC_APP_ENV;

// Without a DSN (local development, CI) the SDK sends nothing.
init({
  dsn: process.env.SENTRY_DSN,
  environment: appEnv,
  tracesSampleRate: appEnv === 'production' ? 0.2 : 1,
  sendDefaultPii: false,
});
