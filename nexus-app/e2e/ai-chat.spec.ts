import { test, expect } from "@playwright/test";

// These tests share one backend user and mutate conversation threads, so run
// them in order to avoid cross-test data races.
test.describe.configure({ mode: "serial" });

// Sign in as the VP demo account, then land on the AI Assistant.
test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Enter NEXUS/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 25_000 });
  await page.goto("/ai-assistant");
  await expect(page.getByText("NEXUS Copilot")).toBeVisible();
});

test("chat: streams a reply and labels the source", async ({ page }) => {
  await page.getByPlaceholder(/Ask NEXUS anything/i).fill("give me an executive summary");
  await page.getByRole("button", { name: "Send" }).click();

  // Rule-based (no API key) reply for a "summary" prompt starts with this.
  // (.last() = the chat bubble; the same text may also appear as a sidebar preview.)
  await expect(page.getByText(/Executive summary:/i).last()).toBeVisible({ timeout: 25_000 });
  // Source caption is attached once streaming completes.
  await expect(page.getByText(/NEXUS engine|Claude Opus 4\.8/i).last()).toBeVisible();
});

test("chat: Stop halts an in-progress stream", async ({ page }) => {
  await page
    .getByPlaceholder(/Ask NEXUS anything/i)
    .fill("please describe the overall department situation in detail");
  await page.getByRole("button", { name: "Send" }).click();

  // Stop appears while streaming (busy) — click it to abort.
  await page.getByRole("button", { name: "Stop" }).click({ timeout: 5_000 });

  // Aborting clears the busy state, so the Send button returns.
  await expect(page.getByRole("button", { name: "Send" })).toBeVisible({ timeout: 10_000 });
});

test("threads: create → rename → delete a conversation", async ({ page }) => {
  const aside = page.locator("aside").filter({ hasText: "Conversations" });
  await expect(aside).toBeVisible();
  const name = "E2E Rename " + Date.now();

  // Create
  await aside.getByRole("button", { name: "New" }).click();
  await expect(aside.getByText("New chat").first()).toBeVisible();

  // Rename the active (newest, first) thread inline
  await aside.locator("div.group").first().click();
  const renameInput = aside.locator("input:not([placeholder])");
  await renameInput.fill(name);
  await renameInput.press("Enter");
  await expect(aside.getByText(name)).toBeVisible();

  // Delete it (hover the row → ✕)
  const row = aside.locator("div.group", { hasText: name });
  await row.hover();
  await row.getByRole("button").click();
  await expect(aside.getByText(name)).toHaveCount(0);
});

test("threads: search filters the sidebar", async ({ page }) => {
  const aside = page.locator("aside").filter({ hasText: "Conversations" });
  await expect(aside).toBeVisible();
  const name = "E2E Search " + Date.now();

  // Create + rename a uniquely-named conversation
  await aside.getByRole("button", { name: "New" }).click();
  await expect(aside.getByText("New chat").first()).toBeVisible(); // wait for the new thread to render
  await aside.locator("div.group").first().click();
  const renameInput = aside.locator("input:not([placeholder])");
  await renameInput.fill(name);
  await renameInput.press("Enter");
  await expect(aside.getByText(name)).toBeVisible();

  const search = aside.getByPlaceholder(/Search/i);

  // Matching query keeps the conversation visible
  await search.fill(name);
  await expect(aside.getByText(name)).toBeVisible();

  // Non-matching query shows the empty state
  await search.fill("zzz-no-such-conversation");
  await expect(aside.getByText(/No conversations match/i)).toBeVisible();

  // Cleanup: narrow back, then delete
  await search.fill(name);
  const row = aside.locator("div.group", { hasText: name });
  await row.hover();
  await row.getByRole("button").click();
  await expect(aside.getByText(name)).toHaveCount(0);
});
