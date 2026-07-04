import { login, register, verifyToken } from "../../src/auth/auth.service.js";
import { disconnectTestDatabase, resetTestDatabase } from "../setup/database.js";

describe("auth service", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("logs in a demo user and returns a verifiable token", async () => {
    const session = await login({
      email: "test@flyff-idle.local",
      password: "password123"
    });

    expect(session?.user.email).toBe("test@flyff-idle.local");
    expect(session?.user).not.toHaveProperty("passwordHash");
    expect(verifyToken(session?.token ?? "")?.email).toBe("test@flyff-idle.local");
  });

  it("rejects invalid passwords with a specific reason", async () => {
    await expect(
      login({
        email: "test@flyff-idle.local",
        password: "wrong-password"
      })
    ).resolves.toEqual({ error: "invalid_password" });
  });

  it("rejects login for unknown players with a specific reason", async () => {
    await expect(
      login({
        email: "missing@flyff-idle.local",
        password: "password123"
      })
    ).resolves.toEqual({ error: "unknown_email" });
  });

  it("registers a new player profile and returns a verifiable token", async () => {
    const email = `new-player-${Date.now()}@flyff-idle.local`;
    const session = await register({
      displayName: "New Pilot",
      email,
      password: "password123"
    });

    expect(session?.user.email).toBe(email);
    expect(session?.user.displayName).toBe("New Pilot");
    expect(verifyToken(session?.token ?? "")?.email).toBe(email);
  });

  it("rejects duplicate registration emails", async () => {
    await expect(
      register({
        displayName: "Duplicate Pilot",
        email: "test@flyff-idle.local",
        password: "password123"
      })
    ).resolves.toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyToken("not-a-token")).toBeNull();
  });
});
