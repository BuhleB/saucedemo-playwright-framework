import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  await expect(page.getByTestId('title')).toHaveText('Products');
});

test('CART-01: added product appears in cart @smoke', async ({ page }) => {
  const inventory = new InventoryPage(page);

  await inventory.addProduct('Sauce Labs Backpack');

  await expect(page.getByTestId('shopping-cart-badge')).toHaveText('1');

  await inventory.openCart();

  const cartItem = page.getByTestId('inventory-item');

  await expect(cartItem).toHaveCount(1);
  await expect(cartItem.getByTestId('inventory-item-name'))
    .toHaveText('Sauce Labs Backpack');
  await expect(cartItem.getByTestId('inventory-item-price'))
    .toHaveText('$29.99');
});

test('CART-02: removing the only product empties the cart', async ({ page }) => {
  const inventory = new InventoryPage(page);

  await inventory.addProduct('Sauce Labs Backpack');
  await inventory.openCart();

  await page.getByRole('button', { name: 'Remove', exact: true }).click();

  await expect(page.getByTestId('inventory-item')).toHaveCount(0);
  await expect(page.getByTestId('shopping-cart-badge')).toHaveCount(0);
});

test('CAT-01: products sort by price from low to high', async ({ page }) => {
  const inventory = new InventoryPage(page);

  await inventory.sortBy('lohi');

  const priceElements = page.getByTestId('inventory-item-price');

  // Wait for the expected ordering before reading all values.
  await expect(priceElements.first()).toHaveText('$7.99');

  const prices = (await priceElements.allTextContents())
    .map(text => Number(text.replace('$', '')));

  expect(prices.length).toBeGreaterThan(1);
  expect(prices.every(Number.isFinite)).toBe(true);
  expect(prices).toEqual([...prices].sort((a, b) => a - b));
});