import type { JsonDataRecord } from "./gameData.types.js";

type MonsterReference = {
  name: string;
  rank?: string;
};

export type QuestTextReferenceIndex = {
  itemDescriptions: Map<string, string>;
  itemNames: Map<string, string>;
  monsters: Map<string, MonsterReference>;
  npcNames: Map<string, string>;
};

type QuestTextReferenceData = {
  items: Record<string, JsonDataRecord>;
  monsters: Record<string, JsonDataRecord>;
  npcs: Record<string, JsonDataRecord>;
};

const questPlaceholderPattern =
  /\$(QUEST_END_(?:ITEM_(?:NAME|COUNT|MON)|KILL_(?:NAME|COUNT)|NPC_NAME))(?:,(\d+))?\$/g;

export function createQuestTextReferenceIndex({
  items,
  monsters,
  npcs
}: QuestTextReferenceData): QuestTextReferenceIndex {
  return {
    itemDescriptions: createStringFieldIndex(items, "description"),
    itemNames: createStringFieldIndex(items, "name"),
    monsters: new Map(
      Object.values(monsters).flatMap((monster) => {
        if (monster.id === undefined || typeof monster.name !== "string") return [];

        return [
          [
            String(monster.id),
            {
              name: monster.name,
              rank: typeof monster.rank === "string" ? monster.rank : undefined
            }
          ] as const
        ];
      })
    ),
    npcNames: createStringFieldIndex(npcs, "name")
  };
}

export function resolveQuestText(quest: JsonDataRecord, references: QuestTextReferenceIndex): JsonDataRecord {
  return resolveValue(quest, quest, references) as JsonDataRecord;
}

export function findQuestTextPlaceholders(value: unknown) {
  const placeholders: string[] = [];
  visitStrings(value, (text) => {
    placeholders.push(...Array.from(text.matchAll(questPlaceholderPattern), (match) => match[0]));
  });
  return placeholders;
}

function createStringFieldIndex(records: Record<string, JsonDataRecord>, field: string) {
  return new Map(
    Object.values(records).flatMap((record) => {
      if (record.id === undefined || typeof record[field] !== "string") return [];
      return [[String(record.id), record[field]] as const];
    })
  );
}

function resolveValue(value: unknown, quest: JsonDataRecord, references: QuestTextReferenceIndex): unknown {
  if (typeof value === "string") {
    return value.replace(questPlaceholderPattern, (placeholder, token: string, ordinal?: string) => {
      return resolvePlaceholder(token, ordinal, quest, references) ?? placeholder;
    });
  }

  if (Array.isArray(value)) {
    return value.map((entry) => resolveValue(entry, quest, references));
  }

  if (isJsonDataRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, resolveValue(entry, quest, references)])
    );
  }

  return value;
}

function resolvePlaceholder(
  token: string,
  ordinal: string | undefined,
  quest: JsonDataRecord,
  references: QuestTextReferenceIndex
) {
  const objectiveIndex = ordinal === undefined ? 0 : Number(ordinal) - 1;

  if (!Number.isInteger(objectiveIndex) || objectiveIndex < 0) return undefined;

  if (token === "QUEST_END_NPC_NAME") {
    return getReferenceValue(references.npcNames, quest.endNPC);
  }

  if (token === "QUEST_END_ITEM_MON") {
    const itemObjective = getObjective(quest.endNeededItems, objectiveIndex);
    const description = getReferenceValue(references.itemDescriptions, itemObjective?.item);
    return description?.match(/\bdrops from (.+?)(?:[.!])?$/i)?.[1].trim();
  }

  if (token.startsWith("QUEST_END_ITEM_")) {
    const itemObjective = getObjective(quest.endNeededItems, objectiveIndex);

    return token === "QUEST_END_ITEM_COUNT"
      ? toReplacementValue(itemObjective?.count)
      : getReferenceValue(references.itemNames, itemObjective?.item);
  }

  if (token.startsWith("QUEST_END_KILL_")) {
    const killObjective = getObjective(quest.endKillMonsters, objectiveIndex);

    if (token === "QUEST_END_KILL_COUNT") {
      return toReplacementValue(killObjective?.count);
    }

    const monsterIds = Array.isArray(killObjective?.monster)
      ? killObjective.monster
      : [killObjective?.monster];
    const monsters = monsterIds
      .map((monsterId) => getReferenceValue(references.monsters, monsterId))
      .filter((monster): monster is MonsterReference => Boolean(monster));

    return (monsters.find((monster) => monster.rank === "normal") ?? monsters[0])?.name;
  }

  return undefined;
}

function getObjective(value: unknown, index: number) {
  if (!Array.isArray(value)) return undefined;
  const objective = value[index];
  return isJsonDataRecord(objective) ? objective : undefined;
}

function getReferenceValue<T>(index: Map<string, T>, id: unknown) {
  return id === undefined || id === null ? undefined : index.get(String(id));
}

function toReplacementValue(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}

function isJsonDataRecord(value: unknown): value is JsonDataRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function visitStrings(value: unknown, visitor: (text: string) => void) {
  if (typeof value === "string") {
    visitor(value);
  } else if (Array.isArray(value)) {
    value.forEach((entry) => visitStrings(entry, visitor));
  } else if (isJsonDataRecord(value)) {
    Object.values(value).forEach((entry) => visitStrings(entry, visitor));
  }
}
