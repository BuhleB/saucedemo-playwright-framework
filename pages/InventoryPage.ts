import { type Page } from '@playwright/test';

export type Product = { name: string; price: number };

export class InventoryPage {
  constructor(private readonly page: Page) {}

  product(name: string) {
    return this.page
      .getByTestId('inventory-item')
      .filter({
        has: this.page.getByTestId('inventory-item-name').filter({
          hasText: name,
        }),
      });
  }

  async addProduct(name: string) {
    await this.product(name)
      .getByRole('button', { name: 'Add to cart', exact: true })
      .click();
  }

  async openCart() {
    await this.page.getByTestId('shopping-cart-link').click();
  }

  async sortBy(value: string) {
    await this.page.getByTestId('product-sort-container')
      .selectOption(value);
  }

  // Reads every product's name and price in a single DOM snapshot,
  // so a name can never be paired with another product's price.
  async catalog(): Promise<Product[]> {
    return this.page.getByTestId('inventory-item').evaluateAll(items =>
      items.map(item => ({
        name: item
          .querySelector('[data-test="inventory-item-name"]')!
          .textContent!.trim(),
        price: Number(
          item
            .querySelector('[data-test="inventory-item-price"]')!
            .textContent!.replace('$', '')
        ),
      }))
    );
  }

  async logout() {
    await this.page.getByRole('button', { name: 'Open Menu' }).click();
    await this.page.getByTestId('logout-sidebar-link').click();
  }
}
