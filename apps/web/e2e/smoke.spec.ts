import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('the queue page shows its heading and has no axe violations', async ({ page }) => {
  await page.goto('/queue');

  await expect(page.getByRole('heading', { level: 1, name: 'Queue', exact: true })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
