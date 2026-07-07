import { test, expect } from "@playwright/test";

// Mutates shared KPI data — run in order.
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Enter NEXUS/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 25_000 });
  await page.goto("/performance");
  await expect(page.getByRole("button", { name: /New KPI/i })).toBeVisible();
});

test("performance KPI: create → edit → delete", async ({ page }) => {
  const name = "E2E KPI " + Date.now();

  // Create
  await page.getByRole("button", { name: /New KPI/i }).click();
  await page.getByPlaceholder("e.g. Revenue Growth").fill(name);
  await page.getByRole("button", { name: /^Create$/ }).click();
  await expect(page.getByText(name)).toBeVisible();

  const row = page.locator("div.group", { hasText: name });
  await expect(row).toContainText("Department"); // default level

  // Edit — change level to Corporate
  await page.getByRole("button", { name: `Edit ${name}` }).click();
  await page.getByRole("combobox").selectOption("Corporate");
  await page.getByRole("button", { name: /^Save$/ }).click();
  await expect(row).toContainText("Corporate");

  // Delete
  await page.getByRole("button", { name: `Delete ${name}` }).click();
  await expect(page.getByText(name)).toHaveCount(0);
});
