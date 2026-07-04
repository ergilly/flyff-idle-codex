import { expect, type Page } from "@playwright/test";
import SharedActions from "../Shared/sharedActions";
import LoginPageElements from "./pageElements";

export default class LoginPageActions extends SharedActions {
  readonly pageElements: LoginPageElements;

  constructor(page: Page) {
    super(page);
    this.pageElements = new LoginPageElements(page);
  }

  async login(email: string, password: string): Promise<void> {
    await this.selectLoginMode();
    await this.pageElements.emailInput.fill(email);
    await this.pageElements.passwordInput.fill(password);
    await this.pageElements.submitButton.click();
  }

  async waitForReady(): Promise<void> {
    await expect(this.pageElements.authForm).toHaveAttribute("data-hydrated", "true");
    await expect(this.pageElements.emailInput).toBeVisible();
    await expect(this.pageElements.passwordInput).toBeVisible();
    await expect(this.pageElements.submitButton).toBeEnabled();
    await expect(this.pageElements.loginSelectButton).toBeEnabled();
    await expect(this.pageElements.registerSelectButton).toBeEnabled();
  }

  async selectRegisterMode(): Promise<void> {
    await expect(async () => {
      await this.pageElements.registerSelectButton.click();
      await expect(this.pageElements.displayNameInput).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 5000 });
  }

  async selectLoginMode(): Promise<void> {
    await expect(async () => {
      await this.pageElements.loginSelectButton.click();
      await expect(this.pageElements.displayNameInput).toBeHidden({ timeout: 1000 });
      await expect(this.pageElements.submitButton).toContainText("Log in", { timeout: 1000 });
    }).toPass({ timeout: 5000 });
  }

  async register(displayName: string, email: string, password: string): Promise<void> {
    await this.selectRegisterMode();
    await this.pageElements.displayNameInput.fill(displayName);
    await this.pageElements.emailInput.fill(email);
    await this.pageElements.passwordInput.fill(password);
    await this.pageElements.submitButton.click();
  }
}
