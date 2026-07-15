import { fireEvent, render, screen } from "@testing-library/react";
import { buildSkill } from "@/test/fixtures";
import { ActionWheel } from "./ActionWheel";

it("selects slots and removes a filled slot on a double click", () => {
  const skill = buildSkill({ name: "Clean Hit" });
  const onSelect = jest.fn();
  const onRemove = jest.fn();
  render(
    <ActionWheel
      actionSlots={[skill, null, null, null, null, null]}
      onAddSkillToActionSlot={jest.fn()}
      onInsertSkillAtActionSlot={jest.fn()}
      onMoveActionSlot={jest.fn()}
      onRemoveActionSlot={onRemove}
      onSelectActionSlot={onSelect}
      selectedActionSlotIndex={0}
      skills={[skill]}
    />
  );
  const slot = screen.getByRole("button", { name: "Action slot 1: Clean Hit" });
  expect(slot).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(slot, { detail: 1 });
  fireEvent.click(slot, { detail: 2 });
  expect(onSelect).toHaveBeenCalled();
  expect(onRemove).toHaveBeenCalledWith(0);
});
