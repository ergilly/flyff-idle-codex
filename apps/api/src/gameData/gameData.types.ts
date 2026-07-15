export const dataSetNames = [
  "items",
  "jobs",
  "mapMonsters",
  "monsters",
  "sets",
  "skills",
  "upgrades"
] as const;

export type DataSetName = (typeof dataSetNames)[number];
export type JsonDataRecord = Record<string, unknown>;
