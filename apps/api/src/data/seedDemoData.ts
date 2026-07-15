import { randomUUID } from "node:crypto";
import { db } from "./database.js";
import { startingEquipmentByGender, startingMainhand } from "./starterLoadout.js";
import {
  createSeedEquipment,
  createSeedEquipmentSets,
  createSeedStats,
  secondJobLoadouts,
  secondJobStats
} from "./seedCharacterFactories.js";
import type {
  CharacterEquipment,
  CharacterGender,
  CharacterProgressionRank,
  CharacterStats,
  User
} from "../types.js";

type SeedCharacter = {
  gender: CharacterGender;
  job: string;
  level: number;
  equipment?: CharacterEquipment;
  name: string;
  progressionRank: CharacterProgressionRank;
  slotIndex: number;
  stats?: CharacterStats;
};

function upsertSeedUser({
  displayName,
  email,
  isAdmin = false,
  now,
  passwordHash
}: {
  displayName: string;
  email: string;
  isAdmin?: boolean;
  now: string;
  passwordHash: string;
}) {
  const existingUser = db
    .prepare(
      "SELECT id, email, display_name AS displayName, password_hash AS passwordHash, is_admin AS isAdmin FROM users WHERE email = ?"
    )
    .get(email) as (Omit<User, "isAdmin"> & { isAdmin: number }) | undefined;

  if (existingUser) {
    db.prepare(
      "UPDATE users SET display_name = ?, password_hash = ?, is_admin = ?, updated_at = ? WHERE id = ?"
    ).run(displayName, passwordHash, Number(isAdmin), now, existingUser.id);

    return {
      ...existingUser,
      displayName,
      passwordHash,
      isAdmin
    };
  }

  const user: User = {
    id: randomUUID(),
    email,
    displayName,
    passwordHash,
    isAdmin
  };

  db.prepare(
    "INSERT INTO users (id, email, display_name, password_hash, is_admin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(user.id, user.email, user.displayName, user.passwordHash, Number(user.isAdmin), now, now);

  return user;
}

function replaceSeedCharacters(user: Pick<User, "id">, characters: readonly SeedCharacter[], now: string) {
  db.prepare("DELETE FROM characters WHERE player_id = ?").run(user.id);

  const insertCharacter = db.prepare(
    `INSERT INTO characters (
      id,
      player_id,
      slot_index,
      name,
      gender,
      job,
      progression_rank,
      level,
      exp,
      penya,
      inventory_size,
      str,
      sta,
      dex,
      int,
      consumable_loadout,
      equipment_sets,
      helmet,
      suit,
      gloves,
      boots,
      flying,
      cs_boots,
      cs_gloves,
      cs_suit,
      cs_helm,
      mask,
      cloak,
      ammo,
      offhand,
      mainhand,
      ring_r,
      earring_r,
      necklace,
      earring_l,
      ring_l,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const femaleEquipment = startingEquipmentByGender.female;
  const maleEquipment = startingEquipmentByGender.male;
  for (const character of characters) {
    const startingEquipment = character.gender === "female" ? femaleEquipment : maleEquipment;
    const equipment =
      character.equipment ??
      createSeedEquipment({
        suit: startingEquipment.suit,
        gloves: startingEquipment.gloves,
        boots: startingEquipment.boots,
        mainhand: startingMainhand
      });
    const stats = character.stats ?? createSeedStats();

    insertCharacter.run(
      randomUUID(),
      user.id,
      character.slotIndex,
      character.name,
      character.gender,
      character.job,
      character.progressionRank,
      character.level,
      0,
      0,
      50,
      stats.str,
      stats.sta,
      stats.dex,
      stats.int,
      "{}",
      JSON.stringify(createSeedEquipmentSets(equipment)),
      equipment.helmet,
      equipment.suit,
      equipment.gloves,
      equipment.boots,
      equipment.flying,
      equipment.csBoots,
      equipment.csGloves,
      equipment.csSuit,
      equipment.csHelm,
      equipment.mask,
      equipment.cloak,
      equipment.ammo,
      equipment.offhand,
      equipment.mainhand,
      equipment.ringR,
      equipment.earringR,
      equipment.necklace,
      equipment.earringL,
      equipment.ringL,
      now,
      now
    );
  }
}

function seedDemoDataRecords({ passwordHash }: { passwordHash: string }) {
  const now = new Date().toISOString();
  const demoUser = upsertSeedUser({
    email: "test@flyff-idle.local",
    displayName: "Prototype Pilot",
    isAdmin: true,
    passwordHash,
    now
  });

  replaceSeedCharacters(
    demoUser,
    [
      {
        slotIndex: 0,
        name: "Fresh Vagrant",
        gender: "male",
        job: "Vagrant",
        progressionRank: "normal",
        level: 1
      },
      {
        slotIndex: 1,
        name: "Saint Morning",
        gender: "female",
        job: "Mercenary",
        progressionRank: "normal",
        level: 15
      },
      {
        slotIndex: 2,
        name: "Buff Pang Jr",
        gender: "male",
        job: "Assist",
        progressionRank: "normal",
        level: 18
      },
      {
        slotIndex: 3,
        name: "Madrigal Mage",
        gender: "female",
        job: "Magician",
        progressionRank: "normal",
        level: 30
      },
      {
        slotIndex: 4,
        name: "Darkon Archer",
        gender: "female",
        job: "Acrobat",
        progressionRank: "normal",
        level: 45
      },
      {
        slotIndex: 5,
        name: "Clockworks Blade",
        gender: "male",
        job: "Blade",
        progressionRank: "normal",
        level: 75
      },
      {
        slotIndex: 6,
        name: "Master Guardian",
        gender: "male",
        job: "Knight",
        progressionRank: "master",
        level: 96
      },
      {
        slotIndex: 7,
        name: "Hero Seraph",
        gender: "female",
        job: "Seraph",
        progressionRank: "hero",
        level: 130
      }
    ],
    now
  );

  const thirdJobUser = upsertSeedUser({
    email: "thirdjobs@flyff-idle.local",
    displayName: "Third Job Tester",
    isAdmin: true,
    passwordHash,
    now
  });

  replaceSeedCharacters(
    thirdJobUser,
    [
      { slotIndex: 0, name: "Slayer", gender: "male", job: "Slayer", progressionRank: "hero", level: 130 },
      { slotIndex: 1, name: "Templar", gender: "male", job: "Templar", progressionRank: "hero", level: 130 },
      {
        slotIndex: 2,
        name: "Arcanist",
        gender: "female",
        job: "Arcanist",
        progressionRank: "hero",
        level: 130
      },
      {
        slotIndex: 3,
        name: "Mentalist",
        gender: "female",
        job: "Mentalist",
        progressionRank: "hero",
        level: 130
      },
      {
        slotIndex: 4,
        name: "Forcemaster",
        gender: "male",
        job: "Forcemaster",
        progressionRank: "hero",
        level: 130
      },
      { slotIndex: 5, name: "Seraph", gender: "female", job: "Seraph", progressionRank: "hero", level: 130 },
      {
        slotIndex: 6,
        name: "Harlequin",
        gender: "female",
        job: "Harlequin",
        progressionRank: "hero",
        level: 130
      },
      {
        slotIndex: 7,
        name: "Crackshooter",
        gender: "female",
        job: "Crackshooter",
        progressionRank: "hero",
        level: 130
      }
    ],
    now
  );

  const secondJobUser = upsertSeedUser({
    email: "secondjobs@flyff-idle.local",
    displayName: "Second Job Tester",
    isAdmin: true,
    passwordHash,
    now
  });

  replaceSeedCharacters(
    secondJobUser,
    [
      {
        slotIndex: 0,
        name: "Blade",
        gender: "male",
        job: "Blade",
        progressionRank: "normal",
        level: 120,
        equipment: secondJobLoadouts.Blade,
        stats: secondJobStats.Blade
      },
      {
        slotIndex: 1,
        name: "Knight",
        gender: "male",
        job: "Knight",
        progressionRank: "normal",
        level: 120,
        equipment: secondJobLoadouts.Knight,
        stats: secondJobStats.Knight
      },
      {
        slotIndex: 2,
        name: "Elementor",
        gender: "male",
        job: "Elementor",
        progressionRank: "normal",
        level: 120,
        equipment: secondJobLoadouts.Elementor,
        stats: secondJobStats.Elementor
      },
      {
        slotIndex: 3,
        name: "Psykeeper",
        gender: "male",
        job: "Psykeeper",
        progressionRank: "normal",
        level: 120,
        equipment: secondJobLoadouts.Psykeeper,
        stats: secondJobStats.Psykeeper
      },
      {
        slotIndex: 4,
        name: "Billposter",
        gender: "male",
        job: "Billposter",
        progressionRank: "normal",
        level: 120,
        equipment: secondJobLoadouts.Billposter,
        stats: secondJobStats.Billposter
      },
      {
        slotIndex: 5,
        name: "Ringmaster",
        gender: "male",
        job: "Ringmaster",
        progressionRank: "normal",
        level: 120,
        equipment: secondJobLoadouts.Ringmaster,
        stats: secondJobStats.Ringmaster
      },
      {
        slotIndex: 6,
        name: "Jester",
        gender: "male",
        job: "Jester",
        progressionRank: "normal",
        level: 120,
        equipment: secondJobLoadouts.Jester,
        stats: secondJobStats.Jester
      },
      {
        slotIndex: 7,
        name: "Ranger",
        gender: "male",
        job: "Ranger",
        progressionRank: "normal",
        level: 120,
        equipment: secondJobLoadouts.Ranger,
        stats: secondJobStats.Ranger
      }
    ],
    now
  );

  const emptyRosterUser = upsertSeedUser({
    email: "empty@flyff-idle.local",
    displayName: "Empty Roster Tester",
    isAdmin: false,
    passwordHash,
    now
  });

  replaceSeedCharacters(emptyRosterUser, [], now);

  return demoUser;
}

export async function seedDemoData(input: { passwordHash: string }) {
  db.exec("BEGIN IMMEDIATE");

  try {
    const demoUser = seedDemoDataRecords(input);
    db.exec("COMMIT");
    return demoUser;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
