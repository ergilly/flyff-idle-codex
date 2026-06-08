import { render, screen } from "@testing-library/react";
import { CharacterSelectionPage } from "./CharacterSelectionPage";
import { LoginPage } from "./LoginPage";

jest.mock("@/components/organisms/character-select/CharacterRoster", () => ({
  CharacterRoster: () => <div>Roster content</div>
}));

jest.mock("@/components/organisms/login/LoginForm", () => ({
  LoginForm: () => <form>Login form content</form>
}));

describe("page composition", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders the login page shell", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByText("Login form content")).toBeInTheDocument();
  });

  it("renders the character selection shell", () => {
    render(<CharacterSelectionPage />);

    expect(screen.getByRole("heading", { name: "Pick your adventurer" })).toBeInTheDocument();
    expect(screen.getByText("Roster content")).toBeInTheDocument();
  });
});
