import { fireEvent, render, screen } from "@testing-library/react";
import { MainApplicationSidebar } from "./MainApplicationSidebar";

function renderSidebar(overrides: Partial<React.ComponentProps<typeof MainApplicationSidebar>> = {}) {
  const props: React.ComponentProps<typeof MainApplicationSidebar> = {
    activeNavItem: "Inventory",
    characterName: "Saint Morning",
    isAdmin: true,
    isMobileNavOpen: true,
    isProfileMenuOpen: true,
    onChangeCharacter: jest.fn(),
    onLogout: jest.fn(),
    onProfileMenuToggle: jest.fn(),
    onSelectNavItem: jest.fn(),
    onThemeToggle: jest.fn(),
    onToggleMobileNav: jest.fn(),
    theme: "dark",
    ...overrides
  };
  render(<MainApplicationSidebar {...props} />);
  return props;
}

describe("MainApplicationSidebar", () => {
  it("routes admin and theme actions", () => {
    const props = renderSidebar();
    fireEvent.click(screen.getByRole("button", { name: "Admin" }));
    fireEvent.click(screen.getByRole("button", { name: "Light mode" }));

    expect(props.onSelectNavItem).toHaveBeenCalledWith("Admin");
    expect(props.onThemeToggle).toHaveBeenCalled();
  });

  it("hides admin navigation and offers dark mode to non-admin users", () => {
    renderSidebar({ isAdmin: false, isMobileNavOpen: false, isProfileMenuOpen: false, theme: "light" });

    expect(screen.queryByRole("button", { name: "Admin" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dark mode" })).toBeInTheDocument();
  });
});
