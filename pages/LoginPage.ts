import { type Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async login(username: string, password: string) {
    await this.page.getByTestId('username').fill(username);
    await this.page.getByTestId('password').fill(password);

    await this.page
      .getByRole('button', { name: 'Login', exact: true })
      .click();
  }

  get errorMessage() {
    return this.page.getByTestId('error');
  }
}