import { loadStoredDataSet } from "./gameData.database.js";
import { dataSetNames, type DataSetName, type JsonDataRecord } from "./gameData.types.js";

export { dataSetNames, type DataSetName, type JsonDataRecord } from "./gameData.types.js";

type DataSet = Record<string, JsonDataRecord>;
const dataSetNameSet = new Set<string>(dataSetNames);
const dataCache = new Map<DataSetName, DataSet>();

const reservedQueryParams = new Set(["fields", "ids", "limit", "maxLevel", "minLevel", "offset", "q"]);

function isJsonDataRecord(value: unknown): value is JsonDataRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function loadDataSet(dataSetName: DataSetName) {
  const cachedDataSet = dataCache.get(dataSetName);

  if (cachedDataSet) {
    return cachedDataSet;
  }

  const dataSet = loadStoredDataSet(dataSetName);
  dataCache.set(dataSetName, dataSet);
  return dataSet;
}

function normalize(value: unknown) {
  return String(value).trim().toLowerCase();
}

function matchesQuery(item: JsonDataRecord, query: string) {
  const normalizedQuery = normalize(query);

  return ["id", "name", "description"].some((field) => {
    const value = item[field];

    return value !== undefined && value !== null && normalize(value).includes(normalizedQuery);
  });
}

function matchesScalarFilter(value: unknown, expected: string) {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "boolean") {
    return value === (expected.toLowerCase() === "true");
  }

  return normalize(value) === normalize(expected);
}

function getFieldValue(item: JsonDataRecord, field: string) {
  return field.split(".").reduce<unknown>((value, segment) => {
    if (!isJsonDataRecord(value)) {
      return undefined;
    }

    return value[segment];
  }, item);
}

function matchesRange(item: JsonDataRecord, minimumLevel?: number, maximumLevel?: number) {
  const level = item.level ?? item.upgradeLevel;

  if (typeof level !== "number") {
    return minimumLevel === undefined && maximumLevel === undefined;
  }

  return (
    (minimumLevel === undefined || level >= minimumLevel) &&
    (maximumLevel === undefined || level <= maximumLevel)
  );
}

function pickFields(item: JsonDataRecord, fields: string[]) {
  return Object.fromEntries(fields.filter((field) => field in item).map((field) => [field, item[field]]));
}

function getSingleQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getStringQueryValue(value: unknown) {
  const singleValue = getSingleQueryValue(value);

  return typeof singleValue === "string" && singleValue.trim() ? singleValue.trim() : undefined;
}

function getNumberQueryValue(value: unknown) {
  const stringValue = getStringQueryValue(value);

  if (!stringValue) {
    return undefined;
  }

  const numberValue = Number(stringValue);

  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function getStringList(value: unknown) {
  return getStringQueryValue(value)
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getClassIdForName(className: string) {
  return Object.values(loadDataSet("jobs")).find((job) => normalize(job.name) === normalize(className))?.id;
}

function matchesId(item: JsonDataRecord, id: string) {
  return matchesScalarFilter(item.id, id);
}

function findDataRecordById(dataSet: DataSet, id: string) {
  return Object.values(dataSet).find((item) => matchesId(item, id));
}

export function isDataSetName(value: string): value is DataSetName {
  return dataSetNameSet.has(value);
}

export function listDataSets() {
  return dataSetNames.map((name) => ({
    name,
    href: `/api/data/${name}`
  }));
}

export function findDataRecord(dataSetName: DataSetName, id: string) {
  return findDataRecordById(loadDataSet(dataSetName), id);
}

export function queryDataSet(dataSetName: DataSetName, query: Record<string, unknown>) {
  const dataSet = loadDataSet(dataSetName);
  const ids = getStringList(query.ids);
  const fields = getStringList(query.fields);
  const requestedLimit = getNumberQueryValue(query.limit);
  const requestedOffset = getNumberQueryValue(query.offset);
  const limit = requestedLimit && requestedLimit > 0 ? Math.min(Math.floor(requestedLimit), 500) : 100;
  const offset = requestedOffset && requestedOffset > 0 ? Math.floor(requestedOffset) : 0;
  const minimumLevel = getNumberQueryValue(query.minLevel);
  const maximumLevel = getNumberQueryValue(query.maxLevel);
  const textQuery = getStringQueryValue(query.q);
  const className = getStringQueryValue(query.class);
  const classId =
    getStringQueryValue(query.classId) ??
    (className ? String(getClassIdForName(className) ?? "") : undefined);

  const scalarFilters = Object.entries(query)
    .filter(([field]) => !reservedQueryParams.has(field) && field !== "class" && field !== "classId")
    .flatMap(([field, value]) => {
      const expected = getStringQueryValue(value);

      return expected ? [{ field, expected }] : [];
    });

  const dataSetItems = ids
    ? ids.map((id) => findDataRecordById(dataSet, id)).filter((item): item is JsonDataRecord => Boolean(item))
    : Object.values(dataSet);

  const filteredItems = dataSetItems
    .filter((item) => (textQuery ? matchesQuery(item, textQuery) : true))
    .filter((item) => matchesRange(item, minimumLevel, maximumLevel))
    .filter((item) => (dataSetName === "skills" && classId ? matchesScalarFilter(item.class, classId) : true))
    .filter((item) =>
      scalarFilters.every(({ field, expected }) => matchesScalarFilter(getFieldValue(item, field), expected))
    );

  return {
    dataSet: dataSetName,
    total: filteredItems.length,
    limit,
    offset,
    results: filteredItems
      .slice(offset, offset + limit)
      .map((item) => (fields ? pickFields(item, fields) : item))
  };
}
