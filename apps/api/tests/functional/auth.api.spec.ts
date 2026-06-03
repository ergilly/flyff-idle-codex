import { expect, test } from "@playwright/test";

test("login returns a token and the token can load characters", async ({ request }) => {
  const loginResponse = await request.post("/api/auth/login", {
    data: {
      email: "test@flyff-idle.local",
      password: "password123"
    }
  });

  expect(loginResponse.ok()).toBeTruthy();

  const session = (await loginResponse.json()) as { token: string };
  expect(session.token).toBeTruthy();

  const charactersResponse = await request.get("/api/characters", {
    headers: {
      Authorization: `Bearer ${session.token}`
    }
  });

  expect(charactersResponse.ok()).toBeTruthy();
  const characterData = await charactersResponse.json();

  expect(characterData).toEqual(
    expect.objectContaining({
      characters: expect.arrayContaining([
        expect.objectContaining({
          name: "Saint Morning",
          job: "Mercenary",
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
    })
  );
});

test("characters require a bearer token", async ({ request }) => {
  const response = await request.get("/api/characters");

  expect(response.status()).toBe(401);
});

test("register creates a player session", async ({ request }) => {
  const email = `api-player-${Date.now()}@flyff-idle.local`;
  const response = await request.post("/api/auth/register", {
    data: {
      displayName: "API Pilot",
      email,
      password: "password123"
    }
  });

  expect(response.status()).toBe(201);

  const session = (await response.json()) as {
    token: string;
    user: { email: string; displayName: string };
  };

  expect(session.token).toBeTruthy();
  expect(session.user).toEqual(
    expect.objectContaining({
      displayName: "API Pilot",
      email
    })
  );
});
