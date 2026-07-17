import { characterRepository } from "./characterRepository.js";
import { userRepository } from "./userRepository.js";
import { disconnectTestDatabase, resetTestDatabase } from "../../tests/setup/database.js";

describe("characterShopTransactions", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("purchases an inventory item and charges Penya atomically", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 9,
      name: "Shopper",
      gender: "male"
    });

    characterRepository.updateProgressionForPlayer(character!.id, user!.id, { penya: 1_000 });

    const purchase = characterRepository.purchaseInventoryItemForPlayer(
      character!.id,
      user!.id,
      "5869",
      3,
      50,
      9_999
    );

    expect(purchase.error).toBeNull();
    expect(purchase.character).toEqual(
      expect.objectContaining({
        penya: 850,
        inventory: expect.objectContaining({
          items: expect.arrayContaining([expect.objectContaining({ itemId: "5869", quantity: 3 })])
        })
      })
    );

    const unaffordablePurchase = characterRepository.purchaseInventoryItemForPlayer(
      character!.id,
      user!.id,
      "4758",
      2,
      1_000,
      9_999
    );

    expect(unaffordablePurchase).toEqual({ character: null, error: "Not enough Penya" });
    expect(characterRepository.findById(character!.id)).toEqual(
      expect.objectContaining({
        penya: 850,
        inventory: expect.objectContaining({
          items: expect.not.arrayContaining([expect.objectContaining({ itemId: "4758" })])
        })
      })
    );
  });

  it("sells an inventory stack and adds Penya atomically", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local")!;
    const character = characterRepository.create({
      playerId: user.id,
      slotIndex: 14,
      name: "Seller",
      gender: "female"
    })!;

    const result = characterRepository.sellInventoryItemForPlayer(character.id, user.id, 0, 2, 10);

    expect(result.character).toEqual(
      expect.objectContaining({
        penya: 20,
        inventory: expect.objectContaining({
          items: expect.arrayContaining([{ slotIndex: 0, itemId: "5325", quantity: 1 }])
        })
      })
    );
    expect(characterRepository.sellInventoryItemForPlayer(character.id, user.id, 0, 2, 10)).toEqual(
      expect.objectContaining({ character: null, error: "Not enough items in this stack" })
    );
  });
});
