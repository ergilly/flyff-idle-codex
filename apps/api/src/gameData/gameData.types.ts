export const dataSetNames = [
  "items",
  "jobs",
  "mapMonsters",
  "monsters",
  "npcs",
  "quests",
  "sets",
  "skills",
  "upgrades"
] as const;

export type DataSetName = (typeof dataSetNames)[number];
export type JsonDataRecord = Record<string, unknown>;
