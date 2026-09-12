import {
  allocateCharacterSkills,
  consumeEquippedConsumableItem,
  consumeEquippedArrow,
  consumeInventoryItem,
  equipConsumableItem,
  lootInventoryItems,
  persistCharacterBattleState,
  travelCharacter
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

  it("consumes ammo from the active equipment set", async () => {
    respond({});

    await consumeEquippedArrow("token", "character-1", 2);
    expect(global.fetch).toHaveBeenLastCalledWith(
      "http://localhost:4000/api/characters/character-1/equipment/ammo/consume",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ equipmentSet: 2 }) })
    );
  });

  it("sends progression and loot batches without losing fields", async () => {
    respond({});

    await persistCharacterBattleState("token", "character-1", {
      level: 21,
      exp: 12,
      penya: 500
    });
    expect(global.fetch).toHaveBeenLastCalledWith(
      "http://localhost:4000/api/characters/character-1/progression/battle-state",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ level: 21, exp: 12, penya: 500 })
      })
    );

    await allocateCharacterSkills("token", "character-1", { "226": 2 });
    expect(global.fetch).toHaveBeenLastCalledWith(
      "http://localhost:4000/api/characters/character-1/progression/skill-allocations",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ allocations: { "226": 2 } }) })
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

  it("sends the selected travel method and equipment set", async () => {
    respond({});

    await travelCharacter("token", "character-1", "darkon12", "blinkwing", 2);

    expect(global.fetch).toHaveBeenLastCalledWith(
      "http://localhost:4000/api/characters/character-1/travel",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ destination: "darkon12", method: "blinkwing", equipmentSet: 2 })
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
