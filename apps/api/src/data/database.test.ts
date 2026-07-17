import path from "node:path";
import { resolveDatabasePath } from "./database.js";

describe("database path resolution", () => {
  const expectedApiRoot = process.cwd().endsWith(path.join("apps", "api"))
    ? process.cwd()
    : path.resolve(process.cwd(), "apps", "api");

  it("resolves relative file URLs from the API package root", () => {
    expect(resolveDatabasePath("file:./dev.db")).toBe(path.resolve(expectedApiRoot, "dev.db"));
  });

  it("honors the in-memory database configured by the test environment", () => {
    expect(resolveDatabasePath()).toBe(":memory:");
  });

  it("keeps absolute file URLs and non-file database URLs unchanged", () => {
    const absolutePath = path.resolve(process.cwd(), "custom.db");

    expect(resolveDatabasePath(`file:${absolutePath}`)).toBe(absolutePath);
    expect(resolveDatabasePath(":memory:")).toBe(":memory:");
  });
});
