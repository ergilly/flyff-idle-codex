import { type Locator, type Page } from "@playwright/test";
import SharedElements from "../Shared/sharedElements";

export default class LoginPageElements extends SharedElements {
  constructor(page: Page) {
    super(page);
  }

  get loginHeader(): Locator {
    return this.page.getByTestId("login_header_page_title");
  }

  get displayNameInput(): Locator {
    return this.page.getByTestId("login_input_display_name");
  }

  get authForm(): Locator {
    return this.page.getByTestId("login_form_auth");
  }

  get emailInput(): Locator {
    return this.page.getByTestId("login_input_email");
  }

  get passwordInput(): Locator {
    return this.page.getByTestId("login_input_password");
  }

  get submitButton(): Locator {
    return this.page.getByTestId("login_button_submit");
  }

  get loginSelectButton(): Locator {
    return this.page.getByTestId("login_button_mode_login");
  }

  get registerSelectButton(): Locator {
    return this.page.getByTestId("login_button_mode_register");
  }

  get loginAuthErrorMessage(): Locator {
    return this.page.getByTestId("login_error_auth_text");
  }
}
