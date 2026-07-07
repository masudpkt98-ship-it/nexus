import { test, expect } from "@playwright/test";

// Signs in as the VP demo account, then lands on the AI Assistant.
test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Enter NEXUS/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 25_000 });
  await page.goto("/ai-assistant");
  await expect(page.getByText("AI Generators")).toBeVisible();
});

test("IDP generator: employee dropdown is populated from dev-plan data and result matches selection", async ({ page }) => {
  await page.getByRole("button", { name: /Generate Individual Development Plan/i }).click();

  const select = page.getByRole("combobox");
  await expect(select).toBeVisible();

  // Options load asynchronously from GET /competency — wait for more than the "Auto" option.
  await expect(async () => {
    expect(await select.locator("option").count()).toBeGreaterThan(1);
  }).toPass({ timeout: 15_000 });

  await expect(select.locator("option", { hasText: "Bagus Hartono" })).toHaveCount(1);
  await expect(select.locator("option", { hasText: "Rani Kusuma" })).toHaveCount(1);

  await select.selectOption("Dimas Prakoso");
  await page.getByRole("button", { name: /^Generate$/ }).click();

  await expect(
    page.getByRole("heading", { name: /Development Plan.*Dimas Prakoso/i })
  ).toBeVisible({ timeout: 25_000 });
});

test("IDP generator: Auto option targets the lowest-readiness employee (Rani Kusuma)", async ({ page }) => {
  await page.getByRole("button", { name: /Generate Individual Development Plan/i }).click();
  await page.getByRole("button", { name: /^Generate$/ }).click(); // Auto = default empty selection
  await expect(
    page.getByRole("heading", { name: /Development Plan.*Rani Kusuma/i })
  ).toBeVisible({ timeout: 25_000 });
});

test("KPI generator: Level parameter is respected", async ({ page }) => {
  await page.getByRole("button", { name: /Generate SMART KPI Set/i }).click();
  await page.getByRole("combobox").selectOption("Individual");
  await page.getByRole("button", { name: /^Generate$/ }).click();
  await expect(
    page.getByRole("heading", { name: /SMART KPIs.*Individual/i })
  ).toBeVisible({ timeout: 25_000 });
});

test("Report generator: scope parameter appears in the report title", async ({ page }) => {
  await page.getByRole("button", { name: /Generate Executive Report/i }).click();
  await page.getByPlaceholder(/Q3 Board Review/i).fill("Q4 Strategy Review");
  await page.getByRole("button", { name: /^Generate$/ }).click();
  await expect(
    page.getByRole("heading", { name: /Executive Report.*Q4 Strategy Review/i })
  ).toBeVisible({ timeout: 25_000 });
});

test("Report generator: streaming can be stopped", async ({ page }) => {
  await page.getByRole("button", { name: /Generate Executive Report/i }).click();
  await page.getByRole("button", { name: /^Generate$/ }).click();

  // Stop appears while the artifact streams — click it to abort.
  await page.getByRole("button", { name: "Stop" }).click({ timeout: 5_000 });

  // Stopping ends the stream, so the Stop button goes away and the action returns.
  await expect(page.getByRole("button", { name: "Stop" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Regenerate|^Generate$/ })).toBeVisible();
});
