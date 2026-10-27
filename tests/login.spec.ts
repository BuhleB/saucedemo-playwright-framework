import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

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
    id: 'AUTH-02',
    name: 'invalid password',
    username: 'standard_user',
    password: 'wrong_password',
    error: 'Username and password do not match',
  },
  {
    id: 'AUTH-03',
    name: 'locked-out user',
    username: 'locked_out_user',
    password: 'secret_sauce',
    error: 'Sorry, this user has been locked out.',
  },
  {
    id: 'AUTH-04',
    name: 'missing username',
    username: '',
    password: 'secret_sauce',
    error: 'Username is required',
  },
  {
    id: 'AUTH-05',
    name: 'missing password',
    username: 'standard_user',
    password: '',
    error: 'Password is required',
  },
  {
    id: 'AUTH-07',
    name: 'missing username and password',
    username: '',
    password: '',
    error: 'Username is required',
  },
];

for (const scenario of invalidLogins) {
  test(`${scenario.id}: login rejects ${scenario.name}`, async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.login(scenario.username, scenario.password);

    await expect(loginPage.errorMessage).toContainText(scenario.error);
    await expect(page.getByTestId('login-button')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });
}
test('AUTH-06: user can log out through the menu', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const inventory = new InventoryPage(page);

  await loginPage.login('standard_user', 'secret_sauce');
  await expect(page.getByTestId('title')).toHaveText('Products');

  await inventory.logout();

  // Logging out returns the user to the login screen.
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('username')).toBeVisible();
  await expect(page.getByTestId('password')).toBeVisible();
  await expect(page.getByTestId('login-button')).toBeVisible();
});

const restrictedPages = [
  '/inventory.html',
  '/cart.html',
  '/checkout-step-one.html',
];

for (const path of restrictedPages) {
  test(`AUTH-08: ${path} cannot be opened without logging in`, async ({ page }) => {
    const loginPage = new LoginPage(page);

    await page.goto(path);

    await expect(page).toHaveURL(/\/$/);
    await expect(loginPage.errorMessage).toContainText(
      `You can only access '${path}' when you are logged in`
    );
    await expect(page.getByTestId('login-button')).toBeVisible();
  });

  test(`AUTH-09: ${path} is blocked again after logging out`, async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);

    await loginPage.login('standard_user', 'secret_sauce');
    await expect(page.getByTestId('title')).toHaveText('Products');

    // Prove the page is reachable while logged in, so the later block
    // is caused by logging out and not by a bad path.
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`${path.replace('.', '\\.')}$`));

    await inventory.logout();
    await expect(page.getByTestId('login-button')).toBeVisible();

    await page.goto(path);

    await expect(page).toHaveURL(/\/$/);
    await expect(loginPage.errorMessage).toContainText(
      `You can only access '${path}' when you are logged in`
    );
    await expect(page.getByTestId('login-button')).toBeVisible();
  });
}
