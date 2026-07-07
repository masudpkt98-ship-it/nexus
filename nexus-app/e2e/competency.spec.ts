import { test, expect } from "@playwright/test";

// Mutates shared competency data — run in order.
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Enter NEXUS/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 25_000 });
  await page.goto("/competency");
  await expect(page.getByRole("button", { name: /New Competency/i })).toBeVisible();
});

test("competency: create → edit → delete", async ({ page }) => {
  const name = "E2E Comp " + Date.now();

  // Create
  await page.getByRole("button", { name: /New Competency/i }).click();
  await page.getByPlaceholder("e.g. Cloud Architecture").fill(name);
  await page.getByPlaceholder("e.g. Technical").fill("Technical");
  await page.getByRole("button", { name: /^Create$/ }).click();
  await expect(page.getByText(name)).toBeVisible();

  const row = page.locator("div.group", { hasText: name });
  await expect(row).toContainText("Technical");

  // Edit — change the category
  await page.getByRole("button", { name: `Edit ${name}` }).click();
  await page.getByPlaceholder("e.g. Technical").fill("Leadership");
  await page.getByRole("button", { name: /^Save$/ }).click();
  await expect(row).toContainText("Leadership");

  // Delete
  await page.getByRole("button", { name: `Delete ${name}` }).click();
  await expect(page.getByText(name)).toHaveCount(0);
});
