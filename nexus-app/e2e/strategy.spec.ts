import { test, expect } from "@playwright/test";

// Mutates shared objective data — run in order.
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Enter NEXUS/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 25_000 });
  await page.goto("/strategy");
  await expect(page.getByRole("button", { name: "Add objective" })).toBeVisible();
});

test("objective: create → edit → delete", async ({ page }) => {
  const title = "E2E OKR " + Date.now();

  // Create — the trigger is a "+" icon button; its accessible name comes from
  // aria-label, not the "New Objective" text (that is the modal's title).
  await page.getByRole("button", { name: "Add objective" }).click();
  await page.getByPlaceholder("e.g. Launch Talent Marketplace").fill(title);
  await page.getByRole("button", { name: /^Create$/ }).click();
  await expect(page.getByText(title)).toBeVisible();

  const card = page.locator("div.group", { hasText: title });
  await expect(card).toContainText("Q1"); // default quarter

  // Edit — change quarter to Q3
  await page.getByRole("button", { name: `Edit ${title}` }).click();
  await page.getByLabel(/^Quarter/).selectOption("Q3");
  await page.getByRole("button", { name: /^Save$/ }).click();
  await expect(card).toContainText("Q3");

  // Delete
  await page.getByRole("button", { name: `Delete ${title}` }).click();
  await expect(page.getByText(title)).toHaveCount(0);
});
