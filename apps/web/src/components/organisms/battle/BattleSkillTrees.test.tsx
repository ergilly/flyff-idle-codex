import { fireEvent, render, screen } from "@testing-library/react";
import { buildCharacter, buildSkill, buildSkillTab } from "@/test/fixtures";
import { BattleSkillTrees } from "./BattleSkillTrees";

it("renders an explicit empty state", () => {
  render(<BattleSkillTrees character={buildCharacter()} onAddSkillToActionSlot={jest.fn()} skillTabs={[]} />);
  expect(screen.getByText("No skill trees are available yet.")).toBeInTheDocument();
});

it("switches tabs and double-click adds learned skills only", () => {
  const learned = buildSkill({ id: "learned", name: "Learned Skill" });
  const locked = buildSkill({ id: "locked", name: "Locked Skill" });
  const onAdd = jest.fn();
  render(
    <BattleSkillTrees
      character={buildCharacter({ skillLevels: { learned: 1 } })}
      onAddSkillToActionSlot={onAdd}
      skillTabs={[
        buildSkillTab({ tier: "vagrant", label: "First", skills: [learned] }),
        buildSkillTab({ tier: "first", label: "Second", skills: [locked] })
      ]}
    />
  );
  fireEvent.click(screen.getByRole("tab", { name: "First" }));
  const learnedButton = screen.getByRole("button", { name: "Add Learned Skill to action bar" });
  fireEvent.click(learnedButton, { detail: 1 });
  fireEvent.click(learnedButton, { detail: 2 });
  expect(onAdd).toHaveBeenCalledWith(learned);
  fireEvent.click(screen.getByRole("tab", { name: "Second" }));
  const lockedButton = screen.getByRole("button", { name: "Unavailable Locked Skill to action bar" });
  fireEvent.click(lockedButton, { detail: 1 });
  fireEvent.click(lockedButton, { detail: 2 });
  expect(onAdd).toHaveBeenCalledTimes(1);
});
