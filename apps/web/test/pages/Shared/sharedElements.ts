import { type Locator, type Page } from "@playwright/test";

export default class SharedElements {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get darkModeToggle(): Locator {
    return this.page.getByTestId("theme_button_toggle");
  }
}
