import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
});

test('AUTH-01: standard user can log in @smoke', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.login('standard_user', 'secret_sauce');

  await expect(page).toHaveURL(/\/inventory\.html$/);
  await expect(page.getByTestId('title')).toHaveText('Products');
});

const invalidLogins = [
  {
    name: 'invalid password',
    username: 'standard_user',
    password: 'wrong_password',
    error: 'Username and password do not match',
  },
  {
    name: 'locked-out user',
    username: 'locked_out_user',
    password: 'secret_sauce',
    error: 'Sorry, this user has been locked out.',
  },
  {
    name: 'missing username',
    username: '',
    password: 'secret_sauce',
    error: 'Username is required',
  },
  {
    name: 'missing password',
    username: 'standard_user',
    password: '',
    error: 'Password is required',
  },
    {
    name: 'missing username and password',
    username: '',
    password: '',
    error: 'Username is required',
  },
];

for (const scenario of invalidLogins) {
  test(`Login rejects ${scenario.name}`, async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.login(scenario.username, scenario.password);

    await expect(loginPage.errorMessage).toContainText(scenario.error);
    await expect(page.getByTestId('login-button')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });
}