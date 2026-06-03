import { expect, test } from "@playwright/test";

test("player can log in and see the character selection screen", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByRole("heading", { name: "Pick your adventurer" })).toBeVisible();
  await expect(page.getByText("Saint Morning")).toBeVisible();
  await expect(page.getByText("Mercenary")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create character in slot 3" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create character in slot 8" })).toBeVisible();
});

test("player can register a new profile", async ({ page }) => {
  const email = `ui-player-${Date.now()}@flyff-idle.local`;

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page.getByLabel("Display name")).toBeVisible();
  await page.getByLabel("Display name").fill("UI Pilot");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create profile" }).click();

  await expect(page.getByRole("heading", { name: "Pick your adventurer" })).toBeVisible();
  await expect(page.getByText("Choose who will begin the grind.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create character in slot 1" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create character in slot 8" })).toBeVisible();
});
