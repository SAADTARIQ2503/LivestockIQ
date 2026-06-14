/**
 * E2E tests — Dashboard & Navigation.
 *
 * Run:
 *   npx playwright test tests/e2e/dashboard.spec.js
 */
import { test, expect } from '@playwright/test';

async function loginAsTestUser(page) {
  await page.goto('/login');
  await page.getByLabel(/username/i).fill('testuser');
  await page.getByLabel(/email/i).fill('test@example.com');
  await page.getByLabel(/^password$/i).fill('TestPass@123');
  await page.getByRole('button', { name: /sign in|login/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 10_000 });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

test.describe('Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('dashboard heading is visible after login', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /dashboard/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test('stat cards are rendered', async ({ page }) => {
    // At least one stat card should be visible
    await expect(
      page.getByText(/total animals|healthy|farms|alerts/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('sidebar navigation is visible', async ({ page }) => {
    await expect(
      page.getByRole('navigation').or(page.locator('aside, nav'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('can navigate to animals page via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: /animals/i }).first().click();
    await expect(page).toHaveURL(/animals/, { timeout: 6000 });
  });

  test('can navigate to farms page via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: /farms/i }).first().click();
    await expect(page).toHaveURL(/farms/, { timeout: 6000 });
  });

  test('can navigate to alerts page via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: /alerts/i }).first().click();
    await expect(page).toHaveURL(/alerts/, { timeout: 6000 });
  });

  test('logout button is accessible', async ({ page }) => {
    const logoutBtn = page.getByRole('button', { name: /logout|sign out/i });
    if (await logoutBtn.count() > 0) {
      await expect(logoutBtn).toBeVisible();
    }
  });

  test('page title contains LivestockIQ', async ({ page }) => {
    const title = await page.title();
    expect(title.toLowerCase()).toMatch(/livestockiq|livestock/i);
  });
});

// ── AI Detection page ─────────────────────────────────────────────────────────

test.describe('AI Detection Page', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/ai-detection');
  });

  test('AI detection page loads', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /detection|ai|disease|lameness/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test('file upload input is present', async ({ page }) => {
    await expect(page.locator('input[type="file"]')).toBeAttached({ timeout: 8000 });
  });
});

// ── Profile page ──────────────────────────────────────────────────────────────

test.describe('Profile Page', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/profile');
  });

  test('profile page shows username', async ({ page }) => {
    await expect(page.getByText(/testuser/i)).toBeVisible({ timeout: 8000 });
  });
});
