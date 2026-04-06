import { test, expect } from "@playwright/test";

test.describe("Applications page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/jobs");

    // Create a job to apply to (shared setup)
    const companyName = `AppTestCo_${Date.now()}`;
    await page.locator('input[name="company"]').fill(companyName);
    await page.getByLabel("Title").fill("Test Engineer");
    await page.getByRole("button", { name: "Create Job" }).click();
    await expect(page.getByRole("cell", { name: companyName }).first()).toBeVisible({ timeout: 5000 });

    // Navigate to applications
    await page.goto("/applications");
    await expect(page).toHaveURL("/applications");
  });

  test("renders applications page", async ({ page }) => {
    await expect(page.getByPlaceholder("Search company or title...")).toBeVisible();
    await expect(page.getByText("Add Application")).toBeVisible();
  });

  test("creates an application", async ({ page }) => {
    // Select the first available job
    const jobSelect = page.locator("select[name='jobId']").first();
    await expect(jobSelect).toBeVisible();

    const selectedOption = await jobSelect.inputValue();
    expect(selectedOption).toBeTruthy();

    await page.getByRole("button", { name: "Add Application" }).click();

    // Should show the application card
    await expect(page.getByText(/AppTestCo/i)).toBeVisible({ timeout: 5000 });
  });

  test("updates application status", async ({ page }) => {
    // First create an application
    const jobSelect = page.locator("select[name='jobId']").first();
    await jobSelect.selectOption({ index: 0 });
    await page.getByRole("button", { name: "Add Application" }).click();
    await page.waitForTimeout(1000);

    // Change status to INTERVIEW
    const statusSelect = page.locator("select[name='status']").first();
    await statusSelect.selectOption("INTERVIEW");

    const saveButton = page.locator("button[type='submit']").filter({ hasText: "Save" }).first();
    await saveButton.click();

    // Verify INTERVIEW status is reflected
    await expect(page.getByText("INTERVIEW")).toBeVisible({ timeout: 5000 });
  });
});
