import { render, screen } from "@testing-library/react";
import { ItemDetailsHoverOverlay } from "./ItemDetailsHoverOverlay";
import type { ItemMetadata } from "@/lib/api";

const item: ItemMetadata = {
  id: "1",
  name: "Hover Sword",
  description: "A sword shown on hover.",
  icon: null,
  category: "weapon",
  subcategory: "sword",
  rarity: "common",
  level: 1,
  sex: null,
  requiredJob: null,
  minAttack: 1,
  maxAttack: 2,
  attackSpeed: "fast",
  twoHanded: false,
  minDefense: null,
  maxDefense: null,
  abilities: []
};

describe("ItemDetailsHoverOverlay", () => {
  it("renders the shared item details panel in a portal", () => {
    render(
      <ItemDetailsHoverOverlay
        item={item}
        rect={{ bottom: 70, height: 50, left: 20, right: 70, top: 20, width: 50, x: 20, y: 20 } as DOMRect}
      />
    );
    expect(screen.getByTestId("item_details_hover_overlay")).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Hover Sword details" })).toBeInTheDocument();
  });
});
