import { defineConfig, devices } from '@playwright/test';
import { E2E_DATABASE_URL } from './e2e/global-setup';

// Not :3000, so `pnpm dev` can run at the same time. The server is never reused: a server that
// already runs may use another database or lack E2E_TEST_ROUTES.
const port = 3100;
const baseURL = `http://localhost:${port}`;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  workers: isCI ? 1 : undefined,
  retries: isCI ? 1 : 0,
  // CI uploads the HTML report when a run fails (task 2.3). `open: 'never'` stops a local run
  // from blocking the terminal with the report server.
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'tablet',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 }, hasTouch: true },
    },
    {
      // The Pixel 7 preset (mobile, touch) with its full screen height as the viewport.
      name: 'phone',
      use: { ...devices['Pixel 7'], viewport: { width: 412, height: 915 } },
    },
  ],
  webServer: {
    command: 'pnpm start',
    url: baseURL,
    reuseExistingServer: false,
    env: { PORT: String(port), DATABASE_URL: E2E_DATABASE_URL, E2E_TEST_ROUTES: '1' },
  },
});
