import { render, screen } from "@testing-library/react";
import { CharacterSelectionPage } from "./CharacterSelectionPage";

jest.mock("@/components/organisms/character-select/CharacterRoster", () => ({
  CharacterRoster: () => <div>Roster content</div>
}));

describe("CharacterSelectionPage", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders the character selection shell", () => {
    render(<CharacterSelectionPage />);

    expect(screen.getByRole("heading", { name: "Pick your adventurer" })).toBeInTheDocument();
    expect(screen.getByText("Roster content")).toBeInTheDocument();
  });
});
