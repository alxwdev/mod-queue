'use client';

import { useReportWebVitals } from 'next/web-vitals';

/** The fields of a web-vitals 6 metric that the app uses; Next.js bundles web-vitals without types. */
export interface WebVitalsMetric {
  name: 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  id: string;
  entries: PerformanceEntry[];
}

declare global {
  interface Window {
    /** Every Web Vitals metric of the page in the order of report; the E2E tests read it. */
    __MODQUEUE_VITALS__?: WebVitalsMetric[];
  }
}

// Outside the component, so the callback stays the same: the hook subscribes again for a new one.
function reportWebVitals(metric: WebVitalsMetric): void {
  (window.__MODQUEUE_VITALS__ ??= []).push(metric);

  if (process.env.NODE_ENV === 'development') {
    const { name, value, rating, id } = metric;
    console.table([{ name, value, rating, id }]);
    // The web-vitals build of Next.js has no attribution, so show the entries instead: the
    // element of LCP, the layout shifts (with their sources) of CLS, the event of INP.
    if (metric.entries.length > 0) console.table(metric.entries);
  }
}

/** Collects the Web Vitals of the page for the E2E tests and logs them in development. */
export function WebVitalsReporter(): null {
  useReportWebVitals(reportWebVitals);
  return null;
}
