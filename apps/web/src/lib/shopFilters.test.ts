import { meetsShopFilters } from "@/lib/shopFilters";
import type { ShopInventoryItem } from "@/lib/townShops";

const item = {
  id: "1",
  name: "Test Suit",
  icon: "test.png",
  level: 20,
  maxStack: 1,
  price: 100,
  sex: "Male"
} as ShopInventoryItem;

describe("meetsShopFilters", () => {
  it("ignores requirements when their filters are disabled", () => {
    expect(
      meetsShopFilters(item, {
        characterLevel: 1,
        characterJob: "Assist",
        characterSex: "female",
        filterByClass: false,
        filterByLevel: false,
        filterBySex: false
      })
    ).toBe(true);
  });

  it("requires the character to meet enabled sex and level filters", () => {
    expect(
      meetsShopFilters(item, {
        characterLevel: 20,
        filterByClass: false,
        characterSex: "male",
        filterByLevel: true,
        filterBySex: true
      })
    ).toBe(true);
    expect(
      meetsShopFilters(item, {
        characterLevel: 19,
        filterByClass: false,
        characterSex: "male",
        filterByLevel: true,
        filterBySex: true
      })
    ).toBe(false);
    expect(
      meetsShopFilters(item, {
        characterLevel: 20,
        filterByClass: false,
        characterSex: "female",
        filterByLevel: true,
        filterBySex: true
      })
    ).toBe(false);
  });

  it("allows unrestricted items through enabled filters", () => {
    expect(
      meetsShopFilters(
        { ...item, level: null, sex: null },
        {
          filterByClass: false,
          filterByLevel: true,
          filterBySex: true
        }
      )
    ).toBe(true);
  });

  it("matches class requirements across the character's job lineage", () => {
    const mercenaryItem = { ...item, requiredJob: "Mercenary" };

    expect(
      meetsShopFilters(mercenaryItem, {
        characterJob: "Blade",
        filterByClass: true,
        filterByLevel: false,
        filterBySex: false
      })
    ).toBe(true);
    expect(
      meetsShopFilters(mercenaryItem, {
        characterJob: "Assist",
        filterByClass: true,
        filterByLevel: false,
        filterBySex: false
      })
    ).toBe(false);
    expect(
      meetsShopFilters(
        { ...item, requiredJob: null },
        {
          characterJob: "Assist",
          filterByClass: true,
          filterByLevel: false,
          filterBySex: false
        }
      )
    ).toBe(true);
  });
});
