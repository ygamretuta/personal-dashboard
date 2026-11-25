import { expect, test, type Page } from "@playwright/test";

const OUT_DIR = "public/screenshots";

async function openDemo(page: Page, theme: "light" | "dark") {
  await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
  await page.goto("/demo");
  await expect(page.getByRole("listbox", { name: "Inbox" }).getByRole("option")).toHaveCount(16);
  await page.keyboard.press("j"); // select the email, a better hero than a one-line DM
  await expect(page.getByRole("heading", { level: 1, name: /Interview loop/ })).toBeVisible();
  await page.waitForTimeout(600); // let every transition settle before capturing
}

for (const theme of ["light", "dark"] as const) {
  test(`inbox in ${theme} mode`, async ({ page }) => {
    await openDemo(page, theme);
    await page.screenshot({ path: `${OUT_DIR}/inbox-${theme}.png` });
  });
}

test("command palette", async ({ page }) => {
  await openDemo(page, "dark");
  const palette = page.getByRole("dialog", { name: "Command palette" });
  await expect(async () => {
    await page.keyboard.press("Control+k");
    await expect(palette).toBeVisible({ timeout: 1000 });
  }).toPass();
  await page.waitForTimeout(400); // let the fade-in finish
  await page.screenshot({ path: `${OUT_DIR}/command-palette.png` });
});

for (const theme of ["light", "dark"] as const) {
  test(`dashboard in ${theme} mode`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
    await page.setViewportSize({ width: 1440, height: 1500 });
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Needs your attention" })).toBeVisible();
    await expect(page.getByText("Team standup").first()).toBeVisible();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT_DIR}/dashboard-${theme}.png` });
  });
}
