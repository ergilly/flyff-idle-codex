import { expectVersion, isRecord, loadAuthoredContent } from "../content/authoredContent.js";

type FlyingItemProgression = { tier: number; description: string };

const flyingItemProgressionById = loadAuthoredContent(
  "progression/flying-items.json",
  (value, filePath): Record<string, FlyingItemProgression> => {
    const document = expectVersion(value, filePath);

    if (!isRecord(document.items)) {
      throw new Error(`Invalid authored content at ${filePath}: items must be an object`);
    }

    const entries = Object.entries(document.items);
    if (
      entries.some(
        ([, item]) => !isRecord(item) || typeof item.tier !== "number" || typeof item.description !== "string"
      )
    ) {
      throw new Error(`Invalid authored content at ${filePath}: flying item entries are invalid`);
    }

    return Object.fromEntries(entries) as Record<string, FlyingItemProgression>;
  }
);

export function getFlyingItemTier(itemId: string | null) {
  return itemId ? (flyingItemProgressionById[itemId]?.tier ?? 0) : 0;
}

export function addFlyingItemProgressionDescription(itemId: string, description: string | null) {
  const freeTravelDescription = flyingItemProgressionById[itemId]?.description;

  if (!freeTravelDescription) {
    return description;
  }

  return description ? `${description} ${freeTravelDescription}` : freeTravelDescription;
}
