import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';

test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  await expect(page.getByTestId('title')).toHaveText('Products');
});

test('CART-01: added product appears in cart @smoke', async ({ page }) => {
  const inventory = new InventoryPage(page);
  const cart = new CartPage(page);

  await inventory.addProduct('Sauce Labs Backpack');

  await expect(cart.badge).toHaveText('1');

  await inventory.openCart();

  await expect(cart.items).toHaveCount(1);
  await expect(cart.itemNames).toHaveText(['Sauce Labs Backpack']);
  await expect(cart.itemPrices).toHaveText(['$29.99']);
});

test('CART-02: removing the only product empties the cart', async ({ page }) => {
  const inventory = new InventoryPage(page);
  const cart = new CartPage(page);

  await inventory.addProduct('Sauce Labs Backpack');
  await inventory.openCart();

  await cart.remove('Sauce Labs Backpack');

  await expect(cart.items).toHaveCount(0);
  await expect(cart.badge).toHaveCount(0);
});

test('CART-03: adding two different products lists both with their prices', async ({ page }) => {
  const inventory = new InventoryPage(page);
  const cart = new CartPage(page);

  await inventory.addProduct('Sauce Labs Backpack');
  await inventory.addProduct('Sauce Labs Bike Light');

  await expect(cart.badge).toHaveText('2');

  await inventory.openCart();

  await expect(page).toHaveURL(/\/cart\.html$/);
  await expect(cart.items).toHaveCount(2);

  // Verify the actual products and prices as well as the item count.
  await expect(cart.itemNames).toHaveText([
    'Sauce Labs Backpack',
    'Sauce Labs Bike Light',
  ]);
  await expect(cart.itemPrices).toHaveText(['$29.99', '$9.99']);
  await expect(cart.badge).toHaveText('2');
});

test('CART-04: removing one of two products keeps the other', async ({ page }) => {
  const inventory = new InventoryPage(page);
  const cart = new CartPage(page);

  await inventory.addProduct('Sauce Labs Backpack');
  await inventory.addProduct('Sauce Labs Bike Light');
  await inventory.openCart();

  // Establish the starting state before removing anything.
  await expect(cart.items).toHaveCount(2);

  await cart.remove('Sauce Labs Backpack');

  await expect(cart.items).toHaveCount(1);
  await expect(cart.itemNames).toHaveText(['Sauce Labs Bike Light']);
  await expect(cart.itemPrices).toHaveText(['$9.99']);
  await expect(cart.badge).toHaveText('1');
});

test('CART-05: cart contents survive a page refresh', async ({ page }) => {
  const inventory = new InventoryPage(page);
  const cart = new CartPage(page);

  await inventory.addProduct('Sauce Labs Backpack');
  await inventory.openCart();

  await expect(cart.itemNames).toHaveText(['Sauce Labs Backpack']);

  await page.reload();

  // The product and badge must survive a page refresh.
  await expect(page).toHaveURL(/\/cart\.html$/);
  await expect(cart.items).toHaveCount(1);
  await expect(cart.itemNames).toHaveText(['Sauce Labs Backpack']);
  await expect(cart.itemPrices).toHaveText(['$29.99']);
  await expect(cart.badge).toHaveText('1');
});
