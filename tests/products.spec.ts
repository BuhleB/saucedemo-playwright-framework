import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage, type Product } from '../pages/InventoryPage';

test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  await expect(page.getByTestId('title')).toHaveText('Products');
});

// Each scenario first switches to the opposite order, so the target sort
// has to genuinely reorder the list (A–Z is the default and would otherwise
// pass without the sort doing anything).
const sortScenarios: {
  id: string;
  label: string;
  value: string;
  opposite: string;
  isOrdered: (products: Product[]) => boolean;
}[] = [
  {
    id: 'CAT-01',
    label: 'price from low to high',
    value: 'lohi',
    opposite: 'hilo',
    isOrdered: p => p.every((x, i) => i === 0 || p[i - 1].price <= x.price),
  },
  {
    id: 'CAT-03',
    label: 'price from high to low',
    value: 'hilo',
    opposite: 'lohi',
    isOrdered: p => p.every((x, i) => i === 0 || p[i - 1].price >= x.price),
  },
  {
    id: 'CAT-04',
    label: 'name A–Z',
    value: 'az',
    opposite: 'za',
    isOrdered: p =>
      p.every((x, i) => i === 0 || p[i - 1].name.localeCompare(x.name) <= 0),
  },
  {
    id: 'CAT-05',
    label: 'name Z–A',
    value: 'za',
    opposite: 'az',
    isOrdered: p =>
      p.every((x, i) => i === 0 || p[i - 1].name.localeCompare(x.name) >= 0),
  },
];

// Order-independent view of the catalogue: one "name|price" key per product.
const asSet = (products: Product[]) =>
  products.map(p => `${p.name}|${p.price}`).sort();

for (const scenario of sortScenarios) {
  test(`${scenario.id}: sorting by ${scenario.label} keeps every product`, async ({ page }) => {
    const inventory = new InventoryPage(page);

    // Baseline: the full catalogue in its default order.
    const original = await inventory.catalog();
    expect(original).toHaveLength(6);

    await inventory.sortBy(scenario.opposite);
    await expect
      .poll(async () => (await inventory.catalog()).length)
      .toBe(original.length);

    await inventory.sortBy(scenario.value);
    await expect(page.getByTestId('product-sort-container'))
      .toHaveValue(scenario.value);

    // Wait for the new ordering to be applied before reading the result.
    await expect
      .poll(async () => scenario.isOrdered(await inventory.catalog()), {
        message: `Products should be sorted by ${scenario.label}`,
      })
      .toBe(true);

    // Sorting must only reorder: same products, same prices, none lost
    // or duplicated.
    const sorted = await inventory.catalog();
    expect(sorted).toHaveLength(original.length);
    expect(asSet(sorted)).toEqual(asSet(original));
  });
}

test('CAT-02: product details show the selected product', async ({ page }) => {
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
