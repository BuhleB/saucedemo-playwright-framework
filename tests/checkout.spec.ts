import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { CartPage } from '../pages/CartPage';

test.beforeEach(async ({ page }) => {
  const login = new LoginPage(page);
  const inventory = new InventoryPage(page);

  await login.goto();
  await login.login('standard_user', 'secret_sauce');
  await expect(page.getByTestId('title')).toHaveText('Products');

  await inventory.addProduct('Sauce Labs Backpack');
  await inventory.openCart();

  await page.getByRole('button', { name: 'Checkout', exact: true }).click();
  await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
});

test('CHK-01: customer completes the order flow @smoke', async ({ page }) => {
  const checkout = new CheckoutPage(page);

  await checkout.enterDetails('Buhle', 'Tester', '6001');
  await checkout.continue();

  await expect(page).toHaveURL(/\/checkout-step-two\.html$/);

  const orderItem = page.getByTestId('inventory-item');

  await expect(orderItem).toHaveCount(1);
  await expect(orderItem.getByTestId('inventory-item-name'))
    .toHaveText('Sauce Labs Backpack');

  await expect(page.getByTestId('subtotal-label'))
    .toHaveText('Item total: $29.99');

  const money = (text: string) =>
    Number(text.replace(/[^0-9.]/g, ''));

  const subtotal = money(
    await page.getByTestId('subtotal-label').innerText()
  );
  const tax = money(
    await page.getByTestId('tax-label').innerText()
  );
  const total = money(
    await page.getByTestId('total-label').innerText()
  );

  expect(Number.isFinite(tax)).toBe(true);
  expect(tax).toBeGreaterThanOrEqual(0);
  expect(total).toBeCloseTo(subtotal + tax, 2);

  await checkout.finish();

  await expect(page).toHaveURL(/\/checkout-complete\.html$/);
  await expect(page.getByTestId('complete-header'))
    .toHaveText('Thank you for your order!');
});

const missingDetails = [
  {
    id: 'CHK-02',
    name: 'first name',
    firstName: '',
    lastName: 'Tester',
    postalCode: '6001',
    error: 'First Name is required',
  },
  {
    id: 'CHK-03',
    name: 'last name',
    firstName: 'Buhle',
    lastName: '',
    postalCode: '6001',
    error: 'Last Name is required',
  },
  {
    id: 'CHK-04',
    name: 'postal code',
    firstName: 'Buhle',
    lastName: 'Tester',
    postalCode: '',
    error: 'Postal Code is required',
  },
];

for (const scenario of missingDetails) {
  test(`${scenario.id}: checkout requires ${scenario.name}`, async ({ page }) => {
    const checkout = new CheckoutPage(page);

    await checkout.enterDetails(
      scenario.firstName,
      scenario.lastName,
      scenario.postalCode
    );

    await checkout.continue();

    await expect(page.getByTestId('error'))
      .toContainText(scenario.error);

    await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
  });
}
test('CHK-05: cancelling from your information returns to the cart with the product intact', async ({ page }) => {
  const checkout = new CheckoutPage(page);
  const cart = new CartPage(page);

  await expect(page.getByTestId('title'))
    .toHaveText('Checkout: Your Information');

  // Partly filled details must not stop the cancel.
  await checkout.enterDetails('Buhle', 'Tester', '6001');
  await checkout.cancel();

  await expect(page).toHaveURL(/\/cart\.html$/);
  await expect(page.getByTestId('title')).toHaveText('Your Cart');
  await expect(cart.items).toHaveCount(1);
  await expect(cart.itemNames).toHaveText(['Sauce Labs Backpack']);
  await expect(cart.itemPrices).toHaveText(['$29.99']);
  await expect(cart.badge).toHaveText('1');
});

test('CHK-06: cancelling from the order overview keeps the product in the cart', async ({ page }) => {
  const checkout = new CheckoutPage(page);
  const inventory = new InventoryPage(page);
  const cart = new CartPage(page);

  await checkout.enterDetails('Buhle', 'Tester', '6001');
  await checkout.continue();
  await expect(page).toHaveURL(/\/checkout-step-two\.html$/);

  await checkout.cancel();

  // Cancelling from the overview returns to the product list.
  await expect(page).toHaveURL(/\/inventory\.html$/);
  await expect(cart.badge).toHaveText('1');
  await expect(
    inventory.product('Sauce Labs Backpack')
      .getByRole('button', { name: 'Remove', exact: true })
  ).toBeVisible();

  await inventory.openCart();

  await expect(cart.items).toHaveCount(1);
  await expect(cart.itemNames).toHaveText(['Sauce Labs Backpack']);
});

test('CHK-07: cart is empty after the order is completed', async ({ page }) => {
  const checkout = new CheckoutPage(page);
  const inventory = new InventoryPage(page);
  const cart = new CartPage(page);

  await checkout.enterDetails('Buhle', 'Tester', '6001');
  await checkout.continue();
  await checkout.finish();

  await expect(page).toHaveURL(/\/checkout-complete\.html$/);
  await expect(cart.badge).toHaveCount(0);

  await checkout.backHome();

  await expect(page).toHaveURL(/\/inventory\.html$/);
  await expect(cart.badge).toHaveCount(0);
  await expect(
    inventory.product('Sauce Labs Backpack')
      .getByRole('button', { name: 'Add to cart', exact: true })
  ).toBeVisible();

  await inventory.openCart();

  await expect(page).toHaveURL(/\/cart\.html$/);
  await expect(cart.items).toHaveCount(0);
});
