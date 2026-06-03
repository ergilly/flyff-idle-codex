import { closeDatabase, db } from "./database.js";

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY NOT NULL,
    player_id TEXT NOT NULL,
    slot_index INTEGER NOT NULL,
    name TEXT NOT NULL,
    job TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    exp INTEGER NOT NULL DEFAULT 0,
    penya INTEGER NOT NULL DEFAULT 0,
    inventory_size INTEGER NOT NULL DEFAULT 50,
    str INTEGER NOT NULL DEFAULT 15,
    sta INTEGER NOT NULL DEFAULT 15,
    dex INTEGER NOT NULL DEFAULT 15,
    int INTEGER NOT NULL DEFAULT 15,
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
`);

const characterColumns = new Set(
  (db.prepare("PRAGMA table_info(characters)").all() as Array<{ name: string }>).map((column) => column.name)
);

function addCharacterColumn(name: string, definition: string) {
  if (!characterColumns.has(name)) {
    db.exec(`ALTER TABLE characters ADD COLUMN ${name} ${definition}`);
  }
}

addCharacterColumn("str", "INTEGER NOT NULL DEFAULT 15");
addCharacterColumn("penya", "INTEGER NOT NULL DEFAULT 0");
addCharacterColumn("inventory_size", "INTEGER NOT NULL DEFAULT 50");
addCharacterColumn("sta", "INTEGER NOT NULL DEFAULT 15");
addCharacterColumn("dex", "INTEGER NOT NULL DEFAULT 15");
addCharacterColumn("int", "INTEGER NOT NULL DEFAULT 15");
addCharacterColumn("helmet", "TEXT");
addCharacterColumn("suit", "TEXT");
addCharacterColumn("gloves", "TEXT");
addCharacterColumn("boots", "TEXT");
addCharacterColumn("flying", "TEXT");
addCharacterColumn("cs_boots", "TEXT");
addCharacterColumn("cs_gloves", "TEXT");
addCharacterColumn("cs_suit", "TEXT");
addCharacterColumn("cs_helm", "TEXT");
addCharacterColumn("mask", "TEXT");
addCharacterColumn("cloak", "TEXT");
addCharacterColumn("ammo", "TEXT");
addCharacterColumn("offhand", "TEXT");
addCharacterColumn("mainhand", "TEXT");
addCharacterColumn("ring_r", "TEXT");
addCharacterColumn("earring_r", "TEXT");
addCharacterColumn("necklace", "TEXT");
addCharacterColumn("earring_l", "TEXT");
addCharacterColumn("ring_l", "TEXT");

closeDatabase();
