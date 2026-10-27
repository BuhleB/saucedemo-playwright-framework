import { type Page } from '@playwright/test';

export class CartPage {
  constructor(private readonly page: Page) {}

  get items() {
    return this.page.getByTestId('inventory-item');
  }

  get itemNames() {
    return this.page.getByTestId('inventory-item-name');
  }

  get itemPrices() {
    return this.page.getByTestId('inventory-item-price');
  }

  // The badge lives in the header, so it is visible on every logged-in page.
  get badge() {
    return this.page.getByTestId('shopping-cart-badge');
  }

  async remove(name: string) {
    await this.items
      .filter({
        has: this.itemNames.filter({ hasText: name }),
      })
      .getByRole('button', { name: 'Remove', exact: true })
      .click();
  }

  async checkout() {
    await this.page
      .getByRole('button', { name: 'Checkout', exact: true })
      .click();
  }
}
