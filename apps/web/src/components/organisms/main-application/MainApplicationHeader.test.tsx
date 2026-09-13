import { render, screen } from "@testing-library/react";
import { MainApplicationHeader } from "./MainApplicationHeader";
import { buildCharacter } from "@/test/fixtures";

describe("MainApplicationHeader", () => {
  it("renders character identity and experience progress", () => {
    render(
      <MainApplicationHeader
        character={buildCharacter({ name: "Saint Morning", gender: "female", level: 65, location: "Flaris" })}
        currentHp={123}
        maxHp={200}
        isProfileMenuOpen={false}
        onChangeCharacter={jest.fn()}
        onLogout={jest.fn()}
        onProfileMenuToggle={jest.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Saint Morning" })).toBeInTheDocument();
    expect(screen.getByTestId("game_header_strong_stat_sex_value")).toHaveTextContent("Female");
    expect(screen.getByTestId("game_header_strong_stat_location_value")).toHaveTextContent("Flaris");
    expect(screen.getByTestId("game_header_strong_stat_hp_value")).toHaveTextContent("123 / 200");
    expect(screen.getByTestId("game_header_div_hp_bar_fill")).toHaveStyle({ width: "61.5%" });
    expect(screen.getByTestId("game_header_div_exp_bar")).toHaveAttribute("title", "0 / 22,280,630");
  });
});
