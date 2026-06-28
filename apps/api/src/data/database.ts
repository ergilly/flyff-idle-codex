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

export function resolveDatabasePath(databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db") {
  if (!databaseUrl.startsWith("file:")) {
    return databaseUrl;
  }

  const filePath = databaseUrl.slice("file:".length);

  return path.isAbsolute(filePath) ? filePath : path.resolve(getApiRoot(), filePath);
}

export const db = new DatabaseSync(resolveDatabasePath());
db.exec("PRAGMA foreign_keys = ON");

export function closeDatabase() {
  db.close();
}
