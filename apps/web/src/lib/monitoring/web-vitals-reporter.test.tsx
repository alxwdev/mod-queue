import { render } from '@testing-library/react';
import { useReportWebVitals } from 'next/web-vitals';
import { type WebVitalsMetric, WebVitalsReporter } from './web-vitals-reporter';

jest.mock('next/web-vitals', () => ({ useReportWebVitals: jest.fn() }));

const lcp: WebVitalsMetric = { name: 'LCP', value: 1200, rating: 'good', id: 'v6-1', entries: [] };
const lcpEntry = { entryType: 'largest-contentful-paint', startTime: 1200 } as PerformanceEntry;

/** Renders the reporter and returns the callback that it gave `useReportWebVitals`. */
function startReporter(): (metric: WebVitalsMetric) => void {
  render(<WebVitalsReporter />);
  const report = jest.mocked(useReportWebVitals).mock.lastCall?.[0];
  if (!report) throw new Error('WebVitalsReporter did not call useReportWebVitals.');
  return report;
}

describe('WebVitalsReporter', () => {
  let table: jest.SpyInstance;

  beforeEach(() => {
    delete window.__MODQUEUE_VITALS__;
    table = jest.spyOn(console, 'table').mockImplementation(() => undefined);
  });

  afterEach(() => {
    // Restores console.table and NODE_ENV.
    jest.restoreAllMocks();
  });

  it('collects every metric in window.__MODQUEUE_VITALS__ in the order of report', () => {
    const report = startReporter();
    const lcpWithEntry: WebVitalsMetric = { ...lcp, entries: [lcpEntry] };
    const cls: WebVitalsMetric = { ...lcp, name: 'CLS', value: 0.02, id: 'v6-2' };

    report(lcpWithEntry);
    report(cls);

    expect(window.__MODQUEUE_VITALS__).toEqual([lcpWithEntry, cls]);
  });

  it('logs nothing outside development', () => {
    startReporter()(lcp);

    expect(table).not.toHaveBeenCalled();
  });

  it('logs the metric and its entries as tables in development', () => {
    jest.replaceProperty(process.env, 'NODE_ENV', 'development');

    startReporter()({ ...lcp, entries: [lcpEntry] });

    expect(table).toHaveBeenNthCalledWith(1, [
      { name: 'LCP', value: 1200, rating: 'good', id: 'v6-1' },
    ]);
    expect(table).toHaveBeenNthCalledWith(2, [lcpEntry]);
  });

  it('logs no entry table for a metric without entries', () => {
    jest.replaceProperty(process.env, 'NODE_ENV', 'development');

    startReporter()(lcp);

    expect(table).toHaveBeenCalledTimes(1);
  });
});
