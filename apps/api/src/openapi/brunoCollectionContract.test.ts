import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const HTTP_METHODS = ["delete", "get", "patch", "post", "put"] as const;

type OpenApiDocument = {
  paths: Record<string, Partial<Record<(typeof HTTP_METHODS)[number], unknown>>>;
};

type BrunoRequest = {
  http?: { method?: string; url?: string };
  runtime?: { scripts?: Array<{ code?: string; type?: string }> };
};

function findYamlFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? findYamlFiles(entryPath) : entry.name.endsWith(".yml") ? [entryPath] : [];
  });
}

function operationKey(method: string, apiPath: string) {
  return `${method.toUpperCase()} ${apiPath}`;
}

function normalizeBrunoUrl(url: string) {
  return url
    .replace("{{baseUrl}}", "")
    .split("?", 1)[0]
    .replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

describe("Bruno collection contract", () => {
  const repositoryRoot = path.resolve(process.cwd(), "../..");
  const collectionRoot = path.join(repositoryRoot, "bruno", "Flyff Idle API");
  const openApi = YAML.parse(
    fs.readFileSync(path.join(repositoryRoot, "docs", "api", "openapi.yaml"), "utf8")
  ) as OpenApiDocument;
  const requestFiles = findYamlFiles(collectionRoot).filter((file) => {
    const basename = path.basename(file);
    return basename !== "folder.yml" && basename !== "opencollection.yml" && !file.includes("environments");
  });
  const requests = requestFiles.map((file) => ({
    file,
    request: YAML.parse(fs.readFileSync(file, "utf8")) as BrunoRequest
  }));

  it("contains exactly one request for every documented operation", () => {
    const documentedOperations = Object.entries(openApi.paths).flatMap(([apiPath, pathItem]) =>
      HTTP_METHODS.filter((method) => pathItem[method]).map((method) => operationKey(method, apiPath))
    );
    const collectionOperations = requests.map(({ request }) =>
      operationKey(request.http?.method ?? "", normalizeBrunoUrl(request.http?.url ?? ""))
    );

    expect(collectionOperations.sort()).toEqual(documentedOperations.sort());
    expect(new Set(collectionOperations).size).toBe(collectionOperations.length);
  });

  it("has executable response assertions for every request", () => {
    const requestsWithoutTests = requests
      .filter(
        ({ request }) =>
          !request.runtime?.scripts?.some(
            (script) => script.type === "tests" && script.code?.includes("expect(")
          )
      )
      .map(({ file }) => path.relative(collectionRoot, file));

    expect(requestsWithoutTests).toEqual([]);
  });
});
