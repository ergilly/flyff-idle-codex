import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { dataSetNames, type DataSetName, type JsonDataRecord } from "./gameData.types.js";

type StoredGameDataRecord = {
  payload: string;
  recordKey: string;
};

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

  return fs.existsSync(workspaceApiRoot) ? workspaceApiRoot : cwd;
}

export function resolveGameDataDatabasePath(databaseUrl?: string) {
  const configuredPath = databaseUrl ?? process.env.GAME_DATA_DATABASE_URL ?? "file:./data/game-data.db";

  if (!configuredPath.startsWith("file:")) {
    return configuredPath;
  }

  const filePath = configuredPath.slice("file:".length);
  return path.isAbsolute(filePath) ? filePath : path.resolve(getApiRoot(), filePath);
}

function isJsonDataRecord(value: unknown): value is JsonDataRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function populateGameDataDatabase(database: DatabaseSync, jsonDataDirectory: string) {
  database.exec(`
    CREATE TABLE game_data_records (
      data_set TEXT NOT NULL,
      record_key TEXT NOT NULL,
      record_id TEXT,
      record_order INTEGER NOT NULL,
      payload TEXT NOT NULL,
      PRIMARY KEY (data_set, record_key)
    ) WITHOUT ROWID;

    CREATE INDEX game_data_records_id_idx
      ON game_data_records (data_set, record_id);
  `);

  const insertRecord = database.prepare(`
    INSERT INTO game_data_records (data_set, record_key, record_id, record_order, payload)
    VALUES (?, ?, ?, ?, ?)
  `);

  database.exec("BEGIN IMMEDIATE");

  try {
    for (const dataSetName of dataSetNames) {
      const dataPath = path.join(jsonDataDirectory, `${dataSetName}.json`);
      const source = JSON.parse(fs.readFileSync(dataPath, "utf8")) as unknown;

      if (!isJsonDataRecord(source)) {
        throw new Error(`Invalid JSON data set: ${dataSetName}`);
      }

      let recordOrder = 0;

      for (const [recordKey, value] of Object.entries(source)) {
        if (!isJsonDataRecord(value)) {
          continue;
        }

        const recordId = value.id === undefined || value.id === null ? null : String(value.id);
        insertRecord.run(dataSetName, recordKey, recordId, recordOrder, JSON.stringify(value));
        recordOrder += 1;
      }
    }

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function openGameDataDatabase() {
  const databasePath = resolveGameDataDatabasePath();

  if (databasePath === ":memory:") {
    const database = new DatabaseSync(databasePath);
    const jsonDataDirectory = process.env.JSON_DATA_DIR;

    if (!jsonDataDirectory) {
      throw new Error("JSON_DATA_DIR is required when GAME_DATA_DATABASE_URL is :memory:");
    }

    populateGameDataDatabase(database, jsonDataDirectory);
    return database;
  }

  if (!fs.existsSync(databasePath)) {
    throw new Error(
      `Game data database not found at ${databasePath}. Run npm run game-data:build -w @flyff-idle/api.`
    );
  }

  return new DatabaseSync(databasePath, { readOnly: true });
}

let gameDataDatabase: DatabaseSync | undefined;

function getGameDataDatabase() {
  gameDataDatabase ??= openGameDataDatabase();
  return gameDataDatabase;
}

export function loadStoredDataSet(dataSetName: DataSetName) {
  const rows = getGameDataDatabase()
    .prepare(
      "SELECT record_key AS recordKey, payload FROM game_data_records WHERE data_set = ? ORDER BY record_order"
    )
    .all(dataSetName) as StoredGameDataRecord[];

  return Object.fromEntries(
    rows.map(({ payload, recordKey }) => [recordKey, JSON.parse(payload) as JsonDataRecord])
  );
}
