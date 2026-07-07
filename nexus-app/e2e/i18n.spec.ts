import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Enter NEXUS/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 25_000 });
});

const pick = async (page: import("@playwright/test").Page, label: RegExp) => {
  await page.getByRole("button", { name: "Language" }).click();
  const item = page.getByRole("button", { name: label });
  await item.scrollIntoViewIfNeeded();
  await item.click();
};

test("language switcher translates the navigation and applies RTL", async ({ page }) => {
  await expect(page.getByRole("link", { name: "Dashboard" }).first()).toBeVisible();

  await pick(page, /Bahasa Indonesia/);
  await expect(page.getByRole("link", { name: "Dasbor" }).first()).toBeVisible();

  // Page headers (title + subtitle) translate too
  await page.goto("/performance");
  await expect(page.getByRole("heading", { name: "Manajemen Kinerja", level: 1 })).toBeVisible();
  await expect(page.getByText(/Korporat · Departemen · KPI Individu/)).toBeVisible();
  await page.goto("/dashboard");

  await pick(page, /中文/);
  await expect(page.getByRole("link", { name: "仪表板" }).first()).toBeVisible();

  // Arabic translates the nav and flips the document to RTL
  await pick(page, /العربية/);
  await expect(page.getByRole("link", { name: "لوحة القيادة" }).first()).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});
