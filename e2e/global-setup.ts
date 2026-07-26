import { chromium } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_TEST_EMAIL ?? `e2e_${Date.now()}@test.com`;
const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "e2ePassword123!";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default async function globalSetup() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/register`);
    await page.getByLabel("Name").fill("E2E Test User");
    await page.getByLabel("Email").fill(E2E_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(E2E_PASSWORD);
    await page.getByLabel("Confirm password").fill(E2E_PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();

    await page.waitForURL(/\/login\?registered=1/, { timeout: 10_000 });
    await page.getByText(/account created\. please sign in\./i).waitFor({ timeout: 10_000 });

    await page.getByLabel("Email").fill(E2E_EMAIL);
    await page.getByLabel("Password").fill(E2E_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 15_000 });

    await context.storageState({
      path: "e2e/.auth/user.json",
    });
    console.log(`E2E auth setup complete: ${E2E_EMAIL}`);
  } finally {
    await browser.close();
  }
}
