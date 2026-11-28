import { browserTracingIntegration, captureRouterTransitionStart, init } from '@sentry/nextjs';

const appEnv = process.env.NEXT_PUBLIC_APP_ENV;

// Without a DSN (local development, CI) the SDK sends nothing.
init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: appEnv,
  // Browser tracing records the Web Vitals (LCP, CLS, INP) of the sampled page loads.
  integrations: [browserTracingIntegration()],
  tracesSampleRate: appEnv === 'production' ? 0.2 : 1,
  sendDefaultPii: false,
});

// Starts a navigation span for each client-side route change.
export const onRouterTransitionStart = captureRouterTransitionStart;
