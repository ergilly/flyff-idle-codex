import { toSellItem } from "@/lib/shopInventory";
import { buildItem } from "@/test/fixtures";

describe("toSellItem", () => {
  it("maps inventory metadata to a sellable shop item", () => {
    const item = buildItem({ id: "10", icon: "icon.png", sellPrice: 25 });

    expect(toSellItem({ itemId: "10", quantity: 3, slotIndex: 1 }, { "10": item })).toEqual(
      expect.objectContaining({ id: "10", maxStack: 3, price: 25 })
    );
  });

  it("omits inventory entries without usable metadata", () => {
    expect(toSellItem({ itemId: "10", quantity: 3, slotIndex: 1 }, {})).toBeUndefined();
  });
});
