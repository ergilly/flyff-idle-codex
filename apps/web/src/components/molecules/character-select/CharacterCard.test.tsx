import { fireEvent, render, screen } from "@testing-library/react";
import { CharacterCard } from "./CharacterCard";

describe("CharacterCard", () => {
  it("renders character summary stats", () => {
    const onDelete = jest.fn();
    const onSelect = jest.fn();

    render(
      <CharacterCard
        onDelete={onDelete}
        onSelect={onSelect}
        character={{
          id: "char-1",
          slotIndex: 0,
          name: "Blade Runner",
          gender: "male",
          job: "Mercenary",
          progressionRank: "normal",
          level: 20,
          exp: 1500,
          penya: 0,
          stats: {
            str: 15,
            sta: 15,
            dex: 15,
            int: 15
          },
          skillLevels: {},
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
    fireEvent.click(screen.getByRole("button", { name: "Select Blade Runner" }));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "char-1" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Blade Runner" }));

    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: "char-1" }));
    expect(screen.getByRole("img", { name: "Mercenary class logo" }).getAttribute("src")).toContain(
      "%2Fimages%2Fclasses%2Fmercenary.png"
    );
  });

  it("renders an empty slot action when no character exists", () => {
    render(<CharacterCard slotNumber={3} />);

    expect(screen.getByRole("button", { name: "Create character in slot 3" })).toBeInTheDocument();
  });

  it("falls back to the vagrant image for unknown jobs", () => {
    render(
      <CharacterCard
        character={{
          id: "char-2",
          slotIndex: 1,
          name: "Mystery",
          gender: "female",
          job: "Unknown",
          progressionRank: "normal",
          level: 1,
          exp: 0,
          penya: 0,
          stats: {
            str: 15,
            sta: 15,
            dex: 15,
            int: 15
          },
          skillLevels: {},
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

    expect(screen.getByRole("img", { name: "Unknown class logo" }).getAttribute("src")).toContain(
      "%2Fimages%2Fclasses%2Fvagrant.png"
    );
  });
});
