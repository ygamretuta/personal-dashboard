import { expect, test, type Page } from "@playwright/test";

async function openDemo(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: "Try the demo" }).click();
  await expect(page.getByRole("listbox", { name: "Inbox" })).toBeVisible();
}

const rows = (page: Page) => page.getByRole("listbox", { name: "Inbox" }).getByRole("option");

test.describe("demo mode", () => {
  test("loads seeded items from every source without signing in", async ({ page }) => {
    await openDemo(page);
    await expect(rows(page)).toHaveCount(13); // seeded items; later arrivals are not counted yet
    await expect(page.getByRole("region", { name: "Daily brief" })).toContainText("need you today");
    for (const source of ["Slack", "Gmail", "Calendar", "GitHub"]) {
      await expect(page.getByRole("button", { name: new RegExp(`^${source}`) })).toBeVisible();
    }
  });

  test("filters by source", async ({ page }) => {
    await openDemo(page);
    await page.getByRole("button", { name: /^GitHub/ }).click();
    await expect(rows(page)).toHaveCount(3);
    await page.getByRole("button", { name: /^All/ }).click();
    await expect(rows(page)).toHaveCount(13);
  });

  test("searches with / and clears with Escape", async ({ page }) => {
    await openDemo(page);
    await page.keyboard.press("/");
    await expect(page.getByRole("searchbox", { name: "Search inbox" })).toBeFocused();
    await page.keyboard.type("roadmap");
    await expect(rows(page).first()).toContainText("Q4 roadmap");
    await page.keyboard.type(" zzzznomatch");
    await expect(page.getByText("No matches")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(rows(page)).toHaveCount(13);
  });

  test("shows unread only with u", async ({ page }) => {
    await openDemo(page);
    await page.keyboard.press("Enter"); // opening an item marks it read
    await page.keyboard.press("u");
    await expect(rows(page)).toHaveCount(12);
  });

  test("moves with j and k and archives with e", async ({ page }) => {
    await openDemo(page);
    await page.getByRole("button", { name: /^Gmail/ }).click(); // Gmail items support archive
    const before = await rows(page).count();
    const first = rows(page).first();
    await expect(first).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("j");
    await expect(rows(page).nth(1)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("k");
    await expect(first).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("e");
    await expect(rows(page)).toHaveCount(before - 1);
  });

  test("replies from the keyboard and shows the reply in the thread", async ({ page }) => {
    await openDemo(page);
    await page.keyboard.press("r");
    await expect(page.getByRole("textbox", { name: "Reply" })).toBeFocused();
    await page.keyboard.type("On it, checking now.");
    await page.keyboard.press("Control+Enter");
    await expect(page.getByText("You replied")).toBeVisible();
    await expect(page.getByText("On it, checking now.").last()).toBeVisible();
  });

  test("snoozes an item out of the feed", async ({ page }) => {
    await openDemo(page);
    const before = await rows(page).count();
    await page.keyboard.press("s");
    await expect(page.getByText("Snoozed")).toBeVisible();
    await expect(rows(page)).toHaveCount(before - 1);
  });

  test("opens the command palette and runs a command", async ({ page }) => {
    await openDemo(page);
    await page.keyboard.press("Control+k");
    const palette = page.getByRole("dialog", { name: "Command palette" });
    await expect(palette).toBeVisible();
    await page.keyboard.type("only github");
    await page.keyboard.press("Enter");
    await expect(palette).toBeHidden();
    await expect(rows(page)).toHaveCount(3);
  });

  test("shows the shortcut cheatsheet with ? and closes it with Escape", async ({ page }) => {
    await openDemo(page);
    await page.keyboard.press("?");
    const sheet = page.getByRole("dialog", { name: "Keyboard shortcuts" });
    await expect(sheet).toContainText("Archive");
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
  });

  test("toggles dark mode and remembers it", async ({ page }) => {
    await openDemo(page);
    const html = page.locator("html");
    const before = await html.getAttribute("data-theme");
    await page.getByRole("button", { name: "Toggle dark mode" }).click();
    const after = await html.getAttribute("data-theme");
    expect(after).not.toBe(before);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(html).toHaveAttribute("data-theme", after!);
  });

  test("a new item slides in on a later sync", async ({ page }) => {
    test.setTimeout(45_000);
    await openDemo(page);
    const before = await rows(page).count();
    // Slack and Gmail each deliver one new item on the first later sync.
    await expect(rows(page)).toHaveCount(before + 2, { timeout: 30_000 });
  });
});

test("settings lists the four integrations", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  for (const source of ["Slack", "Gmail", "Calendar", "GitHub"]) {
    await expect(page.getByText(source, { exact: true })).toBeVisible();
  }
});
