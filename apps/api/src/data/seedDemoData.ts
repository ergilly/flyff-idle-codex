import { randomUUID } from "node:crypto";
import { db } from "./database.js";
import { startingEquipmentByGender, startingMainhand } from "./starterLoadout.js";
import type { CharacterGender, CharacterProgressionRank, User } from "../types.js";

type SeedCharacter = {
  gender: CharacterGender;
  job: string;
  level: number;
  name: string;
  progressionRank: CharacterProgressionRank;
  slotIndex: number;
};

function upsertSeedUser({
  displayName,
  email,
  now,
  passwordHash
}: {
  displayName: string;
  email: string;
  now: string;
  passwordHash: string;
}) {
  const existingUser = db
    .prepare(
      "SELECT id, email, display_name AS displayName, password_hash AS passwordHash FROM users WHERE email = ?"
    )
    .get(email) as Omit<User, "isAdmin"> | undefined;

  if (existingUser) {
    db.prepare("UPDATE users SET display_name = ?, password_hash = ?, updated_at = ? WHERE id = ?").run(
      displayName,
      passwordHash,
      now,
      existingUser.id
    );

    return {
      ...existingUser,
      displayName,
      passwordHash
    };
  }

  const user = {
    id: randomUUID(),
    email,
    displayName,
    passwordHash
  };

  db.prepare(
    "INSERT INTO users (id, email, display_name, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(user.id, user.email, user.displayName, user.passwordHash, now, now);

  return user;
}

function replaceSeedCharacters(user: Pick<User, "id">, characters: readonly SeedCharacter[], now: string) {
  db.prepare("DELETE FROM characters WHERE player_id = ?").run(user.id);

  const insertCharacter = db.prepare(
    "INSERT INTO characters (id, player_id, slot_index, name, gender, job, progression_rank, level, exp, penya, inventory_size, str, sta, dex, int, suit, gloves, boots, mainhand, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const femaleEquipment = startingEquipmentByGender.female;
  const maleEquipment = startingEquipmentByGender.male;
  for (const character of characters) {
    const equipment = character.gender === "female" ? femaleEquipment : maleEquipment;

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
      15,
      15,
      15,
      15,
      equipment.suit,
      equipment.gloves,
      equipment.boots,
      startingMainhand,
      now,
      now
    );
  }
}

export async function seedDemoData({ passwordHash }: { passwordHash: string }) {
  const now = new Date().toISOString();
  const demoUser = upsertSeedUser({
    email: "test@flyff-idle.local",
    displayName: "Prototype Pilot",
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

  return demoUser;
}
