import path from "node:path";
import { resolveDatabasePath } from "../../src/data/database.js";

describe("database path resolution", () => {
  it("resolves relative file URLs from the API package root", () => {
    const expectedApiRoot = process.cwd().endsWith(path.join("apps", "api"))
      ? process.cwd()
      : path.resolve(process.cwd(), "apps", "api");

    expect(resolveDatabasePath("file:./dev.db")).toBe(path.resolve(expectedApiRoot, "dev.db"));
  });

  it("keeps absolute file URLs and non-file database URLs unchanged", () => {
    const absolutePath = path.resolve(process.cwd(), "custom.db");

    expect(resolveDatabasePath(`file:${absolutePath}`)).toBe(absolutePath);
    expect(resolveDatabasePath(":memory:")).toBe(":memory:");
  });
});
