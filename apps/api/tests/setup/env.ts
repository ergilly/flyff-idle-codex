import path from "node:path";

process.env.JSON_DATA_DIR ??= path.resolve(__dirname, "../fixtures/json");
process.env.DATABASE_URL = ":memory:";
process.env.GAME_DATA_DATABASE_URL = ":memory:";
