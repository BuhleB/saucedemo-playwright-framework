import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CheckoutPage } from '../pages/CheckoutPage';

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

test('CHK-01: customer completes an order @smoke', async ({ page }) => {
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
    name: 'first name',
    firstName: '',
    lastName: 'Tester',
    postalCode: '6001',
    error: 'First Name is required',
  },
  {
    name: 'last name',
    firstName: 'Buhle',
    lastName: '',
    postalCode: '6001',
    error: 'Last Name is required',
  },
  {
    name: 'postal code',
    firstName: 'Buhle',
    lastName: 'Tester',
    postalCode: '',
    error: 'Postal Code is required',
  },
];

for (const scenario of missingDetails) {
  test(`Checkout requires ${scenario.name}`, async ({ page }) => {
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