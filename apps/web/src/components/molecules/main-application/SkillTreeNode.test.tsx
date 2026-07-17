import { fireEvent, render, screen } from "@testing-library/react";
import { SkillTreeNode } from "./SkillTreeNode";
import { buildCharacter, buildSkill } from "@/test/fixtures";

describe("SkillTreeNode", () => {
  it("selects accessibly and exposes the skill details on keyboard focus", () => {
    const onSelect = jest.fn();
    const skill = buildSkill({ id: "slash", name: "Slash", maxLevel: 10 });
    render(
      <SkillTreeNode
        appliedLevel={2}
        character={buildCharacter()}
        displayedSkillLevels={{ slash: 2 }}
        isSelected={false}
        level={2}
        onSelect={onSelect}
        pendingLevel={0}
        skill={skill}
      />
    );

    const button = screen.getByRole("button", { name: "Select Slash" });
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Level 2/10");
  });
});
