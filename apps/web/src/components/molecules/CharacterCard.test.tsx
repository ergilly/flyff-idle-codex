import { render, screen } from "@testing-library/react";
import { CharacterCard } from "./CharacterCard";

describe("CharacterCard", () => {
  it("renders character summary stats", () => {
    render(
      <CharacterCard
        character={{
          id: "char-1",
          name: "Blade Runner",
          job: "Mercenary",
          level: 20,
          exp: 1500,
          penya: 0,
          stats: {
            str: 15,
            sta: 15,
            dex: 15,
            int: 15
          },
          equipment: {
            helmet: null,
            suit: null,
            gloves: null,
            boots: null,
            flying: null,
            csBoots: null,
            csGloves: null,
            csSuit: null,
            csHelm: null,
            mask: null,
            cloak: null,
            ammo: null,
            offhand: null,
            mainhand: null,
            ringR: null,
            earringR: null,
            necklace: null,
            earringL: null,
            ringL: null
          },
          inventory: {
            size: 50,
            items: []
          }
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Blade Runner" })).toBeInTheDocument();
    expect(screen.getByText("Mercenary")).toBeInTheDocument();
    expect(screen.getByText("1500")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Mercenary class logo" }).getAttribute("src")).toContain(
      "%2Fimages%2Fclasses%2Fmercenary.png"
    );
  });

  it("renders an empty slot action when no character exists", () => {
    render(<CharacterCard slotNumber={3} />);

    expect(screen.getByRole("button", { name: "Create character in slot 3" })).toBeInTheDocument();
  });
});
