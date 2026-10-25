import { type Page } from '@playwright/test';

export class CheckoutPage {
  constructor(private readonly page: Page) {}

  async enterDetails(
    firstName: string,
    lastName: string,
    postalCode: string
  ) {
    await this.page.getByTestId('firstName').fill(firstName);
    await this.page.getByTestId('lastName').fill(lastName);
    await this.page.getByTestId('postalCode').fill(postalCode);
  }

  async continue() {
    await this.page
      .getByRole('button', { name: 'Continue', exact: true })
      .click();
  }

  async finish() {
    await this.page
      .getByRole('button', { name: 'Finish', exact: true })
      .click();
  }
}