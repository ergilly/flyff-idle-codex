import "dotenv/config";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

function getDatabasePath() {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

  if (databaseUrl.startsWith("file:")) {
    const filePath = databaseUrl.slice("file:".length);
    return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  }

  return databaseUrl;
}

export const db = new DatabaseSync(getDatabasePath());
db.exec("PRAGMA foreign_keys = ON");

export function closeDatabase() {
  db.close();
}
