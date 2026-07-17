import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { GeneralStorePanel } from "./GeneralStorePanel";
import { type ShopInventoryItem } from "@/lib/townShops";

describe("GeneralStorePanel", () => {
  it("selects an armory NPC outside the NPC's inventory tabs", () => {
    render(
      <GeneralStorePanel
        shopName="Armory"
        shopMerchants={[
          {
            id: "weapon-npc",
            name: "Boboku",
            tabs: [
              {
                id: "weapon-mercenary",
                label: "Mercenary",
                items: [item("1", "Sword")]
              }
            ]
          },
          {
            id: "armor-npc",
            name: "Boboko",
            tabs: [
              {
                id: "armor-assist",
                label: "Assist",
                items: [item("2", "Cotton Suit")]
              },
              {
                id: "armor-acrobat",
                label: "Acrobat",
                items: [item("3", "Layered Suit")]
              }
            ]
          }
        ]}
      />
    );

    expect(screen.getByRole("tablist", { name: "Armory merchants" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Boboku" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Mercenary" })).toHaveAttribute("aria-selected", "true");

    fireEvent.click(screen.getByRole("tab", { name: "Boboko" }));

    expect(screen.getByRole("tab", { name: "Boboko" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Assist" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("map_panel_general_store_price")).toHaveTextContent("Cotton Suit");
  });

  it("shows item information as a hover and keyboard-focus overlay", () => {
    render(
      <GeneralStorePanel shopTabs={[{ id: "weapons", label: "Weapons", items: [item("1", "Sword")] }]} />
    );

    const slot = screen.getByRole("button", { name: "Sword, 100 Penya" });
    fireEvent.mouseEnter(slot);

    expect(screen.getByTestId("shop_item_details_overlay")).toBeInTheDocument();
    const details = screen.getByRole("complementary", { name: "Sword details" });
    expect(details).toHaveTextContent("Level15");
    expect(details).toHaveTextContent("Shop price100 Penya");

    fireEvent.mouseLeave(slot);
    expect(screen.queryByTestId("shop_item_details_overlay")).not.toBeInTheDocument();

    fireEvent.focus(slot);
    expect(screen.getByTestId("shop_item_details_overlay")).toBeInTheDocument();
    fireEvent.blur(slot);
    expect(screen.queryByTestId("shop_item_details_overlay")).not.toBeInTheDocument();
  });

  it("filters items by the character's sex and level requirements", () => {
    render(
      <GeneralStorePanel
        characterLevel={15}
        characterSex="male"
        shopTabs={[
          {
            id: "armor",
            label: "Armor",
            items: [
              item("1", "Universal Hat", { level: 1 }),
              item("2", "Male Suit", { level: 10, sex: "male" }),
              item("3", "Female Suit", { level: 10, sex: "female" }),
              item("4", "High Level Suit", { level: 20, sex: "male" })
            ]
          }
        ]}
      />
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "By sex" }));
    expect(screen.getByRole("button", { name: "Universal Hat, 100 Penya" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Male Suit, 100 Penya" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Female Suit, 100 Penya" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "High Level Suit, 100 Penya" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: "By level" }));
    expect(screen.queryByRole("button", { name: "High Level Suit, 100 Penya" })).not.toBeInTheDocument();
  });

  it("filters equipment by the character's class lineage", () => {
    render(
      <GeneralStorePanel
        characterJob="Blade"
        shopTabs={[
          {
            id: "weapons",
            label: "Weapons",
            items: [
              item("1", "Mercenary Sword", { requiredJob: "Mercenary" }),
              item("2", "Assist Knuckle", { requiredJob: "Assist" }),
              item("3", "Training Sword", { requiredJob: null })
            ]
          }
        ]}
      />
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "By class" }));

    expect(screen.getByRole("button", { name: "Mercenary Sword, 100 Penya" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Assist Knuckle, 100 Penya" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Training Sword, 100 Penya" })).toBeInTheDocument();
  });

  it("uses the shared transaction panel to sell inventory stacks", async () => {
    const onSellItem = jest.fn().mockResolvedValue(undefined);
    const sword = item("1", "Sword", { sellPrice: 25, stack: 9999 });
    render(
      <GeneralStorePanel
        characterInventory={{ size: 2, items: [{ slotIndex: 0, itemId: "1", quantity: 3 }] }}
        itemsById={{ "1": sword }}
        onSellItem={onSellItem}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Sword, 25 Penya" }));

    expect(screen.getByTestId("map_panel_general_store_price")).toHaveTextContent(
      "SwordSell price: 25 Penya each"
    );
    const quantity = screen.getByRole("spinbutton", { name: "Purchase quantity" });
    expect(quantity).toHaveAttribute("max", "3");
    fireEvent.change(quantity, { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Sell 2 Sword" }));

    await waitFor(() => expect(onSellItem).toHaveBeenCalledWith(0, 2));
  });

  it("hides inventory quantities for items that cannot stack", () => {
    const sword = item("1", "Sword", { sellPrice: 25, stack: 1 });
    const arrows = item("2", "Arrows", { sellPrice: 1, stack: 9999 });
    render(
      <GeneralStorePanel
        characterInventory={{
          size: 2,
          items: [
            { slotIndex: 0, itemId: "1", quantity: 1 },
            { slotIndex: 1, itemId: "2", quantity: 3 }
          ]
        }}
        itemsById={{ "1": sword, "2": arrows }}
      />
    );

    expect(screen.getAllByTestId("shop_item_quantity")).toHaveLength(1);
    expect(screen.getByTestId("shop_item_quantity")).toHaveTextContent("3");
  });
});

function item(id: string, name: string, overrides: Partial<ShopInventoryItem> = {}): ShopInventoryItem {
  return {
    abilities: [],
    attackSpeed: null,
    category: "weapon",
    description: "A useful test weapon.",
    icon: "test.png",
    id,
    level: 15,
    maxAttack: 12,
    maxDefense: null,
    maxStack: 1,
    minAttack: 10,
    minDefense: null,
    name,
    price: 100,
    rarity: "common",
    requiredJob: "Mercenary",
    sex: null,
    subcategory: "sword",
    twoHanded: false,
    ...overrides
  };
}
