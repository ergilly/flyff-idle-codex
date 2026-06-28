import { test, expect } from "../fixtures";

test.beforeEach(async ({ page, loginPage }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await loginPage.actions.waitForReady();
});

function uniqueRegisterEmail() {
  return `register-${Date.now()}-${Math.random().toString(36).slice(2)}@flyff-idle.local`;
}

test.describe("Register Page", () => {
  test.describe("initial register state", () => {
    test(
      "should display the register form with empty fields after selecting register mode",
      { tag: "@register" },
      async ({ loginPage }) => {
        await loginPage.actions.selectRegisterMode();
        await expect(loginPage.elements.displayNameInput).toBeVisible();
        await expect(loginPage.elements.displayNameInput).toHaveValue("");
        await expect(loginPage.elements.emailInput).toBeVisible();
        await expect(loginPage.elements.emailInput).toHaveValue("");
        await expect(loginPage.elements.passwordInput).toBeVisible();
        await expect(loginPage.elements.passwordInput).toHaveValue("");
        await expect(loginPage.elements.submitButton).toBeVisible();
      }
    );
  });

  test.describe("successful registration", () => {
    test(
      "should register a new player and store the session",
      { tag: "@register" },
      async ({ page, loginPage }) => {
        const email = uniqueRegisterEmail();
        await loginPage.actions.register("New Player", email, "password123");
        await expect(page).toHaveURL("/characters");
        await expect.poll(() => page.evaluate(() => localStorage.getItem("flyffIdleToken"))).not.toBeNull();
        await expect.poll(() => page.evaluate(() => localStorage.getItem("flyffIdleUser"))).toContain(email);
      }
    );
  });

  test.describe("registration errors", () => {
    test("should display the duplicate email error message", { tag: "@register" }, async ({ loginPage }) => {
      await loginPage.actions.register("Existing Player", "test@flyff-idle.local", "password123");
      await expect(loginPage.elements.loginAuthErrorMessage).toContainText("Email already registered");
      await expect(loginPage.elements.displayNameInput).toBeVisible();
      await expect(loginPage.elements.submitButton).toContainText("Create profile");
    });

    test(
      "should clear the visible auth error when switching back to login mode",
      { tag: "@register" },
      async ({ loginPage }) => {
        await loginPage.actions.register("Existing Player", "test@flyff-idle.local", "password123");
        await expect(loginPage.elements.loginAuthErrorMessage).toBeVisible();
        await loginPage.actions.selectLoginMode();
        await expect(loginPage.elements.loginAuthErrorMessage).toBeHidden();
      }
    );
  });

  test.describe("validation smoke", () => {
    test(
      "should not submit registration with empty required fields",
      { tag: "@register" },
      async ({ loginPage }) => {
        await loginPage.actions.selectRegisterMode();
        await loginPage.elements.submitButton.click();
        await expect(loginPage.elements.loginAuthErrorMessage).toContainText(
          "Please enter your display name"
        );
      }
    );
  });
});
