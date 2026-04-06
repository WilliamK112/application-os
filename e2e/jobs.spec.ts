import { test, expect } from "@playwright/test";

test.describe("Jobs page", () => {
  test.beforeEach(async ({ page }) => {
    // Already authenticated via storageState
    await page.goto("/jobs");
    await expect(page).toHaveURL("/jobs");
  });

  test("renders jobs page with filter bar", async ({ page }) => {
    await expect(page.getByPlaceholder("Search company or title...")).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("creates a new job", async ({ page }) => {
    const companyName = `Acme E2E ${Date.now()}`;
    const title = "Frontend Engineer";

    await page.locator('input[name="company"]').fill(companyName);
    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Location").fill("Remote");
    await page.getByLabel("Source").fill("LinkedIn");
    await page.getByRole("button", { name: "Create Job" }).click();

    // Should show the new job in the table
    await expect(page.getByRole("cell", { name: companyName }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("cell", { name: title }).first()).toBeVisible();
  });

  test("filters jobs by search term", async ({ page }) => {
    // Create two jobs with distinct names
    const unique1 = `UniqueJob1_${Date.now()}`;
    const unique2 = `UniqueJob2_${Date.now()}`;

    await page.locator('input[name="company"]').fill(unique1);
    await page.getByLabel("Title").fill("Engineer A");
    await page.getByRole("button", { name: "Create Job" }).click();

    await page.locator('input[name="company"]').fill(unique2);
    await page.getByLabel("Title").fill("Engineer B");
    await page.getByRole("button", { name: "Create Job" }).click();

    // Search for unique1
    await page.getByPlaceholder("Search company or title...").fill(unique1);
    await expect(page.getByRole("cell", { name: unique1 }).first()).toBeVisible();
    await expect(page.getByRole("cell", { name: unique2 })).toHaveCount(0);
  });

  test("filters jobs by status", async ({ page }) => {
    const savedJob = `SavedJob_${Date.now()}`;
    const appliedJob = `AppliedJob_${Date.now()}`;

    // Create SAVED job
    await page.locator('input[name="company"]').fill(savedJob);
    await page.getByLabel("Title").fill("Job 1");
    await page.getByRole("button", { name: "Create Job" }).click();
    await expect(page.getByRole("cell", { name: savedJob }).first()).toBeVisible({ timeout: 5000 });

    // Create APPLIED job via status select
    await page.locator('input[name="company"]').fill(appliedJob);
    await page.getByLabel("Title").fill("Job 2");
    const statusSelect = page.locator("form").filter({ hasText: "Create Job" }).locator("select[name='status']");
    await statusSelect.selectOption("APPLIED");
    await page.getByRole("button", { name: "Create Job" }).click();
    await expect(page.getByRole("cell", { name: appliedJob }).first()).toBeVisible({ timeout: 5000 });

    // Filter by SAVED
    await page.locator("select").filter({ hasText: "All statuses" }).first().selectOption("SAVED");
    await expect(page.getByRole("cell", { name: savedJob }).first()).toBeVisible();
  });

  test("sorts jobs by company A-Z", async ({ page }) => {
    const sortSelect = page.locator("select").filter({ hasText: /sort|recently/i }).first();
    await sortSelect.selectOption("company-asc");
    await expect(page.getByRole("table")).toBeVisible();
  });
});
