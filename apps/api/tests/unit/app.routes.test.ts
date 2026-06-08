import request from "supertest";
import { createApp } from "../../src/app.js";
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
          displayName: "Fresh Pilot"
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
