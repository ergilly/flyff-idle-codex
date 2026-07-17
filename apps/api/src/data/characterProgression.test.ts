import { characterRepository } from "./characterRepository.js";
import { db } from "./database.js";
import { userRepository } from "./userRepository.js";
import { disconnectTestDatabase, resetTestDatabase } from "../../tests/setup/database.js";

describe("characterProgression", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("creates a vagrant with default stats and lists characters by player", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");

    expect(user).toBeDefined();

    const created = characterRepository.create({
      playerId: user!.id,
      slotIndex: 8,
      name: "Fresh Vagrant",
      gender: "female"
    });

    expect(created).toEqual(
      expect.objectContaining({
        name: "Fresh Vagrant",
        slotIndex: 8,
        gender: "female",
        job: "Vagrant",
        progressionRank: "normal",
        level: 1,
        exp: 0,
        penya: 0,
        stats: {
          str: 15,
          sta: 15,
          dex: 15,
          int: 15
        },
        skillLevels: {},
        equipment: expect.objectContaining({
          mainhand: "3497",
          suit: "6040",
          gloves: "5011",
          boots: "8195"
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
    );

    expect(created?.playerId).toBe(user!.id);
    expect(characterRepository.listByPlayerId(user!.id).map((character) => character.name)).toEqual([
      "Fresh Vagrant",
      "Saint Morning",
      "Buff Pang Jr",
      "Madrigal Mage",
      "Darkon Archer",
      "Clockworks Blade",
      "Master Guardian",
      "Hero Seraph",
      "Fresh Vagrant"
    ]);
  });

  it("updates persisted stats and skill levels for the owning player", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 11,
      name: "Builder",
      gender: "male"
    });

    const updated = characterRepository.updateProgressionForPlayer(character!.id, user!.id, {
      stats: {
        str: 18,
        sta: 17,
        dex: 15,
        int: 15
      },
      penya: 321,
      skillLevels: {
        "vagrant-clean-hit": 3,
        "vagrant-brandish": 1
      }
    });

    expect(updated).toEqual(
      expect.objectContaining({
        stats: {
          str: 18,
          sta: 17,
          dex: 15,
          int: 15
        },
        penya: 321,
        skillLevels: {
          "vagrant-clean-hit": 3,
          "vagrant-brandish": 1
        }
      })
    );
    expect(
      characterRepository.updateProgressionForPlayer(character!.id, "other-player", { skillLevels: {} })
    ).toBeNull();
    expect(characterRepository.findById(character!.id)?.skillLevels).toEqual({
      "vagrant-clean-hit": 3,
      "vagrant-brandish": 1
    });

    expect(
      characterRepository.updateProgressionForPlayer(character!.id, user!.id, { stats: undefined })
    ).toEqual(
      expect.objectContaining({
        stats: {
          str: 18,
          sta: 17,
          dex: 15,
          int: 15
        },
        skillLevels: {
          "vagrant-clean-hit": 3,
          "vagrant-brandish": 1
        },
        penya: 321
      })
    );
  });

  it("refunds stats and skills independently for the owning player", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 12,
      name: "RefundHero",
      gender: "male"
    });

    characterRepository.updateProgressionForPlayer(character!.id, user!.id, {
      stats: {
        str: 22,
        sta: 18,
        dex: 17,
        int: 16
      },
      skillLevels: {
        "vagrant-clean-hit": 3,
        "vagrant-brandish": 1
      }
    });

    expect(characterRepository.refundStatsForPlayer(character!.id, user!.id)).toEqual(
      expect.objectContaining({
        stats: {
          str: 15,
          sta: 15,
          dex: 15,
          int: 15
        },
        skillLevels: {
          "vagrant-clean-hit": 3,
          "vagrant-brandish": 1
        }
      })
    );
    expect(characterRepository.refundStatsForPlayer(character!.id, "other-player")).toBeNull();

    expect(characterRepository.refundSkillsForPlayer(character!.id, user!.id)).toEqual(
      expect.objectContaining({
        stats: {
          str: 15,
          sta: 15,
          dex: 15,
          int: 15
        },
        skillLevels: {}
      })
    );
    expect(characterRepository.refundSkillsForPlayer(character!.id, "other-player")).toBeNull();
  });

  it("adds Penya only for the owning player", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 13,
      name: "Penya Hero",
      gender: "female"
    });

    expect(characterRepository.addPenyaForPlayer(character!.id, user!.id, 2_500)).toEqual(
      expect.objectContaining({ penya: 2_500 })
    );
    expect(characterRepository.addPenyaForPlayer(character!.id, "other-player", 1_000)).toBeNull();
    expect(characterRepository.findById(character!.id)?.penya).toBe(2_500);
  });

  it("normalizes invalid persisted skill level payloads", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 19,
      name: "SkillJson",
      gender: "male"
    });

    db.prepare("UPDATE characters SET skill_levels = ? WHERE id = ?").run("not json", character!.id);
    expect(characterRepository.findById(character!.id)?.skillLevels).toEqual({});

    db.prepare("UPDATE characters SET skill_levels = ? WHERE id = ?").run(
      JSON.stringify({
        "vagrant-clean-hit": 2,
        empty: 0,
        bad: "2"
      }),
      character!.id
    );
    expect(characterRepository.findById(character!.id)?.skillLevels).toEqual({
      "vagrant-clean-hit": 2
    });
  });
});
