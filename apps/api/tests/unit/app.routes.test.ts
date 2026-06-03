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
            slotIndex: 0,
            gender: "female"
          })
        ])
      }
    });
  });

  it("creates characters for authenticated players", async () => {
    const loginResponse = await loginDemoPlayer();

    await expect(
      request(app)
        .post("/api/characters")
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ slotIndex: 3, name: "RouteHero", gender: "male" })
    ).resolves.toMatchObject({
      status: 201,
      body: {
        character: expect.objectContaining({
          name: "RouteHero",
          slotIndex: 3,
          gender: "male",
          job: "Vagrant"
        })
      }
    });
  });
});
