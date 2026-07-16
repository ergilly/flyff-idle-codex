import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { populateGameDataDatabase, resolveGameDataDatabasePath } from "../gameData/gameData.database.js";

function findJsonDataDirectory() {
  if (process.env.JSON_DATA_DIR) {
    return path.resolve(process.env.JSON_DATA_DIR);
  }

  const candidates = [
    path.resolve(process.cwd(), "docs/json"),
    path.resolve(process.cwd(), "../../docs/json")
  ];
  const directory = candidates.find((candidate) => fs.existsSync(candidate));

  if (!directory) {
    throw new Error("docs/json was not found. Set JSON_DATA_DIR to the source data directory.");
  }

  return directory;
}

const databasePath = resolveGameDataDatabasePath();

if (databasePath === ":memory:") {
  throw new Error("GAME_DATA_DATABASE_URL must point to a file when building game data");
}

fs.mkdirSync(path.dirname(databasePath), { recursive: true });
fs.rmSync(databasePath, { force: true });

const database = new DatabaseSync(databasePath);

try {
  populateGameDataDatabase(database, findJsonDataDirectory());
} finally {
  database.close();
}

console.log(`Built game data database at ${databasePath}`);
