import { test as base } from "@playwright/test";
import { LoginPage, CharacterSelectPage } from "../pages";

type Fixtures = {
  loginPage: LoginPage;
  characterSelectPage: CharacterSelectPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  characterSelectPage: async ({ page }, use) => {
    const characterSelectPage = new CharacterSelectPage(page);
    await use(characterSelectPage);
  }
});

export { expect } from "@playwright/test";
