import fs from "node:fs";
import path from "node:path";

type ContentParser<T> = (value: unknown, filePath: string) => T;

export function resolveAuthoredContentPath(relativePath: string) {
  const candidates = [
    path.resolve(process.cwd(), "content", "authored", relativePath),
    path.resolve(process.cwd(), "..", "..", "content", "authored", relativePath)
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
}

export function loadAuthoredContent<T>(relativePath: string, parse: ContentParser<T>) {
  const filePath = resolveAuthoredContentPath(relativePath);
  let source: string;

  try {
    source = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    throw new Error(`Unable to read authored content at ${filePath}`, { cause: error });
  }

  let value: unknown;

  try {
    value = JSON.parse(source) as unknown;
  } catch (error) {
    throw new Error(`Invalid JSON in authored content at ${filePath}`, { cause: error });
  }

  return parse(value, filePath);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function expectVersion(value: unknown, filePath: string): Record<string, unknown> {
  if (!isRecord(value) || value.version !== 1) {
    throw new Error(`Invalid authored content at ${filePath}: expected version 1`);
  }

  return value;
}
