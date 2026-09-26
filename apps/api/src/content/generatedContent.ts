import fs from "node:fs";
import path from "node:path";
import { type ItemMetadata } from "../items/itemTypes.js";

function resolveGeneratedPath(fileName: string) {
  const candidates = [
    path.resolve(process.cwd(), "content", "generated", fileName),
    path.resolve(process.cwd(), "..", "..", "content", "generated", fileName)
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
}

function readGeneratedJson(fileName: string) {
  const filePath = resolveGeneratedPath(fileName);
  let value: unknown;

  try {
    value = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
  } catch (error) {
    throw new Error(`Unable to read generated content at ${filePath}`, { cause: error });
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid generated content at ${filePath}`);
  }

  return value as Record<string, unknown>;
}

export function loadGeneratedItemIndex(): Record<string, ItemMetadata> {
  const document = readGeneratedJson("item-icon-index.json");

  if (document.version !== 1 || !document.items || typeof document.items !== "object") {
    throw new Error("Invalid generated item icon index: expected version 1 and an items object");
  }

  return document.items as Record<string, ItemMetadata>;
}
