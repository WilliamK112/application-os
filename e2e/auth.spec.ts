import { test, expect } from "@playwright/test";

const TEST_EMAIL = `e2e_${Date.now()}@test.com`;
const TEST_PASSWORD = "e2ePassword123!";

test.describe("Auth flows", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test("register → login → access protected page", async ({ page }) => {
    await page.goto("/register");

    await page.getByLabel("Name").fill("E2E Test User");
    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel("Confirm password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/login\?registered=1/, { timeout: 10_000 });
    await expect(page.getByText(/account created\. please sign in\./i)).toBeVisible();

    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("/dashboard", { timeout: 10_000 });
  });

  test("unauthenticated user is redirected to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login(?:\?callbackUrl=)?/, { timeout: 10_000 });
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("wrong@test.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    await expect(page.getByText(/invalid|error|failed/i)).toBeVisible();
  });
});
