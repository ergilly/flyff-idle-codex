import { render, screen } from "@testing-library/react";
import { buildItem, buildMonsterFamily } from "@/test/fixtures";
import { MonsterMarkerLayer } from "./MonsterMarkerLayer";

it("resolves map quest-drop images from item metadata like the combat drops overlay", () => {
  const monsterFamily = buildMonsterFamily({
    family: "aibatt",
    name: "Aibatt",
    location: { region: "flaris", x: 10, y: 20 },
    questDrops: [{ id: 100, name: "Stale name", icon: "stale-icon.png" }]
  });

  render(
    <MonsterMarkerLayer
      itemsById={{
        "100": buildItem({ id: "100", name: "Twinkle Stone", icon: "twinkle-stone.png" })
      }}
      markers={[
        {
          description: "Spawn marker for Aibatt.",
          family: "aibatt",
          iconSrc: "/aibatt.png",
          id: "aibatt-marker",
          label: "Aibatt",
          markerType: "monster",
          scale: 1,
          x: 10,
          y: 20
        }
      ]}
      monsterFamiliesByMarkerId={{ "aibatt-marker": monsterFamily }}
    />
  );

  const questDrop = screen.getByTestId("map_span_monster_quest_drop_aibatt_100");
  const itemName = screen.getByText("Twinkle Stone");
  const itemIcon = screen.getByTestId("map_span_monster_quest_drop_icon_aibatt_100");

  expect(itemName.compareDocumentPosition(itemIcon) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(questDrop).toHaveClass("grid-cols-[minmax(0,auto)_28px]", "justify-end");
  expect(itemIcon).toHaveClass("h-7", "w-7");
  expect(itemIcon.querySelector("img")).toHaveAttribute(
    "src",
    "http://localhost:4000/api/images/item/twinkle-stone.png"
  );
});
