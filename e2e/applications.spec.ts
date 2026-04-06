import { test, expect } from "@playwright/test";

test.describe("Applications page", () => {
  let companyName: string;

  test.beforeEach(async ({ page }) => {
    await page.goto("/jobs");

    companyName = `AppTestCo_${Date.now()}`;
    await page.locator('input[name="company"]').fill(companyName);
    await page.getByLabel("Title").fill("Test Engineer");
    await page.getByRole("button", { name: "Create Job" }).click();
    await expect(page.getByRole("cell", { name: companyName }).first()).toBeVisible({ timeout: 5000 });

    await page.goto("/applications");
    await expect(page).toHaveURL("/applications");
  });

  test("renders applications page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /applications/i }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /add application/i })).toBeVisible();
    await expect(page.getByPlaceholder("Search...")).toBeVisible();
  });

  test("creates an application", async ({ page }) => {
    const jobSelect = page.locator("select[name='jobId']").first();
    await expect(jobSelect).toBeVisible();

    await jobSelect.selectOption({ index: 1 });
    await page.getByRole("button", { name: "Create Application" }).click();

    await page.getByPlaceholder("Search...").fill(companyName);
    await expect(page.getByText(new RegExp(companyName, "i"))).toHaveCount(1, { timeout: 5000 });
  });

  test("updates application status", async ({ page }) => {
    const jobSelect = page.locator("select[name='jobId']").first();
    await jobSelect.selectOption({ index: 1 });
    await page.getByRole("button", { name: "Create Application" }).click();
    await page.waitForTimeout(1000);

    const statusSelect = page.locator("select[name='status']").first();
    await statusSelect.selectOption("INTERVIEW");

    const saveButton = page.locator("button[type='submit']").filter({ hasText: "Save" }).first();
    await saveButton.click();

    await page.locator("select[name='status']").first().waitFor({ state: "visible" });
    await expect(page.locator("select[name='status']").first()).toHaveValue("INTERVIEW");
  });
});
