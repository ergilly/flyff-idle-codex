import { fetchDataSet } from "@/lib/api/gameData";
import { apiBaseUrl } from "@/lib/api/config";
import type { Character } from "@/lib/api/types";
import { normalizeQuestItemRequirements } from "@/lib/questItemRequirements";

export type QuestOfficeQuest = {
  beginNPC?: number;
  description?: string;
  descriptionComplete?: string;
  dialogsAccept?: string[];
  dialogsBegin?: string[];
  dialogsComplete?: string[];
  dialogsDecline?: string[];
  dialogsFail?: string[];
  endNPC?: number;
  endNeededItems?: Array<{ count: number; item: number }>;
  endReceiveExperience?: number[];
  endReceiveGold?: number;
  id: number;
  maxLevel: number;
  minLevel: number;
  name: string;
  repeatable: boolean;
  type: string;
};

export type ActiveQuest = {
  description?: string;
  giverName?: string;
  handInName?: string;
  id: number;
  instructions: string[];
  experiencePercentages?: number[];
  maxLevel: number;
  minLevel: number;
  name: string;
  objectives: ActiveQuestObjective[];
  repeatable: boolean;
  rewards: string[];
  type: string;
};

export type ActiveQuestObjective =
  | { itemId: string; kind: "item"; label: string; requiredCount: number }
  | { kind: "other"; label: string };

type QuestItemEntry = { count: number; item: number };
type QuestMonsterEntry = { count: number; monster: number[] };
type ActiveQuestRecord = QuestOfficeQuest & {
  endKillMonsters?: QuestMonsterEntry[];
  endNeededItems?: QuestItemEntry[];
  endReceiveExperience?: number[];
  endReceiveInventorySpaces?: number;
  endReceiveItems?: QuestItemEntry[];
  endReceiveSkillPoints?: number;
  endTalkNPC?: number;
  endVisitPlace?: unknown;
};

type NamedRecord = { id: number; name: string };

const questOfficeFields =
  "id,name,type,repeatable,minLevel,maxLevel,description,descriptionComplete,dialogsBegin,dialogsAccept,dialogsDecline,dialogsComplete,dialogsFail,endNeededItems,endReceiveGold,endReceiveExperience,beginNPC,endNPC";

const activeQuestFields =
  "id,name,type,repeatable,minLevel,maxLevel,description,dialogsAccept,beginNPC,endNPC,endNeededItems,endKillMonsters,endTalkNPC,endVisitPlace,endReceiveGold,endReceiveExperience,endReceiveItems,endReceiveSkillPoints,endReceiveInventorySpaces";

export async function fetchQuestOfficeQuests(npcId: number): Promise<QuestOfficeQuest[]> {
  if (!Number.isInteger(npcId) || npcId <= 0) {
    return [];
  }

  const [startingQuests, endingQuests] = await Promise.all([
    fetchDataSet<QuestOfficeQuest>("quests", {
      beginNPC: npcId,
      fields: questOfficeFields,
      limit: 500
    }),
    fetchDataSet<QuestOfficeQuest>("quests", {
      endNPC: npcId,
      fields: questOfficeFields,
      limit: 500
    })
  ]);

  return Array.from(
    new Map([...startingQuests, ...endingQuests].map((quest) => [quest.id, quest])).values()
  ).sort((first, second) => first.minLevel - second.minLevel || first.name.localeCompare(second.name));
}

export async function fetchActiveQuests(activeQuestIds: number[]): Promise<ActiveQuest[]> {
  const questIds = Array.from(
    new Set(activeQuestIds.filter((questId) => Number.isInteger(questId) && questId > 0))
  );

  if (questIds.length === 0) return [];

  const quests = await fetchDataSet<ActiveQuestRecord>("quests", {
    ids: questIds.join(","),
    fields: activeQuestFields,
    limit: questIds.length
  });
  const itemIds = getReferencedIds(quests, (quest) => [
    ...normalizeQuestItemRequirements(quest.endNeededItems).map((entry) => entry.item),
    ...(quest.endReceiveItems?.map((entry) => entry.item) ?? [])
  ]);
  const monsterIds = getReferencedIds(
    quests,
    (quest) => quest.endKillMonsters?.flatMap((entry) => entry.monster) ?? []
  );
  const npcIds = getReferencedIds(quests, (quest) => [quest.beginNPC, quest.endNPC, quest.endTalkNPC]);
  const [items, monsters, npcs] = await Promise.all([
    fetchNamedRecords("items", itemIds),
    fetchNamedRecords("monsters", monsterIds),
    fetchNamedRecords("npcs", npcIds)
  ]);
  const itemNames = toNameMap(items);
  const monsterNames = toNameMap(monsters);
  const npcNames = toNameMap(npcs);

  return quests.map((quest) => ({
    description: quest.description,
    giverName: getName(npcNames, quest.beginNPC, "NPC"),
    handInName: getName(npcNames, quest.endNPC, "NPC"),
    id: quest.id,
    instructions: quest.dialogsAccept?.filter(Boolean) ?? [],
    experiencePercentages: quest.endReceiveExperience,
    maxLevel: quest.maxLevel,
    minLevel: quest.minLevel,
    name: quest.name,
    objectives: getQuestObjectives(quest, itemNames, monsterNames, npcNames),
    repeatable: quest.repeatable,
    rewards: getQuestRewards(quest, itemNames),
    type: quest.type
  }));
}

export async function acceptCharacterQuest(
  token: string,
  characterId: string,
  questId: number,
  npcId: number
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/characters/${characterId}/quests`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ questId, npcId })
  });
  const data = (await response.json().catch(() => null)) as { character?: Character; error?: string } | null;

  if (!response.ok || !data?.character) {
    throw new Error(data?.error ?? "Unable to accept quest");
  }

  return data.character;
}

export async function abandonCharacterQuest(
  token: string,
  characterId: string,
  questId: number
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/characters/${characterId}/quests/${questId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = (await response.json().catch(() => null)) as { character?: Character; error?: string } | null;

  if (!response.ok || !data?.character) {
    throw new Error(data?.error ?? "Unable to abandon quest");
  }

  return data.character;
}

export async function completeCharacterQuest(
  token: string,
  characterId: string,
  questId: number,
  npcId: number
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/characters/${characterId}/quests/${questId}/complete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ npcId })
  });
  const data = (await response.json().catch(() => null)) as { character?: Character; error?: string } | null;

  if (!response.ok || !data?.character) {
    throw new Error(data?.error ?? "Unable to complete quest");
  }

  return data.character;
}

function getReferencedIds(
  quests: ActiveQuestRecord[],
  getIds: (quest: ActiveQuestRecord) => Array<number | undefined>
) {
  return Array.from(
    new Set(quests.flatMap(getIds).filter((id): id is number => Number.isInteger(id) && Number(id) > 0))
  );
}

function fetchNamedRecords(dataSet: "items" | "monsters" | "npcs", ids: number[]) {
  return ids.length
    ? fetchDataSet<NamedRecord>(dataSet, { ids: ids.join(","), fields: "id,name", limit: ids.length })
    : Promise.resolve([]);
}

function toNameMap(records: NamedRecord[]) {
  return new Map(records.map((record) => [record.id, record.name]));
}

function getName(names: Map<number, string>, id: number | undefined, fallback: string) {
  return id === undefined ? undefined : (names.get(id) ?? `${fallback} #${id}`);
}

function getQuestObjectives(
  quest: ActiveQuestRecord,
  itemNames: Map<number, string>,
  monsterNames: Map<number, string>,
  npcNames: Map<number, string>
) {
  const itemObjectives = normalizeQuestItemRequirements(quest.endNeededItems).map(
    ({ count, item }): ActiveQuestObjective => ({
      itemId: String(item),
      kind: "item",
      label: `Collect ${count.toLocaleString()} x ${getName(itemNames, item, "Item")}`,
      requiredCount: count
    })
  );
  const monsterObjectives =
    quest.endKillMonsters?.map(({ count, monster }): ActiveQuestObjective => {
      const names = monster.map((id) => getName(monsterNames, id, "Monster")).join(" or ");
      return { kind: "other", label: `Defeat ${count.toLocaleString()} x ${names}` };
    }) ?? [];
  const talkObjectives: ActiveQuestObjective[] = quest.endTalkNPC
    ? [{ kind: "other", label: `Talk to ${getName(npcNames, quest.endTalkNPC, "NPC")}` }]
    : [];
  const visitObjectives: ActiveQuestObjective[] = quest.endVisitPlace
    ? [{ kind: "other", label: "Visit the required quest location" }]
    : [];

  return [...itemObjectives, ...monsterObjectives, ...talkObjectives, ...visitObjectives];
}

function getQuestRewards(quest: ActiveQuestRecord, itemNames: Map<number, string>) {
  const rewards: string[] = [];

  if (quest.endReceiveGold) rewards.push(`${quest.endReceiveGold.toLocaleString()} Penya`);
  quest.endReceiveItems?.forEach(({ count, item }) => {
    rewards.push(`${count.toLocaleString()} x ${getName(itemNames, item, "Item")}`);
  });
  if (quest.endReceiveSkillPoints) {
    rewards.push(`${quest.endReceiveSkillPoints.toLocaleString()} skill points`);
  }
  if (quest.endReceiveInventorySpaces) {
    rewards.push(`${quest.endReceiveInventorySpaces.toLocaleString()} inventory spaces`);
  }

  return rewards;
}
