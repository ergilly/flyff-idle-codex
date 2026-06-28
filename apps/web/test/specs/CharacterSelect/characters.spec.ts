import { test, expect } from "../fixtures";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

function getWorkspaceRoot() {
  return existsSync(path.join(process.cwd(), "apps/api/package.json"))
    ? process.cwd()
    : path.resolve(process.cwd(), "../..");
}

function restoreSeededCharacters() {
  const npmExecPath = process.env.npm_execpath;
  const command = npmExecPath && existsSync(npmExecPath) ? process.execPath : "npm";
  const args =
    npmExecPath && existsSync(npmExecPath)
      ? [npmExecPath, "run", "db:seed", "-w", "@flyff-idle/api"]
      : ["run", "db:seed", "-w", "@flyff-idle/api"];

  execFileSync(command, args, {
    cwd: getWorkspaceRoot(),
    stdio: "ignore"
  });
}

test.describe("Characters Page", () => {
  test.beforeAll(() => {
    restoreSeededCharacters();
  });

  test.describe("authentication", () => {
    test(
      "should redirect unauthenticated users to the login page",
      { tag: "@characters" },
      async ({ page, loginPage }) => {
        await page.goto("/characters");
        await expect(loginPage.elements.loginHeader).toBeVisible();
      }
    );

    test(
      "should log out and clear the stored session",
      { tag: "@characters" },
      async ({ page, loginPage, characterSelectPage }) => {
        await test.step("log in", async () => {
          await page.goto("/");
          await loginPage.actions.login("test@flyff-idle.local", "password123");
          await expect
            .poll(() => page.evaluate(() => localStorage.getItem("flyffIdleUser")))
            .toContain("test@flyff-idle.local");
        });

        await test.step("log out", async () => {
          await characterSelectPage.elements.logoutButton.click();
          await expect(page).toHaveURL("/");
          await expect(loginPage.elements.loginHeader).toBeVisible();
          await expect.poll(() => page.evaluate(() => localStorage.getItem("flyffIdleUser"))).toBeNull();
        });
      }
    );
  });

  test.describe("roster display", () => {
    test(
      "should display the authenticated player character roster",
      { tag: "@characters" },
      async ({ page, loginPage, characterSelectPage }) => {
        await test.step("log in", async () => {
          await page.goto("/");
          await loginPage.actions.login("test@flyff-idle.local", "password123");
        });

        await test.step("verify roster", async () => {
          await expect(characterSelectPage.elements.selectCharacterSlot(1)).toBeVisible();
          await expect(characterSelectPage.elements.selectCharacterSlot(2)).toBeVisible();
          await expect(characterSelectPage.elements.selectCharacterSlot(3)).toBeVisible();
          await expect(characterSelectPage.elements.selectCharacterSlot(4)).toBeVisible();
          await expect(characterSelectPage.elements.selectCharacterSlot(5)).toBeVisible();
          await expect(characterSelectPage.elements.selectCharacterSlot(6)).toBeVisible();
          await expect(characterSelectPage.elements.selectCharacterSlot(7)).toBeVisible();
          await expect(characterSelectPage.elements.selectCharacterSlot(8)).toBeVisible();
        });
      }
    );
  });

  test.describe("character navigation", () => {
    test(
      "should enter the game when selecting an existing character",
      { tag: "@characters" },
      async ({ page, loginPage, characterSelectPage }) => {
        await test.step("log in", async () => {
          await page.goto("/");
          await loginPage.actions.login("test@flyff-idle.local", "password123");
        });

        await test.step("select character", async () => {
          await characterSelectPage.elements.selectCharacterSlot(1).click();
          await expect(page).toHaveURL("/game");
        });
      }
    );

    test(
      "should open character creation for an empty slot",
      { tag: "@characters" },
      async ({ page, loginPage, characterSelectPage }) => {
        await test.step("log in", async () => {
          await page.goto("/");
          await loginPage.actions.login("empty@flyff-idle.local", "password123");
        });

        await test.step("select empty slot", async () => {
          await characterSelectPage.elements.createCharacterButton(1).click();
          await expect(page).toHaveURL("/characters/create?slot=1");
          await expect(characterSelectPage.elements.createCharacterHeader).toHaveText("Slot 1");
        });
      }
    );
  });

  test.describe("character deletion", () => {
    test(
      "should open the delete dialog and require the exact character name before confirming",
      { tag: "@characters" },
      async ({ page, loginPage, characterSelectPage }) => {
        await test.step("log in", async () => {
          await page.goto("/");
          await loginPage.actions.login("test@flyff-idle.local", "password123");
        });

        const characterName = await characterSelectPage.elements.characterName(1).textContent();

        await test.step("open delete dialog", async () => {
          await characterSelectPage.elements.deleteCharacterButton(1).click();
          await expect(characterSelectPage.elements.deleteCharacterHeader).toBeVisible();
          await expect(characterSelectPage.elements.deleteCharacterHeader).toHaveText(
            `Delete ${characterName}`
          );
          await expect(characterSelectPage.elements.deleteCharacterNameInput).toBeVisible();
          await expect(characterSelectPage.elements.deleteCharacterConfirmButton).toBeVisible();
          await expect(characterSelectPage.elements.deleteCharacterCancelButton).toBeVisible();
        });
      }
    );

    test(
      "should cancel deletion without removing the character",
      { tag: "@characters" },
      async ({ page, loginPage, characterSelectPage }) => {
        await test.step("log in", async () => {
          await page.goto("/");
          await loginPage.actions.login("test@flyff-idle.local", "password123");
        });

        await test.step("open delete dialog and cancel deletion", async () => {
          await characterSelectPage.elements.deleteCharacterButton(1).click();
          await characterSelectPage.elements.deleteCharacterCancelButton.click();
          await expect(characterSelectPage.elements.selectCharacterSlot(1)).toBeVisible();
        });
      }
    );

    test(
      "should delete a character and free the roster slot after exact name confirmation",
      { tag: "@characters" },
      async ({ page, loginPage, characterSelectPage }) => {
        await test.step("log in with empty roster account", async () => {
          await page.goto("/");
          await loginPage.actions.login("empty@flyff-idle.local", "password123");
        });

        await test.step("create a temporary character to delete", async () => {
          await characterSelectPage.elements.createCharacterButton(1).click();
          await expect(page).toHaveURL("/characters/create?slot=1");
          await characterSelectPage.actions.createCharacter("Delete Probe", "male");
          await expect(page).toHaveURL("/characters");
          await expect(characterSelectPage.elements.characterName(1)).toHaveText("Delete Probe");
        });

        await test.step("open delete dialog and confirm deletion", async () => {
          await characterSelectPage.elements.deleteCharacterButton(1).click();
          await characterSelectPage.elements.deleteCharacterNameInput.fill("Delete Probe");
          await characterSelectPage.elements.deleteCharacterConfirmButton.click();
          await expect(characterSelectPage.elements.emptyCharacterSlot(1)).toBeVisible();
        });
      }
    );
  });
});
