import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { buildMonster, buildMonsterFamily } from "@/test/fixtures";
import { MonsterPanel } from "./MonsterPanel";

function renderPanel(overrides: Partial<ComponentProps<typeof MonsterPanel>> = {}) {
  const handlers = {
    onDeleteDroppedItems: jest.fn(),
    onLootAllDroppedItems: jest.fn(),
    onLootDroppedItem: jest.fn(),
    onLootSelectedDroppedItem: jest.fn(),
    onPauseCombat: jest.fn(),
    onRunAway: jest.fn(),
    onSelectDroppedItem: jest.fn(),
    onStartCombat: jest.fn()
  };
  const result = render(
    <MonsterPanel
      autoAttackDamage={null}
      battleOutcome="fighting"
      droppedItems={[]}
      isAttackTimelineActive={false}
      isCombatInProgress={false}
      isLootPending={false}
      isPauseAfterCurrentMonster={false}
      itemsById={{}}
      monsterAttack={null}
      monsterExperience={null}
      monsterFamily={null}
      monsterHp={null}
      monsterMaxHp={null}
      {...handlers}
      selectedDroppedItemId={null}
      selectedVariant={null}
      {...overrides}
    />
  );
  return { ...result, handlers };
}

it("renders the no-target state without combat controls", () => {
  renderPanel();
  expect(screen.getByText("Select a monster from the map to prepare a battle target.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Start combat" })).not.toBeInTheDocument();
});

it("starts combat and opens and closes the selected monster's drops", () => {
  const variant = buildMonster();
  const { handlers } = renderPanel({
    monsterFamily: buildMonsterFamily({ variants: [variant] }),
    monsterHp: 500,
    monsterMaxHp: 1000,
    selectedVariant: variant
  });
  fireEvent.click(screen.getByRole("button", { name: "Start combat" }));
  expect(handlers.onStartCombat).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "View monster drops" }));
  expect(screen.getByRole("dialog", { name: /Aibatt/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
