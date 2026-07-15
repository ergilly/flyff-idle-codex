import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

function getApiRoot() {
  const packageJsonPath = process.env.npm_package_json;

  if (packageJsonPath && path.basename(path.dirname(packageJsonPath)) === "api") {
    return path.dirname(packageJsonPath);
  }

  const cwd = process.cwd();

  if (fs.existsSync(path.join(cwd, "src", "server.ts"))) {
    return cwd;
  }

  const workspaceApiRoot = path.join(cwd, "apps", "api");

  if (fs.existsSync(path.join(workspaceApiRoot, "src", "server.ts"))) {
    return workspaceApiRoot;
  }

  return cwd;
}

export function resolveDatabasePath(databaseUrl?: string) {
  const effectiveDatabaseUrl =
    databaseUrl ??
    process.env.DATABASE_URL ??
    (process.env.NODE_ENV === "test" ? "file:./test.db" : "file:./dev.db");

  if (!effectiveDatabaseUrl.startsWith("file:")) {
    return effectiveDatabaseUrl;
  }

  const filePath = effectiveDatabaseUrl.slice("file:".length);

  return path.isAbsolute(filePath) ? filePath : path.resolve(getApiRoot(), filePath);
}

const databasePath = resolveDatabasePath();

if (databasePath !== ":memory:") {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
}

export const db = new DatabaseSync(databasePath);
db.exec("PRAGMA foreign_keys = ON");
db.exec("PRAGMA busy_timeout = 5000");

if (databasePath !== ":memory:") {
  db.exec("PRAGMA journal_mode = WAL");
}

export function closeDatabase() {
  db.close();
}
