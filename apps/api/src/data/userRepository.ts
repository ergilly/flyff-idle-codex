import { randomUUID } from "node:crypto";
import { db } from "./database.js";
import type { User } from "../types.js";

type UserRow = Omit<User, "isAdmin"> & {
  isAdmin: number;
};

function mapUser(row: UserRow): User {
  return { ...row, isAdmin: Boolean(row.isAdmin) };
}

export const userRepository = {
  findByEmail(email: string) {
    const user = db
      .prepare(
        "SELECT id, email, display_name AS displayName, password_hash AS passwordHash, is_admin AS isAdmin FROM users WHERE email = ?"
      )
      .get(email.toLowerCase()) as UserRow | undefined;

    return user ? mapUser(user) : undefined;
  },
  findById(id: string) {
    const user = db
      .prepare(
        "SELECT id, email, display_name AS displayName, password_hash AS passwordHash, is_admin AS isAdmin FROM users WHERE id = ?"
      )
      .get(id) as UserRow | undefined;

    return user ? mapUser(user) : undefined;
  },
  create(input: { email: string; displayName: string; passwordHash: string }) {
    const now = new Date().toISOString();
    const user: User = {
      id: randomUUID(),
      email: input.email.toLowerCase(),
      displayName: input.displayName,
      passwordHash: input.passwordHash,
      isAdmin: false
    };

    db.prepare(
      "INSERT INTO users (id, email, display_name, password_hash, is_admin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(user.id, user.email, user.displayName, user.passwordHash, Number(user.isAdmin), now, now);

    return user;
  }
};
