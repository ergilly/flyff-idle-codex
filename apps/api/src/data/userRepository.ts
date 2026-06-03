import { randomUUID } from "node:crypto";
import { db } from "./database.js";
import type { User } from "../types.js";

export const userRepository = {
  findByEmail(email: string) {
    return db
      .prepare(
        "SELECT id, email, display_name AS displayName, password_hash AS passwordHash FROM users WHERE email = ?"
      )
      .get(email.toLowerCase()) as User | undefined;
  },
  create(input: { email: string; displayName: string; passwordHash: string }) {
    const now = new Date().toISOString();
    const user: User = {
      id: randomUUID(),
      email: input.email.toLowerCase(),
      displayName: input.displayName,
      passwordHash: input.passwordHash
    };

    db.prepare(
      "INSERT INTO users (id, email, display_name, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(user.id, user.email, user.displayName, user.passwordHash, now, now);

    return user;
  }
};
