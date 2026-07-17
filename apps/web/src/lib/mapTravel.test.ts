import { getFlyingItemTier, getInventoryItemQuantity, getRegionIdForLocation } from "@/lib/mapTravel";

describe("map travel rules", () => {
  it("maps flying items to their travel tier", () => {
    expect(getFlyingItemTier("8507")).toBe(1);
    expect(getFlyingItemTier("4715")).toBe(4);
    expect(getFlyingItemTier("unknown")).toBe(0);
    expect(getFlyingItemTier()).toBe(0);
  });

  it("totals matching Blinkwing stacks", () => {
    expect(
      getInventoryItemQuantity(
        {
          size: 3,
          items: [
            { itemId: "1", quantity: 2, slotIndex: 0 },
            { itemId: "2", quantity: 5, slotIndex: 1 },
            { itemId: "1", quantity: 3, slotIndex: 2 }
          ]
        },
        "1"
      )
    ).toBe(5);
    expect(getInventoryItemQuantity(undefined, "1")).toBe(0);
  });

  it("resolves persisted labels case-insensitively", () => {
    expect(getRegionIdForLocation("  saint morning ")).toBe("saint");
    expect(getRegionIdForLocation("Unknown")).toBeUndefined();
  });
});
