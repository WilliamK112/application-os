import { test, expect } from "@playwright/test";

test.describe("Follow-ups page", () => {
  let jobCompany: string;
  let jobTitle: string;

  test.beforeEach(async ({ page }) => {
    // Create a job and application to attach follow-ups to
    await page.goto("/jobs");

    jobCompany = `FollowUpCo_${Date.now()}`;
    jobTitle = "Product Manager";

    await page.locator('input[name="company"]').fill(jobCompany);
    await page.getByLabel("Title").fill(jobTitle);
    await page.getByRole("button", { name: "Create Job" }).click();
    await expect(page.getByRole("cell", { name: jobCompany }).first()).toBeVisible({ timeout: 5000 });

    // Create application
    await page.goto("/applications");
    await expect(page).toHaveURL("/applications");

    const jobSelect = page.locator("select[name='jobId']").first();
    await jobSelect.selectOption({ index: 0 });
    await page.getByRole("button", { name: "Add Application" }).click();
    await expect(page.locator("section, main").getByText(new RegExp(jobCompany, "i")).first()).toBeVisible({ timeout: 5000 });

    // Navigate to follow-ups
    await page.goto("/followups");
    await expect(page).toHaveURL("/followups");
  });

  test("renders follow-ups page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /follow-up/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /new follow-up/i })).toBeVisible();
  });

  test("creates a follow-up", async ({ page }) => {
    // Open create form
    await page.getByRole("button", { name: /new follow-up/i }).click();
    await expect(page.getByText("Select Application")).toBeVisible();

    // Select application
    const appSelect = page.locator("select").filter({ hasText: /choose|select/i }).first();
    await appSelect.selectOption({ index: 1 }); // pick the first real option

    // Fill due date (a future date)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);
    const dueDateValue = tomorrow.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM

    await page.locator('input[type="datetime-local"]').fill(dueDateValue);
    await page.getByLabel(/channel/i).selectOption("Email");
    await page.getByLabel(/action|content/i).fill("Send thank-you email after interview");

    await page.getByRole("button", { name: /add follow-up/i }).click();

    // Should appear in the pending list
    await expect(page.getByText(/thank-you email/i)).toBeVisible({ timeout: 5000 });
  });

  test("marks follow-up as done", async ({ page }) => {
    // Create a follow-up first
    await page.getByRole("button", { name: /new follow-up/i }).click();
    const appSelect = page.locator("select").filter({ hasText: /choose|select/i }).first();
    await appSelect.selectOption({ index: 1 });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.locator('input[type="datetime-local"]').fill(tomorrow.toISOString().slice(0, 16));
    await page.getByLabel(/action|content/i).fill("Follow-up test task");
    await page.getByRole("button", { name: /add follow-up/i }).click();
    await expect(page.getByText("Follow-up test task")).toBeVisible({ timeout: 5000 });

    // Click "Done"
    await page.getByRole("button", { name: /done/i }).first().click();
    await page.waitForTimeout(1000);

    // Should move to completed section
    await expect(page.getByText(/completed \/ skipped/i)).toBeVisible();
  });

  test("skips a follow-up", async ({ page }) => {
    // Create a follow-up
    await page.getByRole("button", { name: /new follow-up/i }).click();
    const appSelect = page.locator("select").filter({ hasText: /choose|select/i }).first();
    await appSelect.selectOption({ index: 1 });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    await page.locator('input[type="datetime-local"]').fill(futureDate.toISOString().slice(0, 16));
    await page.getByLabel(/action|content/i).fill("Skip this follow-up");
    await page.getByRole("button", { name: /add follow-up/i }).click();
    await expect(page.getByText("Skip this follow-up")).toBeVisible({ timeout: 5000 });

    // Click Skip
    await page.getByRole("button", { name: /skip/i }).first().click();
    await page.waitForTimeout(1000);

    // Should be in completed section
    await expect(page.getByText(/completed \/ skipped/i)).toBeVisible();
  });
});
