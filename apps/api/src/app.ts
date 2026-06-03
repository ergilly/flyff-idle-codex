import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import YAML from "yaml";
import { authRouter } from "./auth/auth.routes.js";
import { characterRouter } from "./characters/character.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const openApiPath = path.resolve(__dirname, "../../../docs/api/openapi.yaml");
const openApiDocument = YAML.parse(fs.readFileSync(openApiPath, "utf8"));

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/characters", characterRouter);
  app.get("/docs/openapi.yaml", (_request, response) => {
    response.type("text/yaml").send(fs.readFileSync(openApiPath, "utf8"));
  });
  app.get("/docs/openapi.json", (_request, response) => {
    response.json(openApiDocument);
  });

  return app;
}
