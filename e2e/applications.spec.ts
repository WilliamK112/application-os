import { test, expect } from "@playwright/test";

test.describe("Applications page", () => {
  let companyName: string;
  let jobTitle: string;

  test.beforeEach(async ({ page }) => {
    await page.goto("/jobs");

    companyName = `AppTestCo_${Date.now()}`;
    jobTitle = "Test Engineer";
    await page.locator('input[name="company"]').fill(companyName);
    await page.locator('input[name="title"]').fill(jobTitle);
    await page.getByRole("button", { name: "Create Job" }).click();
    await expect(page.getByRole("cell", { name: new RegExp(companyName, "i") }).first()).toBeVisible({ timeout: 5000 });

    await page.goto("/applications");
    await expect(page).toHaveURL("/applications");
  });

  async function createApplication(page: Parameters<typeof test.beforeEach>[0]["page"]) {
    const jobSelect = page.locator("select[name='jobId']").first();
    const matchingOption = jobSelect.locator("option", { hasText: companyName }).first();
    const matchingValue = await matchingOption.getAttribute("value");

    if (matchingValue) {
      await jobSelect.selectOption(matchingValue);
    } else {
      await jobSelect.selectOption({ index: 1 });
    }

    await page.getByRole("button", { name: "Create Application" }).click();
    await expect(page.getByRole("link", { name: new RegExp(`${companyName} · ${jobTitle}`, "i") })).toBeVisible({ timeout: 5000 });
  }

  test("renders applications page", async ({ page }) => {
    await expect(page.getByRole("searchbox", { name: /search/i })).toBeVisible();
    await expect(page.getByText(/create application/i)).toBeVisible();
  });

  test("creates an application", async ({ page }) => {
    await createApplication(page);
    await expect(page.getByRole("link", { name: new RegExp(`${companyName} · ${jobTitle}`, "i") })).toBeVisible();
  });

  test("updates application status", async ({ page }) => {
    await createApplication(page);

    const card = page.locator("article").filter({ hasText: companyName }).first();
    const statusSelect = card.locator("select").first();
    await statusSelect.selectOption("INTERVIEW");

    const saveButton = card.getByRole("button", { name: /save/i }).first();
    await saveButton.click();

    await expect(statusSelect).toHaveValue("INTERVIEW");
  });
});
