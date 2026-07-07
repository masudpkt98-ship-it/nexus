import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Enter NEXUS/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 25_000 });
  await page.goto("/competency");
  await expect(page.getByRole("button", { name: /New Competency/i })).toBeVisible();
});

test("notifications: a new competency streams into the bell live", async ({ page }) => {
  const name = "E2E Notif " + Date.now();

  // Creating a competency raises a department-wide notification.
  await page.getByRole("button", { name: /New Competency/i }).click();
  await page.getByPlaceholder("e.g. Cloud Architecture").fill(name);
  await page.getByPlaceholder("e.g. Technical").fill("Technical");
  await page.getByRole("button", { name: /^Create$/ }).click();
  await expect(page.getByText(name)).toBeVisible();

  // The topbar polls, so the notification appears on its own within a few seconds.
  await page.getByRole("button", { name: "Notifications" }).click();
  await expect(page.getByText(`New competency added: ${name}`)).toBeVisible({ timeout: 15_000 });
});
