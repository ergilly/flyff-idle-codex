import { fireEvent, render, screen } from "@testing-library/react";
import { buildItem } from "@/test/fixtures";
import { RecoveryPanel } from "./RecoveryPanel";

it("uses an equipped recovery item and allows changing its inventory slot", () => {
  const food = buildItem({
    id: "food",
    name: "Chicken Stick",
    category: "recovery",
    subcategory: "food",
    consumable: true,
    abilities: [{ parameter: "hp", add: 970, rate: false }]
  });
  const entry = {
    inventoryItem: { itemId: "food", quantity: 3, slotIndex: 4 },
    item: food,
    recoverAmount: 970
  };
  const onUse = jest.fn();
  const onEquip = jest.fn();
  render(
    <RecoveryPanel
      consumableLoadout={{ hp: { itemId: "food", quantity: 3 }, mp: null, fp: null }}
      cooldownRemainingByResource={{ hp: 0, mp: 0, fp: 0 }}
      itemsById={{ food }}
      onEquipConsumableItem={onEquip}
      onUseRecoveryItem={onUse}
      recoveryItemsByResource={{ hp: [entry], mp: [], fp: [] }}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: "Use Food recovery item" }));
  expect(onUse).toHaveBeenCalledWith("hp", expect.objectContaining({ item: food }));
  fireEvent.click(screen.getByRole("button", { name: "Food recovery item" }));
  fireEvent.click(screen.getByRole("menuitem", { name: /Chicken Stick/ }));
  expect(onEquip).toHaveBeenCalledWith("hp", 4);
});

it("blocks recovery while its cooldown is active", () => {
  const food = buildItem({ id: "food", name: "Food", category: "recovery", cooldown: 2 });
  render(
    <RecoveryPanel
      consumableLoadout={{ hp: { itemId: "food", quantity: 1 }, mp: null, fp: null }}
      cooldownRemainingByResource={{ hp: 1500, mp: 0, fp: 0 }}
      itemsById={{ food }}
      onUseRecoveryItem={jest.fn()}
      recoveryItemsByResource={{ hp: [], mp: [], fp: [] }}
    />
  );
  expect(screen.getByRole("button", { name: "Use Food recovery item" })).toBeDisabled();
  expect(screen.getByTestId("battle_span_food_cooldown_hp")).toHaveTextContent("2s");
});
