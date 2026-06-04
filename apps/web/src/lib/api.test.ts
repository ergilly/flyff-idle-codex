import { createCharacter, deleteCharacter, fetchCharacters, login, register } from "./api";

function mockFetch(response: Partial<Response>) {
  global.fetch = jest.fn().mockResolvedValue({
    json: jest.fn().mockResolvedValue({}),
    ...response
  }) as jest.Mock;
}

describe("api client", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("logs in and sends credentials to the API", async () => {
    mockFetch({
      ok: true,
      json: jest.fn().mockResolvedValue({ token: "token", user: { id: "user-1" } })
    });

    await expect(login("pilot@example.com", "password123")).resolves.toEqual({
      token: "token",
      user: { id: "user-1" }
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "pilot@example.com", password: "password123" })
      })
    );
  });

  it("maps auth and character API failures to user-facing errors", async () => {
    mockFetch({ ok: false, status: 401 });
    await expect(login("pilot@example.com", "bad-password")).rejects.toThrow("Invalid email or password");

    mockFetch({ ok: false, status: 409 });
    await expect(register("Pilot", "pilot@example.com", "password123")).rejects.toThrow(
      "Email already registered"
    );

    mockFetch({ ok: false, status: 500 });
    await expect(register("Pilot", "pilot@example.com", "password123")).rejects.toThrow(
      "Unable to create profile"
    );

    mockFetch({ ok: false, status: 500 });
    await expect(fetchCharacters("token")).rejects.toThrow("Unable to load characters");

    mockFetch({ ok: false, status: 409 });
    await expect(createCharacter("token", 0, "Hero", "male")).rejects.toThrow(
      "That character slot is already occupied"
    );

    mockFetch({ ok: false, status: 500 });
    await expect(createCharacter("token", 0, "Hero", "female")).rejects.toThrow("Unable to create character");

    mockFetch({ ok: false, status: 400 });
    await expect(deleteCharacter("token", "char-1", "Hero")).rejects.toThrow(
      "Character name confirmation does not match"
    );

    mockFetch({ ok: false, status: 500 });
    await expect(deleteCharacter("token", "char-1", "Hero")).rejects.toThrow("Unable to delete character");
  });

  it("loads and creates characters with bearer tokens", async () => {
    const character = {
      id: "char-1",
      slotIndex: 0,
      name: "Hero",
      gender: "male",
      job: "Vagrant",
      level: 1,
      exp: 0,
      penya: 0,
      stats: { str: 15, sta: 15, dex: 15, int: 15 },
      equipment: {},
      inventory: { size: 50, items: [] }
    };

    mockFetch({
      ok: true,
      json: jest.fn().mockResolvedValue({ characters: [character] })
    });

    await expect(fetchCharacters("token")).resolves.toEqual([character]);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/characters",
      expect.objectContaining({
        headers: {
          Authorization: "Bearer token"
        }
      })
    );

    mockFetch({
      ok: true,
      json: jest.fn().mockResolvedValue({ character })
    });

    await expect(createCharacter("token", 2, "Hero", "female")).resolves.toEqual(character);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/characters",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ slotIndex: 2, name: "Hero", gender: "female" })
      })
    );

    mockFetch({ ok: true });

    await expect(deleteCharacter("token", "char-1", "Hero")).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/characters/char-1",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ name: "Hero" })
      })
    );
  });
});
