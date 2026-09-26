import { z } from "zod";
import { loadAuthoredContent } from "./authoredContent.js";
import type { JsonDataRecord } from "../gameData/gameData.types.js";

const questNavigationSchema = z
  .object({
    regionId: z.string().min(1),
    townMapId: z.string().min(1).optional(),
    locationId: z.string().min(1).optional()
  })
  .strict();

const questEntrySchema = z
  .object({
    enabled: z.boolean().optional(),
    display: z
      .object({
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional()
      })
      .strict()
      .optional(),
    navigation: questNavigationSchema.optional()
  })
  .strict();

const questCatalogSchema = z
  .object({
    version: z.literal(1),
    quests: z.record(z.string().regex(/^\d+$/), questEntrySchema)
  })
  .strict();

type QuestEntry = z.infer<typeof questEntrySchema>;

const questCatalog = loadAuthoredContent("quests/catalog.json", (value, filePath) => {
  const parsed = questCatalogSchema.safeParse(value);

  if (!parsed.success) {
    throw new Error(
      `Invalid authored quest content at ${filePath}: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "document"}: ${issue.message}`)
        .join("; ")}`
    );
  }

  return parsed.data.quests;
});

export function getQuestContent(questId: string | number) {
  return questCatalog[String(questId)];
}

export function applyQuestContent(quest: JsonDataRecord): JsonDataRecord | undefined {
  const entry = getQuestContent(String(quest.id));

  if (!entry || entry.enabled !== false) {
    return entry ? applyDisplayOverrides(quest, entry) : quest;
  }

  return undefined;
}

function applyDisplayOverrides(quest: JsonDataRecord, entry: QuestEntry) {
  if (!entry.display) {
    return quest;
  }

  return {
    ...quest,
    ...(entry.display.name ? { name: entry.display.name } : {}),
    ...(entry.display.description ? { description: entry.display.description } : {})
  };
}
