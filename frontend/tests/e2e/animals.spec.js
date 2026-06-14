/**
 * E2E tests — Animals management flows.
 *
 * Requires an authenticated session. The loginAsTestUser fixture logs in
 * using the API before each test so tests start on an authenticated page.
 *
 * Run:
 *   npx playwright test tests/e2e/animals.spec.js
 */
import { test, expect } from '@playwright/test';

// ── Auth helper ───────────────────────────────────────────────────────────────

async function loginAsTestUser(page) {
  await page.goto('/login');
  await page.getByLabel(/username/i).fill('testuser');
  await page.getByLabel(/email/i).fill('test@example.com');
  await page.getByLabel(/^password$/i).fill('TestPass@123');
  await page.getByRole('button', { name: /sign in|login/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 10_000 });
}

// ── Animals list ──────────────────────────────────────────────────────────────

test.describe('Animals List', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/animals');
  });

  test('page title or heading is visible', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /animals|livestock/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test('add animal button is visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /add animal|new animal/i }).or(
        page.getByRole('link', { name: /add animal|new animal/i })
      )
    ).toBeVisible({ timeout: 8000 });
  });

  test('search input is present', async ({ page }) => {
    await expect(page.getByPlaceholder(/search/i)).toBeVisible({ timeout: 8000 });
  });
});

// ── Add animal ────────────────────────────────────────────────────────────────

test.describe('Add Animal', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/animals/add');
  });

  test('add animal form is visible', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /add animal|new animal/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test('animal type field is present', async ({ page }) => {
    await expect(
      page.getByLabel(/animal type/i).or(page.getByRole('combobox', { name: /type/i }))
    ).toBeVisible({ timeout: 8000 });
  });

  test('sex field is present', async ({ page }) => {
    await expect(
      page.getByLabel(/sex|gender/i).or(page.getByRole('combobox', { name: /sex|gender/i }))
    ).toBeVisible({ timeout: 8000 });
  });

  test('shows validation error when form submitted empty', async ({ page }) => {
    await page.getByRole('button', { name: /save|add|submit|create/i }).click();
    await expect(page.getByText(/required|field is required/i)).toBeVisible({ timeout: 6000 });
  });
});

// ── Animal detail ─────────────────────────────────────────────────────────────

test.describe('Animal Detail', () => {

  test('navigating to a specific animal shows detail page', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/animals');
    // Click first animal link if animals exist
    const firstLink = page.getByRole('link', { name: /view|details|#/i }).first();
    if (await firstLink.count() > 0) {
      await firstLink.click();
      await expect(page.getByText(/animal type|cow|goat|sheep/i)).toBeVisible({ timeout: 8000 });
    } else {
      // Skip if no animals exist in test environment
      test.skip();
    }
  });
});
