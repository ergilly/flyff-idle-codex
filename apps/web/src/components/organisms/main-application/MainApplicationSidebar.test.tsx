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
    onToggleMobileNav: jest.fn(),
    ...overrides
  };
  render(<MainApplicationSidebar {...props} />);
  return props;
}

describe("MainApplicationSidebar", () => {
  it("exposes the collapsed navigation toggle and forwards map selection", () => {
    const props = renderSidebar({ isMobileNavOpen: false, isProfileMenuOpen: false });
    const toggle = screen.getByRole("button", { name: "Flyff Idle" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(props.onToggleMobileNav).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Map" }));
    expect(props.onSelectNavItem).toHaveBeenCalledWith("Map");
  });

  it("routes admin navigation", () => {
    const props = renderSidebar();
    fireEvent.click(screen.getByRole("button", { name: "Quests" }));
    fireEvent.click(screen.getByRole("button", { name: "Admin" }));

    expect(props.onSelectNavItem).toHaveBeenCalledWith("Quests");
    expect(props.onSelectNavItem).toHaveBeenCalledWith("Admin");
  });

  it("hides admin navigation for non-admin users", () => {
    renderSidebar({ isAdmin: false, isMobileNavOpen: false, isProfileMenuOpen: false });

    expect(screen.queryByRole("button", { name: "Admin" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("game_sidebar_button_theme_toggle")).not.toBeInTheDocument();
  });
});
