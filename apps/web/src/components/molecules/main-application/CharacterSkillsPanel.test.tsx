import { fireEvent, render, screen } from "@testing-library/react";
import { CharacterSkillsPanel } from "./CharacterSkillsPanel";
import { buildCharacter, buildSkill, buildSkillTab } from "@/test/fixtures";

describe("CharacterSkillsPanel", () => {
  it("selects and edits pending skill levels", () => {
    const skill = buildSkill();
    const onAddSkillLevel = jest.fn();
    const onRemoveSkillLevel = jest.fn();
    const onApplySkills = jest.fn();
    const onResetSkills = jest.fn();
    render(
      <CharacterSkillsPanel
        availableSkillPoints={3}
        character={buildCharacter({ skillLevels: { clean: 1 } })}
        onAddSkillLevel={onAddSkillLevel}
        onApplySkills={onApplySkills}
        onCanRemoveSkillLevel={() => true}
        onRemoveSkillLevel={onRemoveSkillLevel}
        onResetSkills={onResetSkills}
        pendingSkillLevels={{ clean: 1 }}
        skillTabs={[buildSkillTab({ skills: [skill] })]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Select Clean Hit" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Clean Hit level" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove pending Clean Hit level" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(onAddSkillLevel).toHaveBeenCalledWith(expect.objectContaining({ id: "clean" }));
    expect(onRemoveSkillLevel).toHaveBeenCalledWith(expect.objectContaining({ id: "clean" }));
    expect(onApplySkills).toHaveBeenCalled();
    expect(onResetSkills).toHaveBeenCalled();
  });
});
