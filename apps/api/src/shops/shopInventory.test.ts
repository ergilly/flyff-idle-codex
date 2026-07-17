import { getFlarineGeneralStoreStockItem, getTownShop, getTownShopStockItem } from "./shopInventory.js";

describe("shop inventory", () => {
  it("finds local shops and stock across merchant tabs", () => {
    expect(getTownShop("flarine-town", "general-store")?.id).toBe("flarine-town/general-store");
    expect(getFlarineGeneralStoreStockItem("3907")?.name).toBeTruthy();
  });

  it("returns null for unknown shops and stock", () => {
    expect(getTownShop("unknown", "unknown")).toBeNull();
    expect(getTownShopStockItem("flarine-town", "general-store", "not-stocked")).toBeNull();
  });
});
