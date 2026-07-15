import {
  consumeEquippedConsumableItem,
  consumeInventoryItem,
  equipConsumableItem,
  lootInventoryItems,
  updateCharacterProgression
} from "@/lib/api";
import { buildCharacter } from "@/test/fixtures";

function respond(response: Partial<Response>) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ character: buildCharacter() }),
    ...response
  }) as jest.Mock;
}

describe("character API action contracts", () => {
  beforeEach(() => jest.resetAllMocks());

  it("serializes consumable assignment and clearing", async () => {
    respond({});

    await equipConsumableItem("token", "character-1", "hp", 4);
    expect(global.fetch).toHaveBeenLastCalledWith(
      "http://localhost:4000/api/characters/character-1/consumables/hp",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ slotIndex: 4 })
      })
    );

    await equipConsumableItem("token", "character-1", "hp", null);
    expect(global.fetch).toHaveBeenLastCalledWith(
      "http://localhost:4000/api/characters/character-1/consumables/hp",
      expect.objectContaining({ body: JSON.stringify({ slotIndex: null }) })
    );
  });

  it("uses distinct endpoints for inventory and equipped-consumable consumption", async () => {
    respond({});

    await consumeInventoryItem("token", "character-1", 7);
    expect(global.fetch).toHaveBeenLastCalledWith(
      "http://localhost:4000/api/characters/character-1/inventory/7/consume",
      expect.objectContaining({ method: "POST" })
    );

    await consumeEquippedConsumableItem("token", "character-1", "mp");
    expect(global.fetch).toHaveBeenLastCalledWith(
      "http://localhost:4000/api/characters/character-1/consumables/mp/consume",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("sends progression and loot batches without losing fields", async () => {
    respond({});

    await updateCharacterProgression("token", "character-1", {
      level: 21,
      exp: 12,
      penya: 500,
      skillLevels: { cleanHit: 2 }
    });
    expect(global.fetch).toHaveBeenLastCalledWith(
      "http://localhost:4000/api/characters/character-1/progression",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ level: 21, exp: 12, penya: 500, skillLevels: { cleanHit: 2 } })
      })
    );

    await lootInventoryItems("token", "character-1", [
      { itemId: "100", quantity: 2 },
      { itemId: "200", quantity: 1 }
    ]);
    expect(global.fetch).toHaveBeenLastCalledWith(
      "http://localhost:4000/api/characters/character-1/inventory/loot",
      expect.objectContaining({
        body: JSON.stringify({
          items: [
            { itemId: "100", quantity: 2 },
            { itemId: "200", quantity: 1 }
          ]
        })
      })
    );
  });

  it.each([
    [() => equipConsumableItem("token", "character-1", "fp", 1), "Unable to equip consumable"],
    [() => consumeInventoryItem("token", "character-1", 1), "Unable to consume item"],
    [() => consumeEquippedConsumableItem("token", "character-1", "fp"), "Unable to consume item"],
    [
      () => lootInventoryItems("token", "character-1", [{ itemId: "100", quantity: 1 }]),
      "Unable to loot items"
    ]
  ])("uses a stable fallback when an error response has no JSON body", async (action, message) => {
    respond({ ok: false, json: jest.fn().mockRejectedValue(new Error("invalid json")) });
    await expect(action()).rejects.toThrow(message);
  });
});
