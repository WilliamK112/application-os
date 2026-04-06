import { test, expect } from "@playwright/test";

test.describe("Jobs page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/jobs");
    await expect(page).toHaveURL("/jobs");
  });

  async function createJob(page: Parameters<typeof test.beforeEach>[0]["page"], company: string, title: string, status = "SAVED") {
    await page.locator('input[name="company"]').fill(company);
    await page.locator('input[name="title"]').fill(title);
    await page.locator('input[name="location"]').fill("Remote");
    await page.locator('input[name="source"]').fill("LinkedIn");
    await page.locator('select[name="status"]').first().selectOption(status);
    await page.getByRole("button", { name: "Create Job" }).click();
    await expect(page.getByRole("cell", { name: new RegExp(company, "i") }).first()).toBeVisible({ timeout: 5000 });
  }

  test("renders jobs page with filter bar", async ({ page }) => {
    await expect(page.getByRole("searchbox", { name: /search/i })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("creates a new job", async ({ page }) => {
    const companyName = `Acme E2E ${Date.now()}`;
    const title = "Frontend Engineer";

    await createJob(page, companyName, title);
    await expect(page.getByRole("cell", { name: new RegExp(companyName, "i") }).first()).toBeVisible();
    await expect(page.getByRole("cell", { name: new RegExp(title, "i") }).first()).toBeVisible();
  });

  test("filters jobs by search term", async ({ page }) => {
    const unique1 = `UniqueJob1_${Date.now()}`;
    const unique2 = `UniqueJob2_${Date.now()}`;

    await createJob(page, unique1, "Engineer A");
    await createJob(page, unique2, "Engineer B");

    await page.getByRole("searchbox", { name: /search/i }).fill(unique1);
    await expect(page.getByRole("cell", { name: new RegExp(unique1, "i") }).first()).toBeVisible();
    await expect(page.getByRole("cell", { name: new RegExp(unique2, "i") }).first()).toHaveCount(0);
  });

  test("filters jobs by status", async ({ page }) => {
    const savedJob = `SavedJob_${Date.now()}`;
    const appliedJob = `AppliedJob_${Date.now()}`;

    await createJob(page, savedJob, "Job 1", "SAVED");
    await createJob(page, appliedJob, "Job 2", "APPLIED");

    const filterBar = page.getByRole("searchbox", { name: /search/i }).locator("..");
    const statusFilter = filterBar.locator("select").first();
    await statusFilter.selectOption("SAVED");

    await expect(page.getByRole("cell", { name: new RegExp(savedJob, "i") }).first()).toBeVisible();
    await expect(page.getByRole("cell", { name: new RegExp(appliedJob, "i") })).toHaveCount(0);
  });

  test("sorts jobs by company A-Z", async ({ page }) => {
    const filterBar = page.getByRole("searchbox", { name: /search/i }).locator("..");
    const sortSelect = filterBar.locator("select").nth(1);
    await sortSelect.selectOption("company-asc");
    await expect(page.getByRole("table")).toBeVisible();
  });
});
