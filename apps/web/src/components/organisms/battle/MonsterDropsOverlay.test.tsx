import { fireEvent, render, screen } from "@testing-library/react";
import { buildItem, buildMonster, buildMonsterFamily } from "@/test/fixtures";
import { MonsterDropsOverlay } from "./MonsterDropsOverlay";

it("groups drops, toggles a category, and closes", () => {
  const onClose = jest.fn();
  const variant = buildMonster({
    minDropGold: 2,
    maxDropGold: 5,
    drops: [{ item: 10, probabilityRange: "10%" }]
  });
  render(
    <MonsterDropsOverlay
      itemsById={{
        "10": buildItem({ id: "10", name: "Iron Ore", category: "material", subcategory: "upgrade" })
      }}
      monsterFamily={buildMonsterFamily({ variants: [variant] })}
      onClose={onClose}
      selectedVariant={variant}
    />
  );
  expect(screen.getByTestId("battle_strong_info_value_penya")).toHaveTextContent("2 - 5");
  const heading = screen.getByRole("button", { name: "Upgrade Materials" });
  expect(screen.getByText("Iron Ore")).toBeInTheDocument();
  const drop = screen.getByRole("button", { name: "Iron Ore" });
  fireEvent.focus(drop);
  expect(screen.getByRole("complementary", { name: "Iron Ore details" })).toBeInTheDocument();
  fireEvent.blur(drop);
  expect(screen.queryByRole("complementary", { name: "Iron Ore details" })).not.toBeInTheDocument();
  fireEvent.click(heading);
  expect(screen.queryByText("Iron Ore")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it("shows an empty state without a target", () => {
  render(
    <MonsterDropsOverlay itemsById={{}} monsterFamily={null} onClose={jest.fn()} selectedVariant={null} />
  );
  expect(screen.getByRole("dialog", { name: "Monster drops: No target" })).toBeInTheDocument();
  expect(screen.getByText("No drops are listed for this monster.")).toBeInTheDocument();
});
