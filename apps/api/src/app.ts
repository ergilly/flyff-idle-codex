import fs from "node:fs";
import path from "node:path";
import cors from "cors";
import express from "express";
import YAML from "yaml";
import { adminRouter } from "./admin/admin.routes.js";
import { authRouter } from "./auth/auth.routes.js";
import { characterRouter } from "./characters/character.routes.js";
import { gameDataRouter } from "./gameData/gameData.routes.js";
import { imageRouter } from "./images/image.routes.js";
import { itemRouter } from "./items/item.routes.js";
import { shopRouter } from "./shops/shop.routes.js";
import { travelRouter } from "./travel/travel.routes.js";

const openApiPath = path.resolve(process.cwd(), "../../docs/api/openapi.yaml");
const openApiDocument = YAML.parse(fs.readFileSync(openApiPath, "utf8"));
const serializedOpenApiDocument = JSON.stringify(openApiDocument).replace(/</g, "\\u003c");
const swaggerHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Flyff Idle API Swagger</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.addEventListener("load", () => {
        window.ui = SwaggerUIBundle({
          spec: ${serializedOpenApiDocument},
          dom_id: "#swagger-ui"
        });
      });
    </script>
  </body>
</html>`;

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
  app.use("/api/characters", travelRouter);
  app.use("/api/data", gameDataRouter);
  app.use("/api/images", imageRouter);
  app.use("/api/items", itemRouter);
  app.use("/api/shops", shopRouter);
  app.get("/swagger", (_request, response) => {
    response.type("html").send(swaggerHtml);
  });

  return app;
}
