import { test, expect } from '@playwright/test';

test('EXT-01: browser alert can be accepted @external', async ({ page }) => {
  await page.goto('https://the-internet.herokuapp.com/javascript_alerts');

  page.once('dialog', async dialog => {
    expect(dialog.message()).toBe('I am a JS Alert');
    await dialog.accept();
  });

  await page
    .getByRole('button', { name: 'Click for JS Alert', exact: true })
    .click();

  await expect(page.locator('#result'))
    .toHaveText('You successfully clicked an alert');
});

test('EXT-02: dynamically loaded text becomes visible @external', async ({ page }) => {
  await page.goto(
    'https://the-internet.herokuapp.com/dynamic_loading/1'
  );

  await page.getByRole('button', { name: 'Start', exact: true }).click();

  const result = page.locator('#finish');

  // Wait for the hidden result to become visible.
  await expect(result).toBeVisible({ timeout: 15_000 });

  // Then verify its text.
  await expect(result).toHaveText('Hello World!');
});