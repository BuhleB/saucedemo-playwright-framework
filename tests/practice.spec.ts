import { test, expect } from '@playwright/test';

test.describe('SauceDemo practice exercises', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('username').fill('standard_user');
    await page.getByTestId('password').fill('secret_sauce');
    await page.getByTestId('login-button').click();

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.getByTestId('title')).toHaveText('Products');
  });

  test('AUTH-06: log out through the menu', async ({ page }) => {
    await page.getByRole('button', { name: 'Open Menu' }).click();
    await page.getByTestId('logout-sidebar-link').click();

    // Logging out returns the user to the login screen.
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('username')).toBeVisible();
    await expect(page.getByTestId('password')).toBeVisible();
    await expect(page.getByTestId('login-button')).toBeVisible();
  });

  test('CAT-02: open a product’s details', async ({ page }) => {
    await page
      .getByText('Sauce Labs Backpack', { exact: true })
      .click();

    await expect(page).toHaveURL(/\/inventory-item\.html\?id=4$/);

    // Check product identity and price, not just navigation.
    await expect(page.getByTestId('inventory-item-name'))
      .toHaveText('Sauce Labs Backpack');

    await expect(page.getByTestId('inventory-item-price'))
      .toHaveText('$29.99');

    await expect(page.getByTestId('back-to-products')).toBeVisible();
  });

  test('CAT-03: sort prices high to low', async ({ page }) => {
    await page.getByTestId('product-sort-container')
      .selectOption('hilo');

    await expect(page.getByTestId('product-sort-container'))
      .toHaveValue('hilo');

    const priceLabels = page.getByTestId('inventory-item-price');

    // Prevent an empty or incomplete list from passing the sort check.
    await expect(priceLabels).toHaveCount(6);

    await expect.poll(async () => {
      const texts = await priceLabels.allTextContents();
      const prices = texts.map(text =>
        Number(text.replace('$', '').trim())
      );

      const expectedOrder = [...prices].sort((a, b) => b - a);

      return prices.every((price, index) =>
        price === expectedOrder[index]
      );
    }, {
      message: 'Every product price should be in descending order',
    }).toBe(true);
  });

  test('CAT-04: sort names A–Z', async ({ page }) => {
    // Change the initial order first, so A–Z must actually reorder it.
    await page.getByTestId('product-sort-container')
      .selectOption('za');

    await expect(page.getByTestId('inventory-item-name').first())
      .toHaveText('Test.allTheThings() T-Shirt (Red)');

    await page.getByTestId('product-sort-container')
      .selectOption('az');

    await expect(page.getByTestId('product-sort-container'))
      .toHaveValue('az');

    const productNames = page.getByTestId('inventory-item-name');

    await expect(productNames).toHaveCount(6);

    await expect.poll(async () => {
      const names = (await productNames.allTextContents())
        .map(name => name.trim());

      const expectedOrder = [...names]
        .sort((a, b) => a.localeCompare(b));

      return names.every((name, index) =>
        name === expectedOrder[index]
      );
    }, {
      message: 'Every product name should be in alphabetical order',
    }).toBe(true);
  });

  test('CART-03: add two different products', async ({ page }) => {
    await page.getByTestId('add-to-cart-sauce-labs-backpack').click();
    await page.getByTestId('add-to-cart-sauce-labs-bike-light').click();

    await expect(page.getByTestId('shopping-cart-badge'))
      .toHaveText('2');

    await page.getByTestId('shopping-cart-link').click();

    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(page.getByTestId('inventory-item')).toHaveCount(2);

    // Verify the actual products as well as the item count.
    await expect(page.getByTestId('inventory-item-name'))
      .toHaveText([
        'Sauce Labs Backpack',
        'Sauce Labs Bike Light',
      ]);

    await expect(page.getByTestId('shopping-cart-badge'))
      .toHaveText('2');
  });

  test('CART-04: remove one of two products', async ({ page }) => {
    await page.getByTestId('add-to-cart-sauce-labs-backpack').click();
    await page.getByTestId('add-to-cart-sauce-labs-bike-light').click();
    await page.getByTestId('shopping-cart-link').click();

    // Establish the starting state before removing anything.
    await expect(page.getByTestId('inventory-item')).toHaveCount(2);

    await page.getByTestId('remove-sauce-labs-backpack').click();

    await expect(page.getByTestId('inventory-item')).toHaveCount(1);
    await expect(page.getByTestId('inventory-item-name'))
      .toHaveText(['Sauce Labs Bike Light']);

    await expect(
      page.getByText('Sauce Labs Backpack', { exact: true })
    ).toHaveCount(0);

    await expect(page.getByTestId('shopping-cart-badge'))
      .toHaveText('1');
  });

  test('CART-05: refresh the cart page', async ({ page }) => {
    await page.getByTestId('add-to-cart-sauce-labs-backpack').click();
    await page.getByTestId('shopping-cart-link').click();

    await expect(page.getByTestId('inventory-item-name'))
      .toHaveText(['Sauce Labs Backpack']);

    await page.reload();

    // The product and badge must survive a page refresh.
    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(page.getByTestId('inventory-item')).toHaveCount(1);
    await expect(page.getByTestId('inventory-item-name'))
      .toHaveText(['Sauce Labs Backpack']);

    await expect(page.getByTestId('shopping-cart-badge'))
      .toHaveText('1');
  });

  test('CHK-05: cancel from checkout information', async ({ page }) => {
    await page.getByTestId('add-to-cart-sauce-labs-backpack').click();
    await page.getByTestId('shopping-cart-link').click();
    await page.getByTestId('checkout').click();

    await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
    await expect(page.getByTestId('title'))
      .toHaveText('Checkout: Your Information');

    await page.getByTestId('firstName').fill('Buhle');
    await page.getByTestId('lastName').fill('Tester');
    await page.getByTestId('postalCode').fill('6001');

    await page.getByTestId('cancel').click();

    // Cancelling returns to the cart without removing the product.
    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(page.getByTestId('title')).toHaveText('Your Cart');
    await expect(page.getByTestId('inventory-item')).toHaveCount(1);
    await expect(page.getByTestId('inventory-item-name'))
      .toHaveText(['Sauce Labs Backpack']);

    await expect(page.getByTestId('shopping-cart-badge'))
      .toHaveText('1');
  });
});