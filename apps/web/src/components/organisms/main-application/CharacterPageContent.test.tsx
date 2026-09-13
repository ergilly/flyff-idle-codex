import { render, screen } from "@testing-library/react";
import { CharacterPageContent } from "./CharacterPageContent";
import { buildCharacter, buildSkillTab } from "@/test/fixtures";

describe("CharacterPageContent", () => {
  it("composes stats, equipment, and skills sections", () => {
    render(
      <CharacterPageContent
        activeEquipmentSet={0}
        appliedStats={{ str: 0, sta: 0, dex: 0, int: 0 }}
        availableSkillPoints={3}
        availableStatPoints={2}
        character={buildCharacter()}
        detailStats={[{ label: "ATK", value: 100 }]}
        itemsById={{}}
        onAddSkillLevel={jest.fn()}
        onAddStat={jest.fn()}
        onApplySkills={jest.fn()}
        onApplyStats={jest.fn()}
        onCanRemoveSkillLevel={() => true}
        onClearStat={jest.fn()}
        onEquipmentSetChange={jest.fn()}
        onMaxStat={jest.fn()}
        onRemoveSkillLevel={jest.fn()}
        onRemoveStat={jest.fn()}
        onResetSkills={jest.fn()}
        onResetStats={jest.fn()}
        onSelectEquipmentSlot={jest.fn()}
        onSetStat={jest.fn()}
        onUnequipEquipmentSlot={jest.fn()}
        pendingSkillLevels={{}}
        pendingStats={{ str: 0, sta: 0, dex: 0, int: 0 }}
        selectedEquipmentSlot={null}
        skillTabs={[buildSkillTab()]}
        statKeys={["str", "sta", "dex", "int"]}
      />
    );

    expect(screen.getByText("Combat snapshot")).toBeInTheDocument();
    expect(screen.queryByTestId("character_stat_name")).not.toBeInTheDocument();
    expect(screen.queryByTestId("character_stat_job")).not.toBeInTheDocument();
    expect(screen.queryByTestId("character_stat_level")).not.toBeInTheDocument();
    expect(screen.getByText("Equipment")).toBeInTheDocument();
    expect(screen.getByText("Skills")).toBeInTheDocument();
    expect(screen.getByTestId("character_div_equipment_column")).toBeInTheDocument();
    expect(screen.getByTestId("character_div_skills_row")).toBeInTheDocument();
    expect(screen.getByTestId("character_div_setup_column")).toContainElement(
      screen.getByTestId("character_div_skills_row")
    );
    expect(screen.getByTestId("character_section_workspace")).toHaveClass(
      "min-[640px]:grid-cols-[minmax(240px,360px)_minmax(0,1fr)]"
    );
    expect(screen.getByTestId("character_div_setup_column")).toHaveClass(
      "min-[640px]:grid-cols-[minmax(0,1fr)_minmax(220px,0.45fr)]"
    );
    expect(screen.getByTestId("character_div_setup_column")).toHaveClass("h-full");
    expect(screen.getByTestId("character_div_equipment_column")).toHaveClass("h-full");
    expect(screen.getByTestId("character_div_skills_row")).toHaveClass("h-full");
    expect(screen.getByTestId("character_div_page")).toHaveClass("h-full");
    expect(screen.getByTestId("character_div_page")).toHaveClass("self-stretch");
  });
});
