import { randomUUID } from "node:crypto";
import { db } from "./database.js";
import type { User } from "../types.js";

export async function seedDemoData({ passwordHash }: { passwordHash: string }) {
  const now = new Date().toISOString();
  const existingUser = db
    .prepare(
      "SELECT id, email, display_name AS displayName, password_hash AS passwordHash FROM users WHERE email = ?"
    )
    .get("test@flyff-idle.local") as User | undefined;
  let user: User;

  if (existingUser) {
    db.prepare("UPDATE users SET display_name = ?, password_hash = ?, updated_at = ? WHERE id = ?").run(
      "Prototype Pilot",
      passwordHash,
      now,
      existingUser.id
    );
    user = {
      ...existingUser,
      displayName: "Prototype Pilot",
      passwordHash
    };
  } else {
    user = {
      id: randomUUID(),
      email: "test@flyff-idle.local",
      displayName: "Prototype Pilot",
      passwordHash
    };
    db.prepare(
      "INSERT INTO users (id, email, display_name, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(user.id, user.email, user.displayName, user.passwordHash, now, now);
  }

  db.prepare("DELETE FROM characters WHERE player_id = ?").run(user.id);

  const insertCharacter = db.prepare(
    "INSERT INTO characters (id, player_id, slot_index, name, gender, job, level, exp, penya, inventory_size, str, sta, dex, int, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  insertCharacter.run(
    randomUUID(),
    user.id,
    0,
    "Saint Morning",
    "female",
    "Mercenary",
    15,
    0,
    0,
    50,
    15,
    15,
    15,
    15,
    now,
    now
  );
  insertCharacter.run(
    randomUUID(),
    user.id,
    1,
    "Buff Pang Jr",
    "male",
    "Assist",
    18,
    0,
    0,
    50,
    15,
    15,
    15,
    15,
    now,
    now
  );

  return user;
}
