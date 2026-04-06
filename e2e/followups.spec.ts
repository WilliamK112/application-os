import { test, expect } from "@playwright/test";

test.describe("Follow-ups page", () => {
  let jobCompany: string;
  let jobTitle: string;

  test.beforeEach(async ({ page }) => {
    await page.goto("/jobs");

    jobCompany = `FollowUpCo_${Date.now()}`;
    jobTitle = "Product Manager";

    await page.locator('input[name="company"]').fill(jobCompany);
    await page.getByLabel("Title").fill(jobTitle);
    await page.getByRole("button", { name: "Create Job" }).click();
    await expect(page.getByRole("cell", { name: jobCompany }).first()).toBeVisible({ timeout: 5000 });

    await page.goto("/applications");
    await expect(page).toHaveURL("/applications");

    const jobSelect = page.locator("select[name='jobId']").first();
    await jobSelect.selectOption({ index: 1 });
    await page.getByRole("button", { name: "Create Application" }).click();
    await page.getByPlaceholder("Search...").fill(jobCompany);
    await expect(page.getByText(new RegExp(jobCompany, "i"))).toHaveCount(1, { timeout: 5000 });

    await page.goto("/followups");
    await expect(page).toHaveURL("/followups");
  });

  test("renders follow-ups page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Pending Follow-ups" })).toBeVisible();
    await expect(page.getByRole("button", { name: /new follow-up/i })).toBeVisible();
  });

  test("creates a follow-up", async ({ page }) => {
    await page.getByRole("button", { name: /new follow-up/i }).click();
    await expect(page.getByText("Select Application")).toBeVisible();

    const appSelect = page.locator("select").filter({ hasText: /choose|select/i }).first();
    await appSelect.selectOption({ index: 1 });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);
    const dueDateValue = tomorrow.toISOString().slice(0, 16);

    await page.locator('input[type="datetime-local"]').fill(dueDateValue);
    await page.getByLabel(/channel/i).selectOption("Email");
    await page.getByLabel(/action|content/i).fill("Send thank-you email after interview");

    await page.getByRole("button", { name: /add follow-up/i }).click();
    await expect(page.getByText(/thank-you email/i)).toBeVisible({ timeout: 5000 });
  });

  test("marks follow-up as done", async ({ page }) => {
    await page.getByRole("button", { name: /new follow-up/i }).click();
    const appSelect = page.locator("select").filter({ hasText: /choose|select/i }).first();
    await appSelect.selectOption({ index: 1 });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.locator('input[type="datetime-local"]').fill(tomorrow.toISOString().slice(0, 16));
    await page.getByLabel(/action|content/i).fill("Follow-up test task");
    await page.getByRole("button", { name: /add follow-up/i }).click();
    await expect(page.getByText("Follow-up test task")).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: /done/i }).first().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(/completed \/ skipped/i)).toBeVisible();
  });

  test("skips a follow-up", async ({ page }) => {
    await page.getByRole("button", { name: /new follow-up/i }).click();
    const appSelect = page.locator("select").filter({ hasText: /choose|select/i }).first();
    await appSelect.selectOption({ index: 1 });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    await page.locator('input[type="datetime-local"]').fill(futureDate.toISOString().slice(0, 16));
    await page.getByLabel(/action|content/i).fill("Skip this follow-up");
    await page.getByRole("button", { name: /add follow-up/i }).click();
    await expect(page.getByText("Skip this follow-up")).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: /skip/i }).first().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(/completed \/ skipped/i)).toBeVisible();
  });
});
