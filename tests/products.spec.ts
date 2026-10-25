import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('https://www.saucedemo.com/');

  await page.locator('[data-test="username"]').fill('standard_user');
  await page.locator('[data-test="password"]').fill('secret_sauce');
  await page.locator('[data-test="login-button"]').click();

  await expect(page).toHaveURL(/inventory\.html/);
});

test('add two products and remove one from the cart', async ({ page }) => {
  // Add two different products.
  await page
    .locator('[data-test="add-to-cart-sauce-labs-backpack"]')
    .click();

  await page
    .locator('[data-test="add-to-cart-sauce-labs-bike-light"]')
    .click();

  // Check that the cart badge shows 2.
  const cartBadge = page.locator('[data-test="shopping-cart-badge"]');
  await expect(cartBadge).toHaveText('2');

  // Open the cart and check both product names.
  await page.locator('[data-test="shopping-cart-link"]').click();

  const cartItems = page.locator('[data-test="inventory-item"]');
  const productNames = cartItems.locator('[data-test="inventory-item-name"]');

  await expect(cartItems).toHaveCount(2);
  await expect(productNames).toHaveText([
    'Sauce Labs Backpack',
    'Sauce Labs Bike Light',
  ]);

  // Remove the backpack.
  await page
    .locator('[data-test="remove-sauce-labs-backpack"]')
    .click();

  // Check that only the bike light remains.
  await expect(cartItems).toHaveCount(1);
  await expect(productNames).toHaveText(['Sauce Labs Bike Light']);
  await expect(cartBadge).toHaveText('1');
});

test('sort products by price from high to low', async ({ page }) => {
  // Select the "Price (high to low)" option.
  await page
    .locator('[data-test="product-sort-container"]')
    .selectOption('hilo');

  const priceLabels = page.locator('[data-test="inventory-item-price"]');

  // Check that products are displayed before reading their prices.
  await expect(priceLabels).toHaveCount(6);

  // Retry the comparison until the displayed prices are sorted.
  await expect(async () => {
    const priceTexts = await priceLabels.allTextContents();

    // Convert "$29.99" into the number 29.99.
    const actualPrices = priceTexts.map((text) =>
      Number(text.replace('$', '').trim())
    );

    // Sort a copy to calculate the expected order.
    const expectedPrices = [...actualPrices].sort((a, b) => b - a);

    expect(actualPrices).toEqual(expectedPrices);
  }).toPass();
});