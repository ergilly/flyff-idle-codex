import request from "supertest";
import { createApp } from "../../src/app.js";
import { db } from "../../src/data/database.js";
import { disconnectTestDatabase, resetTestDatabase } from "../setup/database.js";

describe("app routes", () => {
  const app = createApp();

  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("returns health and OpenAPI documents", async () => {
    await expect(request(app).get("/health")).resolves.toMatchObject({
      status: 200,
      body: { status: "ok" }
    });

    const yamlResponse = await request(app).get("/docs/openapi.yaml");
    expect(yamlResponse.status).toBe(200);
    expect(yamlResponse.text).toContain("openapi:");

    const jsonResponse = await request(app).get("/docs/openapi.json");
    expect(jsonResponse.status).toBe(200);
    expect(jsonResponse.body).toHaveProperty("openapi");
  });

  it("validates auth route input and duplicate registrations", async () => {
    await expect(request(app).post("/api/auth/login").send({ email: "bad" })).resolves.toMatchObject({
      status: 400,
      body: { error: "Email and password are required" }
    });

    await expect(
      request(app).post("/api/auth/login").send({
        email: "test@flyff-idle.local",
        password: "wrong-password"
      })
    ).resolves.toMatchObject({
      status: 401,
      body: { error: "Invalid credentials" }
    });

    await expect(request(app).post("/api/auth/register").send({ email: "bad" })).resolves.toMatchObject({
      status: 400,
      body: { error: "Display name, email, and password are required" }
    });

    await expect(
      request(app).post("/api/auth/register").send({
        displayName: "Duplicate",
        email: "test@flyff-idle.local",
        password: "password123"
      })
    ).resolves.toMatchObject({
      status: 409,
      body: { error: "A player already exists for that email" }
    });

    await expect(
      request(app).post("/api/auth/register").send({
        displayName: "Fresh Pilot",
        email: "fresh@flyff-idle.local",
        password: "password123"
      })
    ).resolves.toMatchObject({
      status: 201,
      body: {
        token: expect.any(String),
        user: expect.objectContaining({
          email: "fresh@flyff-idle.local",
          displayName: "Fresh Pilot",
          isAdmin: false
        })
      }
    });
  });

  it("marks seeded test accounts as admins", async () => {
    await expect(loginDemoPlayer()).resolves.toMatchObject({
      status: 200,
      body: {
        user: expect.objectContaining({
          email: "test@flyff-idle.local",
          isAdmin: true
        })
      }
    });

    await expect(
      request(app).post("/api/auth/login").send({
        email: "thirdjobs@flyff-idle.local",
        password: "password123"
      })
    ).resolves.toMatchObject({
      status: 200,
      body: {
        user: expect.objectContaining({
          email: "thirdjobs@flyff-idle.local",
          isAdmin: true
        })
      }
    });
  });

  it("does not infer admin access from email address", async () => {
    const registerResponse = await request(app).post("/api/auth/register").send({
      displayName: "Admin Name",
      email: "admin-looking@flyff-idle.local",
      password: "password123"
    });

    expect(registerResponse).toMatchObject({
      status: 201,
      body: {
        user: expect.objectContaining({
          email: "admin-looking@flyff-idle.local",
          isAdmin: false
        })
      }
    });
  });

  async function loginDemoPlayer() {
    return request(app).post("/api/auth/login").send({
      email: "test@flyff-idle.local",
      password: "password123"
    });
  }

  async function registerFreshPlayer(label: string) {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    return request(app)
      .post("/api/auth/register")
      .send({
        displayName: `${label} Pilot`,
        email: `${label.toLowerCase()}-${uniqueSuffix}@flyff-idle.local`,
        password: "password123"
      });
  }

  it("protects character routes", async () => {
    await expect(request(app).get("/api/characters")).resolves.toMatchObject({
      status: 401,
      body: { error: "Missing bearer token" }
    });

    await expect(
      request(app).get("/api/characters").set("Authorization", "Bearer invalid")
    ).resolves.toMatchObject({
      status: 401,
      body: { error: "Invalid bearer token" }
    });
  });

  it("validates character create requests and lists player characters", async () => {
    const loginResponse = await loginDemoPlayer();

    await expect(
      request(app)
        .post("/api/characters")
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ slotIndex: 8, name: "No" })
    ).resolves.toMatchObject({
      status: 400,
      body: { error: "Character name and slot are required" }
    });

    await expect(
      request(app).get("/api/characters").set("Authorization", `Bearer ${loginResponse.body.token}`)
    ).resolves.toMatchObject({
      status: 200,
      body: {
        characters: expect.arrayContaining([
          expect.objectContaining({
            name: "Saint Morning",
            slotIndex: 1,
            gender: "female"
          })
        ])
      }
    });

    await expect(
      request(app)
        .post("/api/characters")
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ slotIndex: 1, name: "DuplicateSlot", gender: "female" })
    ).resolves.toMatchObject({
      status: 409,
      body: { error: "That character slot is already occupied" }
    });
  });

  it("creates characters for authenticated players", async () => {
    const registerResponse = await registerFreshPlayer("Route");

    await expect(
      request(app)
        .post("/api/characters")
        .set("Authorization", `Bearer ${registerResponse.body.token}`)
        .send({ slotIndex: 0, name: "RouteHero", gender: "male" })
    ).resolves.toMatchObject({
      status: 201,
      body: {
        character: expect.objectContaining({
          name: "RouteHero",
          slotIndex: 0,
          gender: "male",
          job: "Vagrant",
          progressionRank: "normal",
          equipment: expect.objectContaining({
            mainhand: "3497",
            suit: "3314",
            gloves: "5535",
            boots: "4750"
          }),
          inventory: {
            size: 50,
            items: [
              {
                slotIndex: 0,
                itemId: "5325",
                quantity: 3
              },
              {
                slotIndex: 1,
                itemId: "9449",
                quantity: 1
              },
              {
                slotIndex: 2,
                itemId: "3896",
                quantity: 5
              }
            ]
          }
        })
      }
    });
  });

  it("returns item icon metadata for authenticated players", async () => {
    const loginResponse = await loginDemoPlayer();

    await expect(
      request(app)
        .get("/api/items?ids=3497,3314,missing")
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
    ).resolves.toMatchObject({
      status: 400,
      body: { error: "Item ids are required" }
    });

    await expect(
      request(app).get("/api/items?ids=3497,3314").set("Authorization", `Bearer ${loginResponse.body.token}`)
    ).resolves.toMatchObject({
      status: 200,
      body: {
        items: expect.arrayContaining([
          expect.objectContaining({ id: "3497", name: "Wooden Sword", icon: "weaswowooden.png" }),
          expect.objectContaining({ id: "3314", name: "Cotton Suit", icon: "mvag01upper.png" })
        ])
      }
    });
  });

  it("returns JSON-backed game data with filters", async () => {
    await expect(request(app).get("/api/data")).resolves.toMatchObject({
      status: 200,
      body: {
        dataSets: expect.arrayContaining([
          { name: "items", href: "/api/data/items" },
          { name: "skills", href: "/api/data/skills" }
        ])
      }
    });

    await expect(request(app).get("/api/data/jobs/764")).resolves.toMatchObject({
      status: 200,
      body: {
        dataSet: "jobs",
        item: expect.objectContaining({
          id: 764,
          name: "Mercenary"
        })
      }
    });

    await expect(request(app).get("/api/data/skills?class=Mercenary&limit=5")).resolves.toMatchObject({
      status: 200,
      body: {
        dataSet: "skills",
        total: expect.any(Number),
        limit: 5,
        offset: 0,
        results: expect.arrayContaining([
          expect.objectContaining({
            class: 764
          })
        ])
      }
    });

    await expect(request(app).get("/api/data/items?category=weapon&maxLevel=15")).resolves.toMatchObject({
      status: 200,
      body: {
        dataSet: "items",
        results: expect.arrayContaining([
          expect.objectContaining({
            category: "weapon"
          })
        ])
      }
    });

    await expect(request(app).get("/api/data/nope")).resolves.toMatchObject({
      status: 404,
      body: { error: "Data set not found" }
    });

    await expect(request(app).get("/api/data/nope/1")).resolves.toMatchObject({
      status: 404,
      body: { error: "Data set not found" }
    });

    await expect(request(app).get("/api/data/items/missing")).resolves.toMatchObject({
      status: 404,
      body: { error: "Data record not found" }
    });
  });

  it("persists stat and skill point allocation for authenticated players", async () => {
    const registerResponse = await registerFreshPlayer("Progression");
    const createResponse = await request(app)
      .post("/api/characters")
      .set("Authorization", `Bearer ${registerResponse.body.token}`)
      .send({ slotIndex: 0, name: "PointHero", gender: "male" });

    await expect(
      request(app)
        .patch(`/api/characters/${createResponse.body.character.id}/progression`)
        .set("Authorization", `Bearer ${registerResponse.body.token}`)
        .send({
          stats: {
            str: 17,
            sta: 16,
            dex: 15,
            int: 15
          },
          skillLevels: {
            "vagrant-clean-hit": 2
          }
        })
    ).resolves.toMatchObject({
      status: 200,
      body: {
        character: expect.objectContaining({
          name: "PointHero",
          stats: {
            str: 17,
            sta: 16,
            dex: 15,
            int: 15
          },
          skillLevels: {
            "vagrant-clean-hit": 2
          }
        })
      }
    });

    await expect(
      request(app).get("/api/characters").set("Authorization", `Bearer ${registerResponse.body.token}`)
    ).resolves.toMatchObject({
      body: {
        characters: [
          expect.objectContaining({
            name: "PointHero",
            skillLevels: {
              "vagrant-clean-hit": 2
            }
          })
        ]
      }
    });

    await expect(
      request(app)
        .patch(`/api/characters/${createResponse.body.character.id}/progression`)
        .set("Authorization", `Bearer ${registerResponse.body.token}`)
        .send({})
    ).resolves.toMatchObject({
      status: 400,
      body: { error: "Stats or skill levels are required" }
    });

    await expect(
      request(app)
        .patch("/api/characters/missing/progression")
        .set("Authorization", `Bearer ${registerResponse.body.token}`)
        .send({ skillLevels: { "vagrant-clean-hit": 0 } })
    ).resolves.toMatchObject({
      status: 404,
      body: { error: "Character not found" }
    });
  });

  it("lets admins refund stat and skill points for their characters", async () => {
    const loginResponse = await loginDemoPlayer();
    const charactersResponse = await request(app)
      .get("/api/characters")
      .set("Authorization", `Bearer ${loginResponse.body.token}`);
    const characterId = charactersResponse.body.characters[0].id;

    await request(app)
      .patch(`/api/characters/${characterId}/progression`)
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .send({
        stats: {
          str: 19,
          sta: 18,
          dex: 17,
          int: 16
        },
        skillLevels: {
          "vagrant-clean-hit": 2
        }
      });

    await expect(
      request(app)
        .post(`/api/admin/characters/${characterId}/refund-stats`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
    ).resolves.toMatchObject({
      status: 200,
      body: {
        character: expect.objectContaining({
          stats: {
            str: 15,
            sta: 15,
            dex: 15,
            int: 15
          },
          skillLevels: {
            "vagrant-clean-hit": 2
          }
        })
      }
    });

    await expect(
      request(app)
        .post(`/api/admin/characters/${characterId}/refund-skills`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
    ).resolves.toMatchObject({
      status: 200,
      body: {
        character: expect.objectContaining({
          skillLevels: {}
        })
      }
    });
  });

  it("rejects non-admin point refunds", async () => {
    const registerResponse = await registerFreshPlayer("NotAdmin");
    const createResponse = await request(app)
      .post("/api/characters")
      .set("Authorization", `Bearer ${registerResponse.body.token}`)
      .send({ slotIndex: 0, name: "PlainHero", gender: "female" });

    await expect(
      request(app)
        .post(`/api/admin/characters/${createResponse.body.character.id}/refund-stats`)
        .set("Authorization", `Bearer ${registerResponse.body.token}`)
    ).resolves.toMatchObject({
      status: 403,
      body: { error: "Admin access is required" }
    });
  });

  it("lets admins add, equip, move, sort, and unequip inventory items", async () => {
    const loginResponse = await loginDemoPlayer();
    const charactersResponse = await request(app)
      .get("/api/characters")
      .set("Authorization", `Bearer ${loginResponse.body.token}`);
    const characterId = charactersResponse.body.characters[0].id;

    const addItemResponse = await request(app)
      .post(`/api/admin/characters/${characterId}/inventory`)
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .send({ itemId: "40", quantity: 1 });
    const addedItem = addItemResponse.body.character.inventory.items.find(
      (item: { itemId: string }) => item.itemId === "40"
    );

    expect(addItemResponse.status).toBe(200);
    expect(addedItem).toEqual(expect.objectContaining({ itemId: "40", quantity: 1 }));

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/inventory/${addedItem.slotIndex}/equip`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
    ).resolves.toMatchObject({
      status: 200,
      body: {
        character: expect.objectContaining({
          equipment: expect.objectContaining({ cloak: "40" }),
          inventory: {
            size: 50,
            items: expect.not.arrayContaining([expect.objectContaining({ itemId: "40" })])
          }
        })
      }
    });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/equipment/cloak/unequip`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
    ).resolves.toMatchObject({
      status: 200,
      body: {
        character: expect.objectContaining({
          equipment: expect.objectContaining({ cloak: null }),
          inventory: {
            size: 50,
            items: expect.arrayContaining([expect.objectContaining({ itemId: "40", quantity: 1 })])
          }
        })
      }
    });

    const playerResponse = await registerFreshPlayer("Inventory");
    const createResponse = await request(app)
      .post("/api/characters")
      .set("Authorization", `Bearer ${playerResponse.body.token}`)
      .send({ slotIndex: 0, name: "BagHero", gender: "male" });
    const bagCharacterId = createResponse.body.character.id;

    await expect(
      request(app)
        .post(`/api/characters/${bagCharacterId}/inventory/move`)
        .set("Authorization", `Bearer ${playerResponse.body.token}`)
        .send({ fromSlotIndex: 0, toSlotIndex: 4 })
    ).resolves.toMatchObject({
      status: 200,
      body: {
        character: expect.objectContaining({
          inventory: {
            size: 50,
            items: expect.arrayContaining([{ slotIndex: 4, itemId: "5325", quantity: 3 }])
          }
        })
      }
    });

    await expect(
      request(app)
        .post(`/api/characters/${bagCharacterId}/inventory/sort`)
        .set("Authorization", `Bearer ${playerResponse.body.token}`)
        .send({ sortBy: "name" })
    ).resolves.toMatchObject({
      status: 200,
      body: {
        character: expect.objectContaining({
          inventory: {
            size: 50,
            items: [
              { slotIndex: 0, itemId: "9449", quantity: 1 },
              { slotIndex: 1, itemId: "5325", quantity: 3 },
              { slotIndex: 2, itemId: "3896", quantity: 5 }
            ]
          }
        })
      }
    });
  });

  it("validates inventory and admin item actions", async () => {
    const loginResponse = await loginDemoPlayer();
    const charactersResponse = await request(app)
      .get("/api/characters")
      .set("Authorization", `Bearer ${loginResponse.body.token}`);
    const characterId = charactersResponse.body.characters[0].id;

    await expect(
      request(app)
        .post(`/api/admin/characters/${characterId}/inventory`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ itemId: "missing", quantity: 1 })
    ).resolves.toMatchObject({
      status: 400,
      body: { error: "Item and quantity are required" }
    });

    await expect(
      request(app)
        .post(`/api/admin/characters/${characterId}/inventory`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ itemId: "999999", quantity: 1 })
    ).resolves.toMatchObject({
      status: 404,
      body: { error: "Item not found" }
    });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/inventory/99/equip`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
    ).resolves.toMatchObject({
      status: 404,
      body: { error: "Inventory item not found" }
    });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/inventory/not-a-slot/equip`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
    ).resolves.toMatchObject({
      status: 404,
      body: { error: "Inventory item not found" }
    });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/inventory/move`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({})
    ).resolves.toMatchObject({
      status: 400,
      body: { error: "Source and destination slots are required" }
    });

    await expect(
      request(app)
        .post("/api/characters/missing/inventory/move")
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ fromSlotIndex: 0, toSlotIndex: 1 })
    ).resolves.toMatchObject({
      status: 404,
      body: { error: "Character not found" }
    });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/inventory/move`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ fromSlotIndex: 0, toSlotIndex: 55 })
    ).resolves.toMatchObject({
      status: 400,
      body: { error: "Destination slot is outside inventory capacity" }
    });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/inventory/sort`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ sortBy: "rarity" })
    ).resolves.toMatchObject({
      status: 400,
      body: { error: "Sort option is required" }
    });

    await expect(
      request(app)
        .post("/api/characters/missing/inventory/sort")
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ sortBy: "name" })
    ).resolves.toMatchObject({
      status: 404,
      body: { error: "Character not found" }
    });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/equipment/not-a-slot/unequip`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
    ).resolves.toMatchObject({
      status: 404,
      body: { error: "Equipment slot not found" }
    });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/equipment/cloak/unequip`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
    ).resolves.toMatchObject({
      status: 404,
      body: { error: "Equipment slot is empty" }
    });

    await expect(
      request(app)
        .post("/api/characters/missing/equipment/mainhand/unequip")
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
    ).resolves.toMatchObject({
      status: 404,
      body: { error: "Character not found" }
    });
  });

  it("returns precise admin inventory errors", async () => {
    const loginResponse = await loginDemoPlayer();
    const charactersResponse = await request(app)
      .get("/api/characters")
      .set("Authorization", `Bearer ${loginResponse.body.token}`);
    const characterId = charactersResponse.body.characters[0].id;
    const now = new Date().toISOString();

    await expect(
      request(app)
        .post("/api/admin/characters/missing/refund-stats")
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
    ).resolves.toMatchObject({
      status: 404,
      body: { error: "Character not found" }
    });

    await expect(
      request(app)
        .post("/api/admin/characters/missing/refund-skills")
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
    ).resolves.toMatchObject({
      status: 404,
      body: { error: "Character not found" }
    });

    const otherPlayer = await registerFreshPlayer("OtherInventory");
    const otherCharacter = await request(app)
      .post("/api/characters")
      .set("Authorization", `Bearer ${otherPlayer.body.token}`)
      .send({ slotIndex: 0, name: "OtherBag", gender: "male" });

    await expect(
      request(app)
        .post(`/api/admin/characters/${otherCharacter.body.character.id}/inventory`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ itemId: "1855", quantity: 1 })
    ).resolves.toMatchObject({
      status: 404,
      body: { error: "Character not found" }
    });

    db.prepare("DELETE FROM character_inventory_items WHERE character_id = ?").run(characterId);
    const insertInventoryItem = db.prepare(
      "INSERT INTO character_inventory_items (id, character_id, slot_index, item_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );

    for (let slotIndex = 0; slotIndex < 50; slotIndex += 1) {
      insertInventoryItem.run(`route-full-${slotIndex}`, characterId, slotIndex, "1855", 1, now, now);
    }

    await expect(
      request(app)
        .post(`/api/admin/characters/${characterId}/inventory`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ itemId: "1855", quantity: 1 })
    ).resolves.toMatchObject({
      status: 400,
      body: { error: "Not enough inventory space" }
    });
  });

  it("deletes characters only after matching name confirmation", async () => {
    const registerResponse = await registerFreshPlayer("Delete");
    const createResponse = await request(app)
      .post("/api/characters")
      .set("Authorization", `Bearer ${registerResponse.body.token}`)
      .send({ slotIndex: 0, name: "DeleteHero", gender: "female" });

    await expect(
      request(app)
        .delete(`/api/characters/${createResponse.body.character.id}`)
        .set("Authorization", `Bearer ${registerResponse.body.token}`)
        .send({})
    ).resolves.toMatchObject({
      status: 400,
      body: { error: "Character name confirmation is required" }
    });

    const otherPlayer = await registerFreshPlayer("DeleteOther");

    await expect(
      request(app)
        .delete(`/api/characters/${createResponse.body.character.id}`)
        .set("Authorization", `Bearer ${otherPlayer.body.token}`)
        .send({ name: "DeleteHero" })
    ).resolves.toMatchObject({
      status: 404,
      body: { error: "Character not found" }
    });

    await expect(
      request(app)
        .delete(`/api/characters/${createResponse.body.character.id}`)
        .set("Authorization", `Bearer ${registerResponse.body.token}`)
        .send({ name: "WrongName" })
    ).resolves.toMatchObject({
      status: 400,
      body: { error: "Character name confirmation does not match" }
    });

    await expect(
      request(app)
        .delete(`/api/characters/${createResponse.body.character.id}`)
        .set("Authorization", `Bearer ${registerResponse.body.token}`)
        .send({ name: "DeleteHero" })
    ).resolves.toMatchObject({
      status: 204
    });

    await expect(
      request(app).get("/api/characters").set("Authorization", `Bearer ${registerResponse.body.token}`)
    ).resolves.toMatchObject({
      body: {
        characters: expect.not.arrayContaining([
          expect.objectContaining({
            name: "DeleteHero"
          })
        ])
      }
    });
  });
});
