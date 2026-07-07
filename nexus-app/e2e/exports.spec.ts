import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Enter NEXUS/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 25_000 });
});

test("competency exports to Excel (.xlsx)", async ({ page }) => {
  await page.goto("/competency");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /^Excel$/ }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
});

test("performance exports an executive deck (.pptx)", async ({ page }) => {
  await page.goto("/performance");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /^Deck$/ }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.pptx$/);
});
