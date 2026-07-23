import { fireEvent, render, screen } from "@testing-library/react";
import { buildItem } from "@/test/fixtures";
import { MonsterDroppedItemsPanel } from "./MonsterDroppedItemsPanel";

it("selects, double-click loots, and exposes bulk actions for drops", () => {
  const drop = { itemId: "gem", quantity: 2 };
  const handlers = {
    onDeleteDroppedItems: jest.fn(),
    onLootAllDroppedItems: jest.fn(),
    onLootDroppedItem: jest.fn(),
    onLootSelectedDroppedItem: jest.fn(),
    onSelectDroppedItem: jest.fn()
  };
  render(
    <MonsterDroppedItemsPanel
      droppedItems={[drop]}
      isLootPending={false}
      itemsById={{ gem: buildItem({ id: "gem", name: "Rare Gem", rarity: "rare" }) }}
      {...handlers}
      selectedDroppedItemId="gem"
    />
  );
  const item = screen.getByRole("button", { name: "Select dropped item Rare Gem" });
  fireEvent.mouseEnter(item);
  expect(screen.getByRole("complementary", { name: "Rare Gem details" })).toBeInTheDocument();
  fireEvent.mouseLeave(item);
  expect(screen.queryByRole("complementary", { name: "Rare Gem details" })).not.toBeInTheDocument();
  fireEvent.click(item);
  fireEvent.doubleClick(item);
  fireEvent.click(screen.getByRole("button", { name: "Loot all" }));
  fireEvent.click(screen.getByRole("button", { name: "Loot" }));
  expect(handlers.onSelectDroppedItem).toHaveBeenCalledWith("gem");
  expect(handlers.onLootDroppedItem).toHaveBeenCalledWith(drop);
  expect(handlers.onLootAllDroppedItems).toHaveBeenCalledTimes(1);
  expect(handlers.onLootSelectedDroppedItem).toHaveBeenCalledTimes(1);
  expect(screen.getByText("x2")).toBeInTheDocument();
});
