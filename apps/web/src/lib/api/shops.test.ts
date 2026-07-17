import { fetchTownShop, purchaseTownShopItem } from "@/lib/api/shops";
import { buildCharacter } from "@/test/fixtures";

function mockFetch(response: Partial<Response>) {
  global.fetch = jest.fn().mockResolvedValue(response) as jest.Mock;
  return jest.mocked(global.fetch);
}

describe("shop API", () => {
  it("loads a town shop", async () => {
    const shop = { id: "flarine-town/general-store", merchantNames: [], merchants: [] };
    mockFetch({ ok: true, json: jest.fn().mockResolvedValue({ shop }) });
    await expect(fetchTownShop("flarine-town", "general-store")).resolves.toEqual(shop);
  });

  it("reports missing and failed shops", async () => {
    mockFetch({ ok: false, status: 404 });
    await expect(fetchTownShop("town", "missing")).rejects.toThrow(
      "This merchant has no standard shop inventory"
    );

    mockFetch({ ok: false, status: 500 });
    await expect(fetchTownShop("town", "broken")).rejects.toThrow("Unable to load shop");
  });

  it("purchases a town shop item with authentication", async () => {
    const character = buildCharacter();
    const fetchMock = mockFetch({
      ok: true,
      json: jest.fn().mockResolvedValue({ character })
    });
    await expect(
      purchaseTownShopItem("token", "character-1", "flarine-town", "general-store", "3907", 2)
    ).resolves.toEqual(character);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/shops/flarine-town/general-store/purchases"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ itemId: "3907", quantity: 2 })
      })
    );
  });

  it("uses server purchase errors and a safe fallback", async () => {
    mockFetch({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: "Not enough Penya" })
    });
    await expect(purchaseTownShopItem("token", "character-1", "town", "shop", "1", 1)).rejects.toThrow(
      "Not enough Penya"
    );

    mockFetch({ ok: false, json: jest.fn().mockRejectedValue(new Error("Invalid JSON")) });
    await expect(purchaseTownShopItem("token", "character-1", "town", "shop", "1", 1)).rejects.toThrow(
      "Unable to purchase item"
    );
  });
});
