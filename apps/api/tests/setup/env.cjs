const path = require("node:path");

process.env.JSON_DATA_DIR ??= path.resolve(__dirname, "../fixtures/json");
