import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('the queue page shows its heading and has no axe violations', async ({ page }) => {
  await page.goto('/queue');

  await expect(page.getByRole('heading', { level: 1, name: 'Queue', exact: true })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('the UI showcase shows the token values and has no axe violations', async ({ page }) => {
  await page.goto('/dev/ui');

  await expect(
    page.getByRole('heading', { level: 1, name: 'UI showcase', exact: true }),
  ).toBeVisible();
  // The values come from the browser after hydration; axe also checks the colour contrast of the
  // text pairs.
  await expect(page.getByText(/^#[0-9a-f]{6}$/i).first()).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
