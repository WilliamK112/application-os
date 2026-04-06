import { test, expect } from "@playwright/test";

test.describe.serial("Follow-ups page", () => {
  let jobCompany: string;
  let jobTitle: string;

  test.beforeEach(async ({ page }) => {
    await page.goto("/jobs");

    jobCompany = `FollowUpCo_${Date.now()}`;
    jobTitle = "Product Manager";

    await page.locator('input[name="company"]').fill(jobCompany);
    await page.locator('input[name="title"]').fill(jobTitle);
    await page.getByRole("button", { name: "Create Job" }).click();
    await expect(page.getByRole("cell", { name: new RegExp(jobCompany, "i") }).first()).toBeVisible({ timeout: 5000 });

    await page.goto("/applications");
    await expect(page).toHaveURL("/applications");

    const jobSelect = page.locator("select[name='jobId']").first();
    const matchingOption = jobSelect.locator("option", { hasText: jobCompany }).first();
    const matchingValue = await matchingOption.getAttribute("value");

    if (matchingValue) {
      await jobSelect.selectOption(matchingValue);
    } else {
      await jobSelect.selectOption({ index: 1 });
    }
    await page.getByRole("button", { name: "Create Application" }).click();
    await expect(page.getByRole("link", { name: new RegExp(`${jobCompany} · ${jobTitle}`, "i") })).toBeVisible({ timeout: 5000 });

    await page.goto("/followups");
    await expect(page).toHaveURL("/followups");
  });

  async function openCreateFollowUp(page: Parameters<typeof test.beforeEach>[0]["page"]) {
    await page.getByRole("button", { name: /new follow-up/i }).click();
    await expect(page.getByText("Select Application")).toBeVisible();

    const appSelect = page.locator("select").first();
    await appSelect.selectOption({ index: 1 });
  }

  test("renders follow-ups page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /pending follow-ups/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /new follow-up/i })).toBeVisible();
  });

  test("creates a follow-up", async ({ page }) => {
    await openCreateFollowUp(page);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);
    const dueDateValue = tomorrow.toISOString().slice(0, 16);

    await page.locator('input[type="datetime-local"]').fill(dueDateValue);
    await page.getByLabel(/channel/i).selectOption("Email");
    await page.getByLabel(/notes/i).fill("Send thank-you email after interview");

    await page.getByRole("button", { name: /create follow-up/i }).click();
    await expect(page.getByText(/thank-you email/i)).toBeVisible({ timeout: 5000 });
  });

  test("marks follow-up as done", async ({ page }) => {
    await openCreateFollowUp(page);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.locator('input[type="datetime-local"]').fill(tomorrow.toISOString().slice(0, 16));
    await page.getByLabel(/channel/i).selectOption("Email");
    const note = `Follow-up test task ${Date.now()}`;
    await page.getByLabel(/notes/i).fill(note);
    await page.getByRole("button", { name: /create follow-up/i }).click();

    await expect(page.getByText(note)).toBeVisible({ timeout: 5000 });
    const item = page.locator("article, div.rounded-lg.border").filter({ hasText: note }).first();
    await expect(item).toBeVisible({ timeout: 5000 });

    await item.getByRole("button", { name: /done/i }).click();
    await expect(page.getByRole("heading", { name: /completed \/ skipped/i })).toBeVisible();
  });

  test("skips a follow-up", async ({ page }) => {
    await openCreateFollowUp(page);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    await page.locator('input[type="datetime-local"]').fill(futureDate.toISOString().slice(0, 16));
    await page.getByLabel(/channel/i).selectOption("Email");
    const note = `Skip this follow-up ${Date.now()}`;
    await page.getByLabel(/notes/i).fill(note);
    await page.getByRole("button", { name: /create follow-up/i }).click();

    await expect(page.getByText(note)).toBeVisible({ timeout: 5000 });
    const item = page.locator("article, div.rounded-lg.border").filter({ hasText: note }).first();
    await expect(item).toBeVisible({ timeout: 5000 });

    await item.getByRole("button", { name: /skip/i }).click();
    await expect(page.getByRole("heading", { name: /completed \/ skipped/i })).toBeVisible();
  });
});
