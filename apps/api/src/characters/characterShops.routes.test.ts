import request from "supertest";
import { createApp } from "../app.js";
import { disconnectTestDatabase, resetTestDatabase } from "../../tests/setup/database.js";

describe("character shop routes", () => {
  const app = createApp();

  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  async function createShopper() {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const registration = await request(app)
      .post("/api/auth/register")
      .send({
        displayName: "Shop Route Tester",
        email: `shop-routes-${suffix}@flyff-idle.local`,
        password: "password123"
      });
    const authorization = `Bearer ${registration.body.token}`;
    const creation = await request(app)
      .post("/api/characters")
      .set("Authorization", authorization)
      .send({ slotIndex: 0, name: "RouteShopper", gender: "female" });

    return { authorization, characterId: creation.body.character.id as string };
  }

  it("validates purchases and enforces stock stack limits", async () => {
    const shopper = await createShopper();
    await expect(
      request(app)
        .post(`/api/characters/${shopper.characterId}/shops/flarine-town/general-store/purchases`)
        .set("Authorization", shopper.authorization)
        .send({})
    ).resolves.toMatchObject({ status: 400, body: { error: "Shop item is required" } });

    await expect(
      request(app)
        .post(`/api/characters/${shopper.characterId}/shops/flarine-town/station/purchases`)
        .set("Authorization", shopper.authorization)
        .send({ itemId: "8507", quantity: 2 })
    ).resolves.toMatchObject({
      status: 400,
      body: { error: "Quantity exceeds the item's maximum stack" }
    });

    await expect(
      request(app)
        .post(`/api/characters/${shopper.characterId}/shops/flarine-town/general-store/purchases`)
        .set("Authorization", shopper.authorization)
        .send({ itemId: "5869", quantity: 1 })
    ).resolves.toMatchObject({ status: 400, body: { error: "Not enough Penya" } });

    await expect(
      request(app)
        .post("/api/characters/missing/shops/flarine-town/general-store/purchases")
        .set("Authorization", shopper.authorization)
        .send({ itemId: "5869", quantity: 1 })
    ).resolves.toMatchObject({ status: 404, body: { error: "Character not found" } });
  });

  it("validates sales, ownership, inventory slots, and sell prices", async () => {
    const shopper = await createShopper();
    await expect(
      request(app)
        .post(`/api/characters/${shopper.characterId}/shops/sales`)
        .set("Authorization", shopper.authorization)
        .send({})
    ).resolves.toMatchObject({
      status: 400,
      body: { error: "Inventory item and quantity are required" }
    });

    await expect(
      request(app)
        .post("/api/characters/missing/shops/sales")
        .set("Authorization", shopper.authorization)
        .send({ slotIndex: 0, quantity: 1 })
    ).resolves.toMatchObject({ status: 404, body: { error: "Character not found" } });

    await expect(
      request(app)
        .post(`/api/characters/${shopper.characterId}/shops/sales`)
        .set("Authorization", shopper.authorization)
        .send({ slotIndex: 49, quantity: 1 })
    ).resolves.toMatchObject({ status: 404, body: { error: "Inventory item not found" } });

    await expect(
      request(app)
        .post(`/api/characters/${shopper.characterId}/shops/sales`)
        .set("Authorization", shopper.authorization)
        .send({ slotIndex: 0, quantity: 1 })
    ).resolves.toMatchObject({ status: 400, body: { error: "This item cannot be sold" } });
  });
});
