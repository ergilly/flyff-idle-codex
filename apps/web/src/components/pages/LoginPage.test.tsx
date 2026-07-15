import { render, screen } from "@testing-library/react";
import { LoginPage } from "./LoginPage";

jest.mock("@/components/organisms/login/LoginForm", () => ({
  LoginForm: () => <form>Login form content</form>
}));

describe("LoginPage", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders the login page shell", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByText("Login form content")).toBeInTheDocument();
  });
});
