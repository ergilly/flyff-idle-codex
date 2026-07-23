import bcrypt from "bcryptjs";
import { closeDatabase, db } from "../../src/data/database.js";
import { seedDemoData } from "../../src/data/seedDemoData.js";

function ensureDatabaseSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY NOT NULL,
      player_id TEXT NOT NULL,
      slot_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT 'male',
      job TEXT NOT NULL,
      progression_rank TEXT NOT NULL DEFAULT 'normal',
      location TEXT NOT NULL DEFAULT 'Flaris',
      level INTEGER NOT NULL DEFAULT 1,
      exp INTEGER NOT NULL DEFAULT 0,
      penya INTEGER NOT NULL DEFAULT 0,
      inventory_size INTEGER NOT NULL DEFAULT 50,
      str INTEGER NOT NULL DEFAULT 15,
      sta INTEGER NOT NULL DEFAULT 15,
      dex INTEGER NOT NULL DEFAULT 15,
      int INTEGER NOT NULL DEFAULT 15,
      skill_levels TEXT NOT NULL DEFAULT '{}',
      consumable_loadout TEXT NOT NULL DEFAULT '{}',
      equipment_sets TEXT NOT NULL DEFAULT '[]',
      helmet TEXT,
      suit TEXT,
      gloves TEXT,
      boots TEXT,
      flying TEXT,
      cs_boots TEXT,
      cs_gloves TEXT,
      cs_suit TEXT,
      cs_helm TEXT,
      mask TEXT,
      cloak TEXT,
      ammo TEXT,
      ammo_quantity INTEGER NOT NULL DEFAULT 0,
      ammo_quantities TEXT NOT NULL DEFAULT '[0,0,0]',
      offhand TEXT,
      mainhand TEXT,
      ring_r TEXT,
      earring_r TEXT,
      necklace TEXT,
      earring_l TEXT,
      ring_l TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS characters_player_slot_idx
      ON characters (player_id, slot_index);

    CREATE INDEX IF NOT EXISTS characters_player_idx
      ON characters (player_id);

    CREATE TABLE IF NOT EXISTS character_inventory_items (
      id TEXT PRIMARY KEY NOT NULL,
      character_id TEXT NOT NULL,
      slot_index INTEGER NOT NULL,
      item_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS character_inventory_character_slot_idx
      ON character_inventory_items (character_id, slot_index);

    CREATE INDEX IF NOT EXISTS character_inventory_character_idx
      ON character_inventory_items (character_id);

    CREATE TABLE IF NOT EXISTS character_quests (
      character_id TEXT NOT NULL,
      quest_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      accepted_at TEXT NOT NULL,
      completed_at TEXT,
      PRIMARY KEY (character_id, quest_id),
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS character_quests_character_status_idx
      ON character_quests (character_id, status);

    CREATE TABLE IF NOT EXISTS bank_accounts (
      player_id TEXT PRIMARY KEY NOT NULL,
      penya INTEGER NOT NULL DEFAULT 0,
      inventory_size INTEGER NOT NULL DEFAULT 100,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bank_inventory_items (
      id TEXT PRIMARY KEY NOT NULL,
      player_id TEXT NOT NULL,
      slot_index INTEGER NOT NULL,
      item_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (player_id) REFERENCES bank_accounts(player_id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS bank_inventory_player_slot_idx
      ON bank_inventory_items (player_id, slot_index);
  `);
}

function ensureCharacterProgressionColumns() {
  const userColumns = new Set(
    (db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>).map((column) => column.name)
  );
  const characterColumns = new Set(
    (db.prepare("PRAGMA table_info(characters)").all() as Array<{ name: string }>).map(
      (column) => column.name
    )
  );

  if (!userColumns.has("is_admin")) {
    db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0");
  }

  if (!characterColumns.has("progression_rank")) {
    db.exec("ALTER TABLE characters ADD COLUMN progression_rank TEXT NOT NULL DEFAULT 'normal'");
  }

  if (!characterColumns.has("location")) {
    db.exec("ALTER TABLE characters ADD COLUMN location TEXT NOT NULL DEFAULT 'Flaris'");
  }

  if (!characterColumns.has("skill_levels")) {
    db.exec("ALTER TABLE characters ADD COLUMN skill_levels TEXT NOT NULL DEFAULT '{}'");
  }

  if (!characterColumns.has("equipment_sets")) {
    db.exec("ALTER TABLE characters ADD COLUMN equipment_sets TEXT NOT NULL DEFAULT '[]'");
  }

  if (!characterColumns.has("consumable_loadout")) {
    db.exec("ALTER TABLE characters ADD COLUMN consumable_loadout TEXT NOT NULL DEFAULT '{}'");
  }

  if (!characterColumns.has("ammo_quantity")) {
    db.exec("ALTER TABLE characters ADD COLUMN ammo_quantity INTEGER NOT NULL DEFAULT 0");
  }

  if (!characterColumns.has("ammo_quantities")) {
    db.exec("ALTER TABLE characters ADD COLUMN ammo_quantities TEXT NOT NULL DEFAULT '[0,0,0]'");
  }
}

export async function resetTestDatabase() {
  ensureDatabaseSchema();
  ensureCharacterProgressionColumns();
  db.prepare("DELETE FROM bank_accounts").run();
  db.prepare("DELETE FROM characters").run();
  db.prepare("DELETE FROM users").run();

  const passwordHash = await bcrypt.hash("password123", 10);

  return seedDemoData({ passwordHash });
}

export async function disconnectTestDatabase() {
  closeDatabase();
}
