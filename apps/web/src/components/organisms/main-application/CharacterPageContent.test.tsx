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

    expect(screen.getByText("ATK")).toBeInTheDocument();
    expect(screen.getByText("Equipment")).toBeInTheDocument();
    expect(screen.getByText("Skills")).toBeInTheDocument();
  });
});
