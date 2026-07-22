import request from "supertest";
import { createApp } from "../../src/app.js";
import { db } from "../../src/data/database.js";
import { disconnectTestDatabase, resetTestDatabase } from "../setup/database.js";

describe("bank routes", () => {
  const app = createApp();

  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  async function createAccountWithCharacters() {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const registration = await request(app)
      .post("/api/auth/register")
      .send({
        displayName: "Bank Tester",
        email: `bank-${suffix}@flyff-idle.local`,
        password: "password123"
      });
    const authorization = `Bearer ${registration.body.token}`;
    const first = await request(app)
      .post("/api/characters")
      .set("Authorization", authorization)
      .send({ slotIndex: 0, name: `Banker${suffix.slice(-5)}`, gender: "female" });
    const second = await request(app)
      .post("/api/characters")
      .set("Authorization", authorization)
      .send({ slotIndex: 1, name: `Alt${suffix.slice(-6)}`, gender: "male" });

    return {
      authorization,
      firstCharacterId: first.body.character.id as string,
      secondCharacterId: second.body.character.id as string
    };
  }

  it("starts with 100 shared slots and shares deposited items between characters", async () => {
    const account = await createAccountWithCharacters();

    const initial = await request(app)
      .get(`/api/characters/${account.firstCharacterId}/bank`)
      .set("Authorization", account.authorization);
    expect(initial).toMatchObject({ status: 200, body: { bank: { size: 100, penya: 0, items: [] } } });

    const deposited = await request(app)
      .post(`/api/characters/${account.firstCharacterId}/bank/items`)
      .set("Authorization", account.authorization)
      .send({ direction: "deposit", slotIndex: 0 });
    expect(deposited).toMatchObject({
      status: 200,
      body: {
        bank: { items: [{ slotIndex: 0, itemId: "5325", quantity: 3 }] },
        character: { inventory: { items: expect.not.arrayContaining([{ slotIndex: 0 }]) } }
      }
    });

    const shared = await request(app)
      .get(`/api/characters/${account.secondCharacterId}/bank`)
      .set("Authorization", account.authorization);
    expect(shared.body.bank.items).toEqual([{ slotIndex: 0, itemId: "5325", quantity: 3 }]);

    const withdrawn = await request(app)
      .post(`/api/characters/${account.secondCharacterId}/bank/items`)
      .set("Authorization", account.authorization)
      .send({ direction: "withdraw", slotIndex: 0 });
    expect(withdrawn.status).toBe(200);
    expect(withdrawn.body.bank.items).toEqual([]);
    expect(withdrawn.body.character.inventory.items).toContainEqual({
      slotIndex: 0,
      itemId: "5325",
      quantity: 6
    });

    const allDeposited = await request(app)
      .post(`/api/characters/${account.firstCharacterId}/bank/items/all`)
      .set("Authorization", account.authorization)
      .send({ direction: "deposit" });
    expect(allDeposited.status).toBe(200);
    expect(allDeposited.body.character.inventory.items).toEqual([]);
    expect(allDeposited.body.bank.items).toHaveLength(2);

    const allWithdrawn = await request(app)
      .post(`/api/characters/${account.secondCharacterId}/bank/items/all`)
      .set("Authorization", account.authorization)
      .send({ direction: "withdraw" });
    expect(allWithdrawn.status).toBe(200);
    expect(allWithdrawn.body.bank.items).toEqual([]);
  });

  it("deposits and withdraws Penya, including all available Penya", async () => {
    const account = await createAccountWithCharacters();
    db.prepare("UPDATE characters SET penya = 1250 WHERE id = ?").run(account.firstCharacterId);

    const deposited = await request(app)
      .post(`/api/characters/${account.firstCharacterId}/bank/penya`)
      .set("Authorization", account.authorization)
      .send({ direction: "deposit", amount: 250 });
    expect(deposited).toMatchObject({
      status: 200,
      body: { bank: { penya: 250 }, character: { penya: 1000 } }
    });

    const withdrawn = await request(app)
      .post(`/api/characters/${account.secondCharacterId}/bank/penya`)
      .set("Authorization", account.authorization)
      .send({ direction: "withdraw", amount: "all" });
    expect(withdrawn).toMatchObject({
      status: 200,
      body: { bank: { penya: 0 }, character: { penya: 250 } }
    });
  });

  it("validates requests and hides banks belonging to other accounts", async () => {
    const account = await createAccountWithCharacters();
    const otherRegistration = await request(app)
      .post("/api/auth/register")
      .send({
        displayName: "Other Player",
        email: `other-bank-${Date.now()}@flyff-idle.local`,
        password: "password123"
      });

    await expect(
      request(app)
        .get(`/api/characters/${account.firstCharacterId}/bank`)
        .set("Authorization", `Bearer ${otherRegistration.body.token}`)
    ).resolves.toMatchObject({ status: 404, body: { error: "Character not found" } });

    await expect(
      request(app)
        .post(`/api/characters/${account.firstCharacterId}/bank/items`)
        .set("Authorization", account.authorization)
        .send({ direction: "deposit" })
    ).resolves.toMatchObject({ status: 400 });

    await expect(
      request(app)
        .post(`/api/characters/${account.firstCharacterId}/bank/penya`)
        .set("Authorization", account.authorization)
        .send({ direction: "withdraw", amount: 1 })
    ).resolves.toMatchObject({ status: 400, body: { error: "Not enough Penya" } });
  });

  it("rolls back a deposit when all 100 bank slots are full", async () => {
    const account = await createAccountWithCharacters();
    await request(app)
      .get(`/api/characters/${account.firstCharacterId}/bank`)
      .set("Authorization", account.authorization);
    const player = db
      .prepare("SELECT player_id AS playerId FROM characters WHERE id = ?")
      .get(account.firstCharacterId) as { playerId: string };
    const now = new Date().toISOString();
    const insert = db.prepare(
      `INSERT INTO bank_inventory_items
        (id, player_id, slot_index, item_id, quantity, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (let slotIndex = 0; slotIndex < 100; slotIndex += 1) {
      insert.run(`full-bank-${slotIndex}`, player.playerId, slotIndex, "5325", 999_999, now, now);
    }

    const response = await request(app)
      .post(`/api/characters/${account.firstCharacterId}/bank/items`)
      .set("Authorization", account.authorization)
      .send({ direction: "deposit", slotIndex: 0 });
    expect(response).toMatchObject({ status: 400, body: { error: "Not enough bank space" } });

    const character = await request(app).get(`/api/characters`).set("Authorization", account.authorization);
    expect(character.body.characters[0].inventory.items).toContainEqual({
      slotIndex: 0,
      itemId: "5325",
      quantity: 3
    });
  });
});
