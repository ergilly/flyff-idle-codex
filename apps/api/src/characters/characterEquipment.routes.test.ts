import request from "supertest";
import { createApp } from "../app.js";
import { characterRepository } from "../data/characterRepository.js";
import { db } from "../data/database.js";
import { disconnectTestDatabase, resetTestDatabase } from "../../tests/setup/database.js";

describe("character equipment routes", () => {
  const app = createApp();

  beforeEach(async () => resetTestDatabase());
  afterAll(async () => disconnectTestDatabase());

  it("consumes one equipped arrow from the selected equipment set", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const registration = await request(app)
      .post("/api/auth/register")
      .send({
        displayName: "Bow Tester",
        email: `bow-${suffix}@flyff-idle.local`,
        password: "password123"
      });
    const authorization = `Bearer ${registration.body.token}`;
    const creation = await request(app)
      .post("/api/characters")
      .set("Authorization", authorization)
      .send({ slotIndex: 0, name: "BowTester", gender: "male" });
    const characterId = creation.body.character.id as string;
    const playerId = db
      .prepare("SELECT player_id AS playerId FROM characters WHERE id = ?")
      .get(characterId) as {
      playerId: string;
    };
    db.prepare("UPDATE characters SET level = ?, job = ? WHERE id = ?").run(85, "Acrobat", characterId);
    characterRepository.setInventoryItemForPlayer(characterId, playerId.playerId, {
      slotIndex: 3,
      itemId: "10",
      quantity: 1
    });
    characterRepository.setInventoryItemForPlayer(characterId, playerId.playerId, {
      slotIndex: 4,
      itemId: "4586",
      quantity: 2
    });
    characterRepository.equipInventoryItemForPlayer(characterId, playerId.playerId, 3);
    characterRepository.equipInventoryItemForPlayer(characterId, playerId.playerId, 4);

    const response = await request(app)
      .post(`/api/characters/${characterId}/equipment/ammo/consume`)
      .set("Authorization", authorization)
      .send({ equipmentSet: 0 });

    expect(response.status).toBe(200);
    expect(response.body.character).toEqual(
      expect.objectContaining({ ammoQuantity: 1, equipment: expect.objectContaining({ ammo: "4586" }) })
    );
  });
});
