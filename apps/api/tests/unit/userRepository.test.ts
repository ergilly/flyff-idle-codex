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
    const regularPlayer = userRepository.create({
      email: "regular-player@example.com",
      displayName: "Regular Player",
      passwordHash: "regular-player-hash"
    });

    await seedDemoData({ passwordHash });

    expect(userRepository.findById(regularPlayer.id)).toEqual(regularPlayer);

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
    const secondJobUser = userRepository.findByEmail("secondjobs@flyff-idle.local");

    expect(secondJobUser).toEqual(
      expect.objectContaining({
        displayName: "Second Job Tester",
        passwordHash,
        isAdmin: true
      })
    );
    expect(characterRepository.listByPlayerId(secondJobUser?.id ?? "")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job: "Blade",
          level: 120,
          stats: {
            str: 253,
            sta: 15,
            dex: 15,
            int: 15
          },
          equipment: expect.objectContaining({
            helmet: "7039",
            suit: "8994",
            gloves: "6355",
            boots: "456",
            mainhand: "8767",
            offhand: "8767"
          })
        }),
        expect.objectContaining({
          job: "Ranger",
          level: 120,
          stats: {
            str: 15,
            sta: 15,
            dex: 253,
            int: 15
          },
          equipment: expect.objectContaining({
            helmet: "8430",
            suit: "7181",
            gloves: "4421",
            boots: "3514",
            mainhand: "3824"
          })
        })
      ])
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
