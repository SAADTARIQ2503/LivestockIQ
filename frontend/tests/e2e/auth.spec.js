/**
 * E2E tests — Authentication flows (Login & Registration).
 *
 * Requires the Django backend running at http://localhost:8000
 * and the Vite frontend at http://localhost:5173.
 *
 * Run:
 *   npx playwright test tests/e2e/auth.spec.js
 */
import { test, expect } from '@playwright/test';

const TEST_USER = {
  username: 'e2e_testuser',
  email: 'e2e@example.com',
  password: 'E2ePass@123',
};

// ── Login page ────────────────────────────────────────────────────────────────

test.describe('Login Page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('shows login form with username, email, and password fields', async ({ page }) => {
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
  });

  test('shows error on empty form submission', async ({ page }) => {
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page.getByText(/required|field is required|cannot be blank/i)).toBeVisible();
  });

  test('shows error message for invalid credentials', async ({ page }) => {
    await page.getByLabel(/username/i).fill('wronguser');
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('WrongPass@1');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page.getByText(/invalid|incorrect|does not exist/i)).toBeVisible({ timeout: 8000 });
  });

  test('navigates to register page when register link clicked', async ({ page }) => {
    await page.getByRole('link', { name: /register|sign up|create account/i }).click();
    await expect(page).toHaveURL(/register/);
  });
});

// ── Registration page ─────────────────────────────────────────────────────────

test.describe('Registration Page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('shows registration form with all required fields', async ({ page }) => {
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
  });

  test('shows validation error for password without uppercase', async ({ page }) => {
    await page.getByLabel(/username/i).fill('newuser1');
    await page.getByLabel(/email/i).fill('newuser@example.com');
    await page.getByLabel(/first name/i).fill('New');
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/^password$/i).fill('lowercase@1');
    await page.getByLabel(/confirm password/i).fill('lowercase@1');
    await page.getByRole('button', { name: /register|sign up/i }).click();
    await expect(page.getByText(/uppercase/i)).toBeVisible({ timeout: 6000 });
  });

  test('shows validation error for mismatched passwords', async ({ page }) => {
    await page.getByLabel(/username/i).fill('newuser1');
    await page.getByLabel(/email/i).fill('newuser@example.com');
    await page.getByLabel(/first name/i).fill('New');
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/^password$/i).fill('ValidPass@1');
    await page.getByLabel(/confirm password/i).fill('Different@2');
    await page.getByRole('button', { name: /register|sign up/i }).click();
    await expect(page.getByText(/do not match|mismatch/i)).toBeVisible({ timeout: 6000 });
  });

  test('navigates to login page when sign in link clicked', async ({ page }) => {
    await page.getByRole('link', { name: /sign in|login|already have/i }).click();
    await expect(page).toHaveURL(/login/);
  });
});

// ── Protected route redirect ───────────────────────────────────────────────────

test.describe('Protected routes', () => {

  test('unauthenticated user is redirected to login from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/, { timeout: 6000 });
  });

  test('unauthenticated user is redirected to login from animals page', async ({ page }) => {
    await page.goto('/animals');
    await expect(page).toHaveURL(/login/, { timeout: 6000 });
  });
});
