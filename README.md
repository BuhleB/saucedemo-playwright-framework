# SauceDemo Playwright Framework

End-to-end test suite for [SauceDemo](https://www.saucedemo.com), a public practice shop, written with Playwright and TypeScript. It uses the Page Object Model and focuses on checking real outcomes (the right products, prices and cart contents) rather than only that a page loaded.

The suite tests the **order flow**: browsing, building a cart, entering customer details, reviewing the order and completing it. SauceDemo has no payment step, so card entry, payment processing and payment failures are **not** tested.

## What is covered

| Area | IDs | What is verified |
| --- | --- | --- |
| Login | AUTH-01 to AUTH-05, AUTH-07 | Successful login; rejection of a wrong password, a locked-out user, and missing username/password |
| Logout and restricted pages | AUTH-06, AUTH-08, AUTH-09 | Logout returns to the login screen; `/inventory.html`, `/cart.html` and `/checkout-step-one.html` are refused without a session and again after logging out |
| Catalogue | CAT-01 to CAT-05 | All four sort orders. Each test confirms the order **and** that the full set of products and prices is unchanged by sorting. CAT-02 checks product details (name and price) |
| Cart | CART-01 to CART-05 | Adding, removing and refreshing, checking product name, price and badge count |
| Checkout order flow | CHK-01 to CHK-07 | Completing an order (item, item total, tax and total arithmetic, confirmation); required-field validation; cart contents after cancelling from either checkout step; empty cart after the order is completed |
| External site | EXT-01, EXT-02 | Browser alert and dynamic-loading examples on `the-internet.herokuapp.com` (not SauceDemo) |

Tests tagged `@smoke` (AUTH-01, CART-01, CHK-01) form a quick end-to-end check. Tests tagged `@external` run against a different website.

## Project structure

```
pages/        Page objects: LoginPage, InventoryPage, CartPage, CheckoutPage
tests/        Specs grouped by feature: login, products, cart, checkout, browser-interactions
playwright.config.ts
.github/workflows/playwright.yml
```

## Setup

Requires Node.js (current LTS).

```bash
npm ci
npx playwright install --with-deps
```

## Running the tests

| Command | What it does |
| --- | --- |
| `npm test` | Whole suite on Chromium, Firefox and WebKit |
| `npm run test:smoke` | Only `@smoke` tests |
| `npm run test:saucedemo` | Everything except `@external` tests |
| `npm run test:chromium` | Whole suite on Chromium only (fastest) |
| `npm run test:headed` | Chromium with a visible browser |
| `npm run test:ui` | Playwright UI mode for debugging |
| `npm run test:list` | List discovered tests without running them |
| `npm run report` | Open the last HTML report |

To run one file or test: `npx playwright test tests/checkout.spec.ts` or `npx playwright test -g "CHK-07"`.

## Reports and failure evidence

- An HTML report is written to `playwright-report/` after every run (`npm run report` opens it).
- On failure, screenshots, videos and traces are kept in `test-results/`. Open a trace with `npx playwright show-trace <path-to-trace.zip>`.
- In CI, the report is uploaded as the `playwright-report` artifact on every run, and traces are uploaded as `failure-traces` when a run fails.

## Continuous integration

`.github/workflows/playwright.yml` runs `npm test` on pushes and pull requests to `main`/`master`, and can be started manually from the Actions tab.

## Latest verified run

| Date | Command | Result | Workflow run | Report |
| --- | --- | --- | --- | --- |
| 2026-10-27 | npm run test:chromium | 32 passed, 0 failed (Chromium, 167.6 s) | [Actions run](https://github.com/BuhleB/saucedemo-playwright-framework/actions/runs/40428718043) | [link to report](https://github.com/BuhleB/saucedemo-playwright-framework/blob/main/reports/2026-10-27-chromium.md) |

## Current limitations

- **Public demo site.** SauceDemo is shared and its data resets. The suite runs with one worker to keep traffic modest, and expected products and prices are those the site shows today.
- **Standard user only.** `problem_user`, `performance_glitch_user` and `error_user` are not covered, and the cart is not tested across logout and login.
- **No payment testing.** Checkout covers customer details, the order overview and confirmation only. Tax is checked for consistency (total = item total + tax), not against an independent rate.
- **Restricted-page message.** AUTH-08/09 assert the site's "You can only access '…' when you are logged in" message, so they need updating if SauceDemo changes that wording.
- **Desktop browsers only.** There are no mobile viewport or accessibility checks, and no API-level tests.
- **Separate external site.** `browser-interactions.spec.ts` targets a different practice site. It is tagged `@external` so it can be excluded with `npm run test:saucedemo`.
