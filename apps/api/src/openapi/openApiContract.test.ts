import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { createApp } from "../app.js";

type OpenApiOperation = { operationId?: string; responses?: Record<string, unknown> };
type OpenApiPathItem = Partial<Record<"delete" | "get" | "patch" | "post" | "put", OpenApiOperation>>;
type OpenApiSchema = { properties?: Record<string, unknown>; required?: string[] };
type OpenApiDocument = {
  openapi: string;
  paths: Record<string, OpenApiPathItem>;
  components: { schemas: Record<string, OpenApiSchema> };
};

type ExpressLayer = {
  handle?: { stack?: ExpressLayer[] };
  regexp?: RegExp;
  route?: { methods: Record<string, boolean>; path: string };
};

type ExpressAppWithRouter = {
  _router?: { stack?: ExpressLayer[] };
};

function loadOpenApiDocument() {
  const specPath = path.resolve(process.cwd(), "../../docs/api/openapi.yaml");
  return YAML.parse(fs.readFileSync(specPath, "utf8")) as OpenApiDocument;
}

function getRouterMountPath(regexp?: RegExp) {
  const source = regexp?.source ?? "";
  const prefix = "^\\/";
  const suffix = "\\/?(?=\\/|$)";

  if (!source.startsWith(prefix) || !source.endsWith(suffix)) return "";

  const encodedPath = source.slice(prefix.length, -suffix.length);
  return encodedPath ? `/${encodedPath.replaceAll("\\/", "/")}` : "";
}

function collectExpressOperations(stack: ExpressLayer[], prefix = ""): string[] {
  return stack.flatMap((layer) => {
    if (layer.route) {
      const expressPath = layer.route.path === "/" ? prefix : `${prefix}${layer.route.path}`;
      const openApiPath = (expressPath || "/").replace(/:([A-Za-z0-9_]+)/g, "{$1}");
      return Object.entries(layer.route.methods)
        .filter(([, enabled]) => enabled)
        .map(([method]) => `${method.toUpperCase()} ${openApiPath}`);
    }

    const childStack = layer.handle?.stack;
    return childStack
      ? collectExpressOperations(childStack, `${prefix}${getRouterMountPath(layer.regexp)}`)
      : [];
  });
}

describe("OpenAPI contract", () => {
  const document = loadOpenApiDocument();

  it("documents every implemented API operation", () => {
    const app = createApp() as unknown as ExpressAppWithRouter;
    const implementedOperations = collectExpressOperations(app._router?.stack ?? []).sort();
    const documentedOperations = Object.entries(document.paths)
      .flatMap(([routePath, pathItem]) =>
        Object.keys(pathItem).map((method) => `${method.toUpperCase()} ${routePath}`)
      )
      .sort();

    expect(documentedOperations).toEqual(implementedOperations);
  });

  it("documents the complete public character representation", () => {
    const characterSchema = document.components.schemas.Character;
    const battleStateSchema = document.components.schemas.BattleProgressionStateRequest;

    expect(characterSchema.required).toEqual(
      expect.arrayContaining([
        "location",
        "consumableLoadout",
        "equipmentSets",
        "ammoQuantity",
        "ammoQuantities"
      ])
    );
    expect(Object.keys(characterSchema.properties ?? {})).toEqual(
      expect.arrayContaining([
        "location",
        "consumableLoadout",
        "equipmentSets",
        "ammoQuantity",
        "ammoQuantities"
      ])
    );
    expect(Object.keys(battleStateSchema.properties ?? {})).toEqual(
      expect.arrayContaining(["exp", "level", "penya"])
    );
  });

  it("gives every operation a stable unique identifier", () => {
    const operations = Object.values(document.paths).flatMap((pathItem) => Object.values(pathItem));
    const operationIds = operations.map((operation) => operation?.operationId);

    expect(operationIds.every(Boolean)).toBe(true);
    expect(new Set(operationIds).size).toBe(operationIds.length);
  });
});
