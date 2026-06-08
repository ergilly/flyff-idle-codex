import fs from "node:fs";
import path from "node:path";
import cors from "cors";
import express from "express";
import YAML from "yaml";
import { adminRouter } from "./admin/admin.routes.js";
import { authRouter } from "./auth/auth.routes.js";
import { characterRouter } from "./characters/character.routes.js";
import { gameDataRouter } from "./gameData/gameData.routes.js";
import { itemRouter } from "./items/item.routes.js";

const openApiPath = path.resolve(process.cwd(), "../../docs/api/openapi.yaml");
const openApiDocument = YAML.parse(fs.readFileSync(openApiPath, "utf8"));

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/characters", characterRouter);
  app.use("/api/data", gameDataRouter);
  app.use("/api/items", itemRouter);
  app.get("/docs/openapi.yaml", (_request, response) => {
    response.type("text/yaml").send(fs.readFileSync(openApiPath, "utf8"));
  });
  app.get("/docs/openapi.json", (_request, response) => {
    response.json(openApiDocument);
  });

  return app;
}
