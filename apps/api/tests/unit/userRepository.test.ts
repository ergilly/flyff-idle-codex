import bcrypt from "bcryptjs";
import { characterRepository } from "../../src/data/characterRepository.js";
import { seedDemoData } from "../../src/data/seedDemoData.js";
import { userRepository } from "../../src/data/userRepository.js";
import { disconnectTestDatabase, resetTestDatabase } from "../setup/database.js";

describe("user repository", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("creates users with normalized emails and resolves users by id", () => {
    const created = userRepository.create({
      email: "MixedCase@Flyff-Idle.Local",
      displayName: "Mixed Case",
      passwordHash: "hash"
    });

    expect(created).toEqual(
      expect.objectContaining({
        email: "mixedcase@flyff-idle.local",
        displayName: "Mixed Case",
        isAdmin: false
      })
    );
    expect(userRepository.findByEmail("MIXEDCASE@FLYFF-IDLE.LOCAL")).toEqual(created);
    expect(userRepository.findById(created.id)).toEqual(created);
    expect(userRepository.findById("missing")).toBeUndefined();
  });

  it("updates existing seeded users instead of duplicating them", async () => {
    const passwordHash = await bcrypt.hash("new-password", 10);

    await seedDemoData({ passwordHash });

    expect(userRepository.findByEmail("test@flyff-idle.local")).toEqual(
      expect.objectContaining({
        displayName: "Prototype Pilot",
        passwordHash,
        isAdmin: true
      })
    );
    expect(userRepository.findByEmail("thirdjobs@flyff-idle.local")).toEqual(
      expect.objectContaining({
        displayName: "Third Job Tester",
        passwordHash,
        isAdmin: true
      })
    );
    const emptyRosterUser = userRepository.findByEmail("empty@flyff-idle.local");

    expect(emptyRosterUser).toEqual(
      expect.objectContaining({
        displayName: "Empty Roster Tester",
        passwordHash,
        isAdmin: false
      })
    );
    expect(characterRepository.listByPlayerId(emptyRosterUser?.id ?? "")).toEqual([]);
  });
});
