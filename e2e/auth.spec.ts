import { test, expect } from "@playwright/test";

const TEST_EMAIL = `e2e_${Date.now()}@test.com`;
const TEST_PASSWORD = "e2ePassword123!";

test.describe("Auth flows", () => {
  test("register → login → access protected page", async ({ page }) => {
    await page.goto("/register");

    // Register
    await page.locator("#name").fill("E2E Test User");
    await page.locator("#email").fill(TEST_EMAIL);
    await page.locator("#password").fill(TEST_PASSWORD);
    await page.locator("#confirmPassword").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard", { timeout: 10_000 });
  });

  test("unauthenticated user is redirected to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?callbackUrl=/);
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill("wrong@test.com");
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should stay on login page with error
    await expect(page).toHaveURL("/login");
    await expect(page.getByText(/invalid|error|failed/i)).toBeVisible();
  });
});
