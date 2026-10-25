import { type Page } from '@playwright/test';

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
}