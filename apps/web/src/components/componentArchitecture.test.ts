import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const componentsRoot = join(process.cwd(), "src", "components");
const layerRanks = {
  atoms: 0,
  molecules: 1,
  organisms: 2,
  templates: 3,
  pages: 4
} as const;

type ComponentLayer = keyof typeof layerRanks;

function getSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return getSourceFiles(path);
    }

    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

function getLayer(path: string): ComponentLayer | undefined {
  return (Object.keys(layerRanks) as ComponentLayer[]).find((layer) =>
    path.includes(`${join("components", layer)}${process.platform === "win32" ? "\\" : "/"}`)
  );
}

describe("component architecture", () => {
  it("does not allow lower atomic layers to depend on higher layers", () => {
    const violations = getSourceFiles(componentsRoot).flatMap((path) => {
      const sourceLayer = getLayer(path);

      if (!sourceLayer) return [];

      const imports = readFileSync(path, "utf8").matchAll(
        /@\/components\/(atoms|molecules|organisms|templates|pages)\//g
      );

      return [...imports]
        .map((match) => match[1] as ComponentLayer)
        .filter((targetLayer) => layerRanks[targetLayer] > layerRanks[sourceLayer])
        .map((targetLayer) => `${relative(componentsRoot, path)} (${sourceLayer}) imports ${targetLayer}`);
    });

    expect(violations).toEqual([]);
  });
});
