import bcrypt from "bcryptjs";
import { closeDatabase, db } from "../../src/data/database.js";
import { seedDemoData } from "../../src/data/seedDemoData.js";

export async function resetTestDatabase() {
  db.prepare("DELETE FROM characters").run();
  db.prepare("DELETE FROM users").run();

  const passwordHash = await bcrypt.hash("password123", 10);

  return seedDemoData({ passwordHash });
}

export async function disconnectTestDatabase() {
  closeDatabase();
}
