import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { config } from "../../src/config.js";
import { db } from "../../src/data/database.js";
import { characterRepository } from "../../src/data/characterRepository.js";
import { disconnectTestDatabase, resetTestDatabase } from "../setup/database.js";

describe("app route integration", () => {
  const app = createApp();

  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("returns health and Swagger docs", async () => {
    await expect(request(app).get("/health")).resolves.toMatchObject({
      status: 200,
      body: { status: "ok" }
    });

    const swaggerResponse = await request(app).get("/swagger");
    expect(swaggerResponse.status).toBe(200);
    expect(swaggerResponse.text).toContain("SwaggerUIBundle");
    expect(swaggerResponse.text).toContain('"openapi":"3.0.3"');

    await expect(request(app).get("/docs/openapi.yaml")).resolves.toMatchObject({ status: 404 });
    await expect(request(app).get("/docs/openapi.json")).resolves.toMatchObject({ status: 404 });
  });

  it("rejects invalid cached image paths before contacting the upstream", async () => {
    const fetchMock = jest.spyOn(global, "fetch");

    await expect(request(app).get("/api/images/unknown/icon.png")).resolves.toMatchObject({
      status: 400,
      body: { error: "Invalid image path" }
    });
    await expect(request(app).get("/api/images/item/not%20safe.png")).resolves.toMatchObject({
      status: 400,
      body: { error: "Invalid image path" }
    });
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock.mockRestore();
  });

  it("caches upstream images on disk and in the browser", async () => {
    const originalCacheDirectory = config.imageCacheDir;
    const cacheDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "flyff-idle-image-cache-"));
    const image = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      arrayBuffer: async () => Uint8Array.from(image).buffer,
      headers: { get: () => "image/png" },
      ok: true,
      status: 200
    } as Response);

    config.imageCacheDir = cacheDirectory;

    try {
      const firstResponse = await request(app).get("/api/images/item/test-icon.png");
      const secondResponse = await request(app).get("/api/images/item/test-icon.png");

      expect(firstResponse.status).toBe(200);
      expect(firstResponse.headers["cache-control"]).toContain("max-age=2592000");
      expect(secondResponse.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      await expect(fs.readFile(path.join(cacheDirectory, "item", "test-icon.png"))).resolves.toEqual(image);
    } finally {
      config.imageCacheDir = originalCacheDirectory;
      fetchMock.mockRestore();
      await fs.rm(cacheDirectory, { force: true, recursive: true });
    }
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
      body: { error: "That password does not match this player account." }
    });

    await expect(
      request(app).post("/api/auth/login").send({
        email: "missing@flyff-idle.local",
        password: "password123"
      })
    ).resolves.toMatchObject({
      status: 404,
      body: { error: "No player account exists for that email." }
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
            gender: "female",
            job: "Mercenary",
            progressionRank: "normal",
            location: "Flaris",
            penya: 0,
            stats: {
              str: 15,
              sta: 15,
              dex: 15,
              int: 15
            },
            equipment: expect.objectContaining({
              helmet: null,
              flying: null,
              ammo: null,
              ringR: null,
              ringL: null,
              earringR: null,
              earringL: null
            }),
            inventory: {
              size: 50,
              items: []
            }
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
    const authorization = `Bearer ${registerResponse.body.token}`;

    await expect(
      request(app).post("/api/characters").set("Authorization", authorization).send({
        slotIndex: 0,
        name: "RouteHero",
        gender: "male"
      })
    ).resolves.toMatchObject({
      status: 201,
      body: {
        character: expect.objectContaining({
          name: "RouteHero",
          slotIndex: 0,
          gender: "male",
          job: "Vagrant",
          progressionRank: "normal",
          location: "Flaris",
          level: 1,
          exp: 0,
          penya: 0,
          stats: {
            str: 15,
            sta: 15,
            dex: 15,
            int: 15
          },
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

    await expect(
      request(app).post("/api/characters").set("Authorization", authorization).send({
        slotIndex: 1,
        name: "RouteHeroine",
        gender: "female"
      })
    ).resolves.toMatchObject({
      status: 201,
      body: {
        character: expect.objectContaining({
          name: "RouteHeroine",
          slotIndex: 1,
          gender: "female",
          equipment: expect.objectContaining({
            mainhand: "3497",
            suit: "6040",
            gloves: "5011",
            boots: "8195"
          })
        })
      }
    });
  });

  it("gets one character without exposing characters owned by another player", async () => {
    const registerResponse = await registerFreshPlayer("GetOne");
    const authorization = `Bearer ${registerResponse.body.token}`;
    const createResponse = await request(app)
      .post("/api/characters")
      .set("Authorization", authorization)
      .send({ slotIndex: 0, name: "OneHero", gender: "male" });

    await expect(
      request(app)
        .get(`/api/characters/${createResponse.body.character.id}`)
        .set("Authorization", authorization)
    ).resolves.toMatchObject({
      status: 200,
      body: { character: expect.objectContaining({ name: "OneHero" }) }
    });

    const otherPlayer = await registerFreshPlayer("GetOther");
    await expect(
      request(app)
        .get(`/api/characters/${createResponse.body.character.id}`)
        .set("Authorization", `Bearer ${otherPlayer.body.token}`)
    ).resolves.toMatchObject({ status: 404, body: { code: "not_found" } });
  });

  it("returns item icon metadata for authenticated players", async () => {
    const loginResponse = await loginDemoPlayer();

    await expect(
      request(app)
        .get("/api/items?ids=3497,3314,5325,missing")
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
    ).resolves.toMatchObject({
      status: 400,
      body: { error: "Item ids are required" }
    });

    await expect(
      request(app)
        .get("/api/items?ids=3497,3314,5325")
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
    ).resolves.toMatchObject({
      status: 200,
      body: {
        items: expect.arrayContaining([
          expect.objectContaining({ id: "3497", name: "Wooden Sword", icon: "weaswowooden.png" }),
          expect.objectContaining({ id: "3314", name: "Cotton Suit", icon: "mvag01upper.png" }),
          expect.objectContaining({
            id: "5325",
            name: "Lollipop",
            buyPrice: 40,
            cooldown: 2.5,
            stack: 9999,
            consumable: true
          })
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
          { name: "npcs", href: "/api/data/npcs" },
          { name: "quests", href: "/api/data/quests" },
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

    await expect(
      request(app).get("/api/data/quests?beginNPC=29&fields=id,description,dialogsAccept")
    ).resolves.toMatchObject({
      status: 200,
      body: {
        dataSet: "quests",
        total: 1,
        results: [
          {
            id: 129,
            description: "Bring 7 Mia Doll to Mikyel.",
            dialogsAccept: ["You can collect Mia Doll from all types of Mia."]
          }
        ]
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

  it("accepts eligible NPC quests and persists active quest state", async () => {
    const player = await registerFreshPlayer("QuestAccept");
    const authorization = `Bearer ${player.body.token}`;
    const createResponse = await request(app)
      .post("/api/characters")
      .set("Authorization", authorization)
      .send({ slotIndex: 0, name: "QuestHero", gender: "male" });
    const characterId = createResponse.body.character.id;
    const questRequest = { questId: 129, npcId: 29 };

    await expect(
      request(app).post(`/api/characters/${characterId}/quests`).send(questRequest)
    ).resolves.toMatchObject({ status: 401 });
    await expect(
      request(app).post(`/api/characters/${characterId}/quests`).set("Authorization", authorization).send({})
    ).resolves.toMatchObject({ status: 400, body: { code: "invalid_request" } });
    await expect(
      request(app)
        .post(`/api/characters/${characterId}/quests`)
        .set("Authorization", authorization)
        .send(questRequest)
    ).resolves.toMatchObject({ status: 422, body: { code: "domain_rule_failed" } });

    db.prepare("UPDATE characters SET level = 23 WHERE id = ?").run(characterId);

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/quests`)
        .set("Authorization", authorization)
        .send({ questId: 129, npcId: 4000 })
    ).resolves.toMatchObject({ status: 422, body: { error: "This NPC does not offer that quest" } });

    const accepted = await request(app)
      .post(`/api/characters/${characterId}/quests`)
      .set("Authorization", authorization)
      .send(questRequest);
    expect(accepted).toMatchObject({
      status: 201,
      body: { character: expect.objectContaining({ activeQuestIds: [129] }) }
    });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/quests`)
        .set("Authorization", authorization)
        .send(questRequest)
    ).resolves.toMatchObject({ status: 409, body: { code: "conflict" } });

    await expect(
      request(app).get("/api/characters").set("Authorization", authorization)
    ).resolves.toMatchObject({
      status: 200,
      body: { characters: [expect.objectContaining({ id: characterId, activeQuestIds: [129] })] }
    });

    const otherPlayer = await registerFreshPlayer("QuestOther");
    await expect(
      request(app)
        .post(`/api/characters/${characterId}/quests`)
        .set("Authorization", `Bearer ${otherPlayer.body.token}`)
        .send(questRequest)
    ).resolves.toMatchObject({ status: 404, body: { code: "not_found" } });

    await expect(request(app).delete(`/api/characters/${characterId}/quests/129`)).resolves.toMatchObject({
      status: 401
    });
    await expect(
      request(app)
        .delete(`/api/characters/${characterId}/quests/not-a-quest`)
        .set("Authorization", authorization)
    ).resolves.toMatchObject({ status: 400, body: { code: "invalid_request" } });
    await expect(
      request(app)
        .delete(`/api/characters/${characterId}/quests/129`)
        .set("Authorization", `Bearer ${otherPlayer.body.token}`)
    ).resolves.toMatchObject({ status: 404, body: { code: "not_found" } });

    const abandoned = await request(app)
      .delete(`/api/characters/${characterId}/quests/129`)
      .set("Authorization", authorization);
    expect(abandoned).toMatchObject({
      status: 200,
      body: { character: expect.objectContaining({ activeQuestIds: [] }) }
    });

    await expect(
      request(app).delete(`/api/characters/${characterId}/quests/129`).set("Authorization", authorization)
    ).resolves.toMatchObject({ status: 404, body: { error: "Active quest not found" } });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/quests`)
        .set("Authorization", authorization)
        .send(questRequest)
    ).resolves.toMatchObject({
      status: 201,
      body: { character: expect.objectContaining({ activeQuestIds: [129] }) }
    });

    await expect(
      request(app).post(`/api/characters/${characterId}/quests/129/complete`).send({ npcId: 29 })
    ).resolves.toMatchObject({ status: 401 });
    await expect(
      request(app)
        .post(`/api/characters/${characterId}/quests/129/complete`)
        .set("Authorization", authorization)
        .send({})
    ).resolves.toMatchObject({ status: 400, body: { code: "invalid_request" } });
    await expect(
      request(app)
        .post(`/api/characters/${characterId}/quests/129/complete`)
        .set("Authorization", authorization)
        .send({ npcId: 4000 })
    ).resolves.toMatchObject({ status: 422, body: { error: "This NPC does not complete that quest" } });
    await expect(
      request(app)
        .post(`/api/characters/${characterId}/quests/129/complete`)
        .set("Authorization", authorization)
        .send({ npcId: 29 })
    ).resolves.toMatchObject({
      status: 422,
      body: { error: "Required quest items have not been collected" }
    });

    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO character_inventory_items
       (id, character_id, slot_index, item_id, quantity, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run("quest-dolls", characterId, 49, "7166", 7, now, now);

    const completed = await request(app)
      .post(`/api/characters/${characterId}/quests/129/complete`)
      .set("Authorization", authorization)
      .send({ npcId: 29 });
    expect(completed).toMatchObject({
      status: 200,
      body: {
        character: expect.objectContaining({
          activeQuestIds: [],
          completedQuestIds: [129],
          exp: 3633,
          level: 23,
          penya: 11500
        })
      }
    });
    expect(completed.body.character.inventory.items).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ itemId: "7166" })])
    );

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/quests`)
        .set("Authorization", authorization)
        .send(questRequest)
    ).resolves.toMatchObject({ status: 409, body: { error: "Quest has already been completed" } });
  });

  it("persists battle state and enforces stat allocation rules", async () => {
    const registerResponse = await registerFreshPlayer("Progression");
    const createResponse = await request(app)
      .post("/api/characters")
      .set("Authorization", `Bearer ${registerResponse.body.token}`)
      .send({ slotIndex: 0, name: "PointHero", gender: "male" });

    const authorization = `Bearer ${registerResponse.body.token}`;
    const characterId = createResponse.body.character.id;

    await expect(
      request(app)
        .put(`/api/characters/${characterId}/progression/battle-state`)
        .set("Authorization", authorization)
        .send({ exp: 6, level: 2, penya: 42 })
    ).resolves.toMatchObject({
      status: 200,
      body: {
        character: expect.objectContaining({
          name: "PointHero",
          exp: 6,
          level: 2,
          penya: 42
        })
      }
    });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/progression/stat-allocations`)
        .set("Authorization", authorization)
        .send({ allocations: { str: 2, sta: 0, dex: 0, int: 0 } })
    ).resolves.toMatchObject({
      status: 200,
      body: {
        character: expect.objectContaining({ stats: { str: 17, sta: 15, dex: 15, int: 15 } })
      }
    });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/progression/stat-allocations`)
        .set("Authorization", authorization)
        .send({ allocations: { str: 1, sta: 0, dex: 0, int: 0 } })
    ).resolves.toMatchObject({
      status: 422,
      body: { code: "domain_rule_failed", error: "Not enough stat points" }
    });

    db.prepare("UPDATE characters SET level = 15, job = 'Mercenary' WHERE id = ?").run(characterId);

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/progression/skill-allocations`)
        .set("Authorization", authorization)
        .send({ allocations: { "226": 1 } })
    ).resolves.toMatchObject({
      status: 200,
      body: {
        character: expect.objectContaining({
          job: "Mercenary",
          level: 15,
          skillLevels: { "226": 1 }
        })
      }
    });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/progression/skill-allocations`)
        .set("Authorization", authorization)
        .send({ allocations: { "226": 1 } })
    ).resolves.toMatchObject({
      status: 422,
      body: {
        code: "domain_rule_failed",
        error: "The skill is already at its maximum level"
      }
    });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/inventory/loot`)
        .set("Authorization", authorization)
        .send({ items: [{ itemId: "5325", quantity: 2 }] })
    ).resolves.toMatchObject({
      status: 200,
      body: {
        character: expect.objectContaining({
          inventory: expect.objectContaining({
            items: expect.arrayContaining([{ slotIndex: 0, itemId: "5325", quantity: 5 }])
          })
        })
      }
    });

    await expect(
      request(app)
        .put(`/api/characters/${characterId}/progression/battle-state`)
        .set("Authorization", authorization)
        .send({})
    ).resolves.toMatchObject({
      status: 400,
      body: { error: "A complete battle progression state is required" }
    });

    await expect(
      request(app)
        .put("/api/characters/missing/progression/battle-state")
        .set("Authorization", authorization)
        .send({ exp: 0, level: 1, penya: 0 })
    ).resolves.toMatchObject({
      status: 404,
      body: { error: "Character not found" }
    });
  });

  it("validates travel access and consumes the matching Blinkwing", async () => {
    const registerResponse = await registerFreshPlayer("Traveller");
    const authorization = `Bearer ${registerResponse.body.token}`;
    const createResponse = await request(app)
      .post("/api/characters")
      .set("Authorization", authorization)
      .send({ slotIndex: 0, name: "MapTraveller", gender: "male" });
    const characterId = createResponse.body.character.id as string;

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/travel`)
        .set("Authorization", authorization)
        .send({ destination: "darkon3", method: "flying" })
    ).resolves.toMatchObject({
      status: 403,
      body: { error: "A tier 2 flying item is required" }
    });

    characterRepository.setInventoryItemForPlayer(characterId, registerResponse.body.user.id, {
      slotIndex: 6,
      itemId: "4602",
      quantity: 1
    });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/travel`)
        .set("Authorization", authorization)
        .send({ destination: "darkon12", method: "blinkwing" })
    ).resolves.toMatchObject({
      status: 200,
      body: {
        character: expect.objectContaining({
          location: "Darkon 1 and 2",
          inventory: expect.objectContaining({
            items: expect.not.arrayContaining([expect.objectContaining({ itemId: "4602" })])
          })
        })
      }
    });
  });

  it("serves local town shop inventories", async () => {
    await expect(request(app).get("/api/shops/sain-city/magic-vendor")).resolves.toMatchObject({
      status: 200,
      body: {
        shop: {
          id: "sain-city/magic-vendor",
          merchantNames: ["Martin"],
          merchants: expect.arrayContaining([
            expect.objectContaining({
              name: "Martin",
              tabs: expect.arrayContaining([
                expect.objectContaining({
                  label: "Wand",
                  items: expect.arrayContaining([
                    expect.objectContaining({
                      id: "1067",
                      name: "Cubic Wand from Game Data",
                      icon: "fixture-cubic-wand.png",
                      buyPrice: 6600,
                      maxStack: 1,
                      price: 6600
                    })
                  ])
                })
              ])
            })
          ])
        }
      }
    });

    await expect(request(app).get("/api/shops/flarine-town/red-chip-merchant")).resolves.toMatchObject({
      status: 404,
      body: { error: "Shop not found" }
    });

    await expect(request(app).get("/api/shops/flarine-town/station")).resolves.toMatchObject({
      status: 200,
      body: {
        shop: {
          merchantNames: ["Dior"],
          merchants: [
            expect.objectContaining({
              name: "Dior",
              tabs: expect.arrayContaining([
                expect.objectContaining({
                  label: "Broom",
                  items: expect.arrayContaining([
                    expect.objectContaining({
                      id: "8507",
                      name: "Magic Broom",
                      price: 50000,
                      description: expect.stringContaining(
                        "Allows free travel up to Saint Morning and Rhisis."
                      )
                    }),
                    expect.objectContaining({
                      id: "2128",
                      description: expect.stringContaining(
                        "Allows free travel up to Darkon 1, 2, and Darkon 3."
                      )
                    }),
                    expect.objectContaining({
                      id: "3258",
                      description: expect.stringContaining(
                        "Allows free travel up to Shaduwar and the Valley of the Risen."
                      )
                    }),
                    expect.objectContaining({
                      id: "7336",
                      description: expect.stringContaining("Allows free travel up to Eillun and Bahara.")
                    })
                  ])
                }),
                expect.objectContaining({
                  label: "Board",
                  items: expect.arrayContaining([
                    expect.objectContaining({
                      id: "7182",
                      description: expect.stringContaining(
                        "Allows free travel up to Saint Morning and Rhisis."
                      )
                    }),
                    expect.objectContaining({
                      id: "4482",
                      description: expect.stringContaining(
                        "Allows free travel up to Darkon 1, 2, and Darkon 3."
                      )
                    }),
                    expect.objectContaining({
                      id: "6333",
                      description: expect.stringContaining(
                        "Allows free travel up to Shaduwar and the Valley of the Risen."
                      )
                    }),
                    expect.objectContaining({
                      id: "4715",
                      description: expect.stringContaining("Allows free travel up to Eillun and Bahara.")
                    })
                  ])
                })
              ])
            })
          ]
        }
      }
    });
  });

  it("purchases only stocked town shop items at server-controlled prices", async () => {
    const registerResponse = await registerFreshPlayer("Shopper");
    const authorization = `Bearer ${registerResponse.body.token}`;
    const createResponse = await request(app)
      .post("/api/characters")
      .set("Authorization", authorization)
      .send({ slotIndex: 0, name: "StoreHero", gender: "female" });
    const characterId = createResponse.body.character.id;

    await request(app)
      .put(`/api/characters/${characterId}/progression/battle-state`)
      .set("Authorization", authorization)
      .send({ exp: 0, level: 1, penya: 1_000 });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/shops/darken-city/food-vendor/purchases`)
        .set("Authorization", authorization)
        .send({ itemId: "5325", quantity: 2 })
    ).resolves.toMatchObject({
      status: 200,
      body: { character: expect.objectContaining({ penya: 920 }) }
    });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/shops/flarine-town/general-store/purchases`)
        .set("Authorization", authorization)
        .send({ itemId: "5869", quantity: 3 })
    ).resolves.toMatchObject({
      status: 200,
      body: {
        character: expect.objectContaining({
          penya: 770,
          inventory: expect.objectContaining({
            items: expect.arrayContaining([expect.objectContaining({ itemId: "5869", quantity: 3 })])
          })
        })
      }
    });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/shops/flarine-town/general-store/purchases`)
        .set("Authorization", authorization)
        .send({ itemId: "999999", quantity: 1 })
    ).resolves.toMatchObject({ status: 404, body: { error: "Shop item not found" } });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/shops/flarine-town/general-store/purchases`)
        .set("Authorization", authorization)
        .send({ itemId: "5869", quantity: 10_000 })
    ).resolves.toMatchObject({ status: 400 });
  });

  it("lets admins refund stat and skill points for their characters", async () => {
    const loginResponse = await loginDemoPlayer();
    const charactersResponse = await request(app)
      .get("/api/characters")
      .set("Authorization", `Bearer ${loginResponse.body.token}`);
    const characterId = charactersResponse.body.characters[0].id;
    const startingPenya = charactersResponse.body.characters[0].penya;

    await expect(
      request(app)
        .post(`/api/admin/characters/${characterId}/penya`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ amount: 2_500 })
    ).resolves.toMatchObject({
      status: 200,
      body: { character: expect.objectContaining({ penya: startingPenya + 2_500 }) }
    });

    await expect(
      request(app)
        .post(`/api/admin/characters/${characterId}/penya`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ amount: 0 })
    ).resolves.toMatchObject({ status: 400, body: { error: "A positive Penya amount is required" } });

    characterRepository.updateProgressionForPlayer(characterId, loginResponse.body.user.id, {
      stats: { str: 19, sta: 18, dex: 17, int: 16 },
      skillLevels: { "vagrant-clean-hit": 2 }
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

  it("equips, consumes, and clears recovery items through the character API", async () => {
    const playerResponse = await registerFreshPlayer("Consumables");
    const createResponse = await request(app)
      .post("/api/characters")
      .set("Authorization", `Bearer ${playerResponse.body.token}`)
      .send({ slotIndex: 0, name: "FoodHero", gender: "female" });
    const characterId = createResponse.body.character.id;
    const authorization = `Bearer ${playerResponse.body.token}`;

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/consumables/hp`)
        .set("Authorization", authorization)
        .send({ slotIndex: 0 })
    ).resolves.toMatchObject({
      status: 200,
      body: {
        character: expect.objectContaining({
          consumableLoadout: expect.objectContaining({ hp: { itemId: "5325", quantity: 3 } })
        })
      }
    });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/consumables/hp/consume`)
        .set("Authorization", authorization)
    ).resolves.toMatchObject({
      status: 200,
      body: {
        character: expect.objectContaining({
          consumableLoadout: expect.objectContaining({ hp: { itemId: "5325", quantity: 2 } })
        })
      }
    });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/consumables/hp`)
        .set("Authorization", authorization)
        .send({ slotIndex: null })
    ).resolves.toMatchObject({
      status: 200,
      body: {
        character: expect.objectContaining({
          consumableLoadout: expect.objectContaining({ hp: null }),
          inventory: expect.objectContaining({
            items: expect.arrayContaining([expect.objectContaining({ itemId: "5325", quantity: 2 })])
          })
        })
      }
    });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/consumables/invalid`)
        .set("Authorization", authorization)
        .send({ slotIndex: 0 })
    ).resolves.toMatchObject({ status: 400, body: { error: "Consumable item is required" } });

    await expect(
      request(app)
        .post(`/api/characters/${characterId}/consumables/mp/consume`)
        .set("Authorization", authorization)
    ).resolves.toMatchObject({ status: 404, body: { error: "Consumable slot is empty" } });
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
        .query({ confirmationName: "DeleteHero" })
    ).resolves.toMatchObject({
      status: 404,
      body: { error: "Character not found" }
    });

    await expect(
      request(app)
        .delete(`/api/characters/${createResponse.body.character.id}`)
        .set("Authorization", `Bearer ${registerResponse.body.token}`)
        .query({ confirmationName: "WrongName" })
    ).resolves.toMatchObject({
      status: 400,
      body: { error: "Character name confirmation does not match" }
    });

    await expect(
      request(app)
        .delete(`/api/characters/${createResponse.body.character.id}`)
        .set("Authorization", `Bearer ${registerResponse.body.token}`)
        .query({ confirmationName: "DeleteHero" })
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
