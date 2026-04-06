import { test, expect } from "@playwright/test";

const TEST_EMAIL = `e2e_${Date.now()}@test.com`;
const TEST_PASSWORD = "e2ePassword123!";

test.describe("Auth flows", () => {
  test("register → login → access protected page", async ({ page }) => {
    await page.goto("/register");

    await page.locator("#name").fill("E2E Test User");
    await page.locator("#email").fill(TEST_EMAIL);
    await page.locator("#password").fill(TEST_PASSWORD);
    await page.locator("#confirmPassword").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/login\?registered=1/, { timeout: 10_000 });

    await page.locator("#email").fill(TEST_EMAIL);
    await page.locator("#password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("/dashboard", { timeout: 15_000 });
  });

  test("unauthenticated user is redirected to login page", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill("wrong@test.com");
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    await expect(page.getByText(/invalid|error|failed/i)).toBeVisible();
  });
});
