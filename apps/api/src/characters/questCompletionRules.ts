import type { Character } from "../types.js";
import type { JsonDataRecord } from "../gameData/gameData.service.js";

export type QuestItemRequirement = { itemId: string; quantity: number };

export type QuestCompletionPlan = {
  experiencePercentages: number[];
  penya: number;
  requiredItems: QuestItemRequirement[];
  removeItems: QuestItemRequirement[];
};

export type QuestCompletionCheck =
  | { plan: QuestCompletionPlan; status: "ready" }
  | { error: string; status: "incomplete" | "unsupported" };

const unsupportedObjectiveFields = ["endKillMonsters", "endTalkNPC", "endVisitPlace", "endTimeLimit"];
const unsupportedRewardFields = [
  "endReceiveItems",
  "endReceiveSkillPoints",
  "endReceiveInventorySpaces",
  "endReceiveKarma",
  "endReceiveCoupleExperience"
];

export function getQuestCompletionCheck(
  character: Pick<Character, "inventory">,
  quest: JsonDataRecord,
  npcId: number
): QuestCompletionCheck {
  if (quest.endNPC !== npcId) {
    return { status: "incomplete", error: "This NPC does not complete that quest" };
  }

  if (unsupportedObjectiveFields.some((field) => hasQuestValue(quest[field]))) {
    return { status: "unsupported", error: "This quest objective type is not supported yet" };
  }
  if (unsupportedRewardFields.some((field) => hasQuestValue(quest[field]))) {
    return { status: "unsupported", error: "This quest reward type is not supported yet" };
  }

  const neededItems = readItemRequirements(quest.endNeededItems);
  const removeItems = readItemRequirements(quest.endRemoveItems);

  if (neededItems.length === 0) {
    return { status: "unsupported", error: "Only item-collection quests can be completed currently" };
  }

  const inventoryQuantityByItemId = character.inventory.items.reduce<Map<string, number>>(
    (quantities, item) => {
      quantities.set(item.itemId, (quantities.get(item.itemId) ?? 0) + item.quantity);
      return quantities;
    },
    new Map()
  );
  const missingItem = neededItems.find(
    ({ itemId, quantity }) => (inventoryQuantityByItemId.get(itemId) ?? 0) < quantity
  );

  if (missingItem) {
    return { status: "incomplete", error: "Required quest items have not been collected" };
  }

  return {
    status: "ready",
    plan: {
      experiencePercentages: readNumberArray(quest.endReceiveExperience),
      penya: readNonNegativeNumber(quest.endReceiveGold),
      requiredItems: neededItems,
      removeItems
    }
  };
}

function readItemRequirements(value: unknown): QuestItemRequirement[] {
  if (!Array.isArray(value)) return [];

  const requirements = value.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const itemId = entry.item;
    const quantity = entry.count;
    return (typeof itemId === "number" || typeof itemId === "string") &&
      typeof quantity === "number" &&
      quantity > 0
      ? [{ itemId: String(itemId), quantity: Math.floor(quantity) }]
      : [];
  });
  const quantityByItemId = requirements.reduce<Map<string, number>>((quantities, requirement) => {
    quantities.set(
      requirement.itemId,
      Math.max(quantities.get(requirement.itemId) ?? 0, requirement.quantity)
    );
    return quantities;
  }, new Map());

  return Array.from(quantityByItemId, ([itemId, quantity]) => ({ itemId, quantity }));
}

function readNumberArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((entry) => (typeof entry === "number" && Number.isFinite(entry) ? entry : 0))
    : [];
}

function readNonNegativeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function hasQuestValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
