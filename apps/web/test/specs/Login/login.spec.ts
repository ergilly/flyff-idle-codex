import { test, expect } from "../fixtures";
test.beforeEach(async ({ page, loginPage }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await loginPage.actions.waitForReady();
});

test.describe("Login Page", () => {
  test.describe("initial state", () => {
    test(
      "should display the login form in login mode with pre-filled credentials",
      { tag: "@login" },
      async ({ loginPage }) => {
        await expect(loginPage.elements.emailInput).toBeVisible();
        expect(await loginPage.elements.emailInput.inputValue()).toBe("test@flyff-idle.local");
        await expect(loginPage.elements.passwordInput).toBeVisible();
        expect(await loginPage.elements.passwordInput.inputValue()).toBe("password123");
        await expect(loginPage.elements.submitButton).toBeVisible();
        await expect(loginPage.elements.loginSelectButton).toBeVisible();
        await expect(loginPage.elements.registerSelectButton).toBeVisible();
      }
    );
  });

  test.describe("mode switching", () => {
    test("should switch from login mode to register mode", { tag: "@login" }, async ({ loginPage }) => {
      await loginPage.actions.selectRegisterMode();
      await expect(loginPage.elements.displayNameInput).toBeVisible();
      await expect(loginPage.elements.submitButton).toContainText("Create profile");
    });

    test("should switch from register mode back to login mode", { tag: "@login" }, async ({ loginPage }) => {
      await loginPage.actions.selectRegisterMode();
      await loginPage.actions.selectLoginMode();
      await expect(loginPage.elements.displayNameInput).toBeHidden();
      await expect(loginPage.elements.submitButton).toContainText("Log in");
    });

    test(
      "should clear the visible auth error when changing auth mode",
      { tag: "@login" },
      async ({ loginPage }) => {
        await loginPage.actions.login("test@flyff-idle.local", "wrongpassword");
        await expect(loginPage.elements.loginAuthErrorMessage).toBeVisible();
        await loginPage.actions.selectRegisterMode();
        await expect(loginPage.elements.loginAuthErrorMessage).toBeHidden();
      }
    );
  });

  test.describe("successful login", () => {
    test(
      "should store the returned session after successful login",
      { tag: "@login" },
      async ({ page, loginPage }) => {
        await loginPage.actions.login("test@flyff-idle.local", "password123");
        await expect(page).toHaveURL("/characters");
        await expect.poll(() => page.evaluate(() => localStorage.getItem("flyffIdleToken"))).not.toBeNull();
        await expect
          .poll(() => page.evaluate(() => localStorage.getItem("flyffIdleUser")))
          .toContain("test@flyff-idle.local");
      }
    );
  });

  test.describe("login errors", () => {
    test(
      "should display the invalid password error message",
      { tag: "@login" },
      async ({ page, loginPage }) => {
        await loginPage.actions.login("test@flyff-idle.local", "wrongpassword");
        await expect(loginPage.elements.loginAuthErrorMessage).toContainText(
          "That password does not match this player account."
        );
        await expect(page).not.toHaveURL("/characters");
      }
    );

    test(
      "should display the unknown account error message",
      { tag: "@login" },
      async ({ page, loginPage }) => {
        await loginPage.actions.login("unknown@flyff-idle.local", "password123");
        await expect(loginPage.elements.loginAuthErrorMessage).toContainText(
          "No player account exists for that email."
        );
        await expect(page).not.toHaveURL("/characters");
      }
    );
  });

  test.describe("validation smoke", () => {
    test("should not submit login with empty email", { tag: "@login" }, async ({ loginPage }) => {
      await loginPage.actions.login("", "password123");
      await expect(loginPage.elements.loginAuthErrorMessage).toContainText("Please enter your email address");
    });
  });
});
