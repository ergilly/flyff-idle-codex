import { randomUUID } from "node:crypto";
import { db } from "./database.js";
import type { User } from "../types.js";

const adminEmails = new Set(["test@flyff-idle.local", "thirdjobs@flyff-idle.local"]);

function withAdminRole(user: Omit<User, "isAdmin">): User {
  return {
    ...user,
    isAdmin: adminEmails.has(user.email.toLowerCase())
  };
}

export const userRepository = {
  findByEmail(email: string) {
    const user = db
      .prepare(
        "SELECT id, email, display_name AS displayName, password_hash AS passwordHash FROM users WHERE email = ?"
      )
      .get(email.toLowerCase()) as Omit<User, "isAdmin"> | undefined;

    return user ? withAdminRole(user) : undefined;
  },
  findById(id: string) {
    const user = db
      .prepare(
        "SELECT id, email, display_name AS displayName, password_hash AS passwordHash FROM users WHERE id = ?"
      )
      .get(id) as Omit<User, "isAdmin"> | undefined;

    return user ? withAdminRole(user) : undefined;
  },
  create(input: { email: string; displayName: string; passwordHash: string }) {
    const now = new Date().toISOString();
    const user = withAdminRole({
      id: randomUUID(),
      email: input.email.toLowerCase(),
      displayName: input.displayName,
      passwordHash: input.passwordHash
    });

    db.prepare(
      "INSERT INTO users (id, email, display_name, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(user.id, user.email, user.displayName, user.passwordHash, now, now);

    return user;
  }
};
