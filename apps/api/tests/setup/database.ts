import bcrypt from "bcryptjs";
import { closeDatabase, db } from "../../src/data/database.js";
import { seedDemoData } from "../../src/data/seedDemoData.js";

function ensureCharacterProgressionColumns() {
  const characterColumns = new Set(
    (db.prepare("PRAGMA table_info(characters)").all() as Array<{ name: string }>).map((column) => column.name)
  );

  if (!characterColumns.has("progression_rank")) {
    db.exec("ALTER TABLE characters ADD COLUMN progression_rank TEXT NOT NULL DEFAULT 'normal'");
  }

  if (!characterColumns.has("skill_levels")) {
    db.exec("ALTER TABLE characters ADD COLUMN skill_levels TEXT NOT NULL DEFAULT '{}'");
  }
}

export async function resetTestDatabase() {
  ensureCharacterProgressionColumns();
  db.prepare("DELETE FROM characters").run();
  db.prepare("DELETE FROM users").run();

  const passwordHash = await bcrypt.hash("password123", 10);

  return seedDemoData({ passwordHash });
}

export async function disconnectTestDatabase() {
  closeDatabase();
}
