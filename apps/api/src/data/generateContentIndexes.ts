import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const repositoryRoot = path.resolve(process.cwd(), "../..");
const sourceDirectory = path.join(repositoryRoot, "content", "source", "game-data");
const generatedDirectory = path.join(repositoryRoot, "content", "generated");

function readJson(fileName: string): Record<string, JsonRecord> {
  return JSON.parse(fs.readFileSync(path.join(sourceDirectory, fileName), "utf8")) as Record<
    string,
    JsonRecord
  >;
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.toLowerCase() !== "null" ? value : null;
}

const items = readJson("items.json");
const jobs = readJson("jobs.json");
const sets = readJson("sets.json");
const jobNames = new Map(
  Object.values(jobs).flatMap((job) =>
    typeof job.id === "number" && typeof job.name === "string" ? [[String(job.id), job.name] as const] : []
  )
);

const itemIndex = Object.fromEntries(
  Object.values(items).flatMap((item) => {
    if (item.id === undefined || item.id === null) return [];

    return [
      [
        String(item.id),
        {
          id: String(item.id),
          name: nullableString(item.name) ?? "",
          description: nullableString(item.description),
          icon: nullableString(item.icon),
          category: nullableString(item.category),
          subcategory: nullableString(item.subcategory),
          rarity: nullableString(item.rarity),
          level: typeof item.level === "number" ? item.level : null,
          sex: nullableString(item.sex),
          requiredJob: typeof item.class === "number" ? (jobNames.get(String(item.class)) ?? null) : null,
          minAttack: typeof item.minAttack === "number" ? item.minAttack : null,
          maxAttack: typeof item.maxAttack === "number" ? item.maxAttack : null,
          attackSpeed: nullableString(item.attackSpeed),
          twoHanded: typeof item.twoHanded === "boolean" ? item.twoHanded : null,
          minDefense: typeof item.minDefense === "number" ? item.minDefense : null,
          maxDefense: typeof item.maxDefense === "number" ? item.maxDefense : null,
          abilities: Array.isArray(item.abilities) ? item.abilities : []
        }
      ]
    ];
  })
);

const itemNames = new Map(Object.values(itemIndex).map((item) => [item.id, item.name]));
const itemSetIndex = Object.fromEntries(
  Object.values(sets).flatMap((set) => {
    if (
      set.id === undefined ||
      set.id === null ||
      typeof set.name !== "string" ||
      !Array.isArray(set.parts)
    ) {
      return [];
    }

    return [
      [
        String(set.id),
        {
          id: set.id,
          name: set.name,
          parts: set.parts.flatMap((part) => {
            const partId = typeof part === "number" ? part : null;
            return partId === null
              ? []
              : [{ id: partId, name: itemNames.get(String(partId)) ?? `Item ${partId}` }];
          }),
          bonus: Array.isArray(set.bonus) ? set.bonus : []
        }
      ]
    ];
  })
);

fs.mkdirSync(generatedDirectory, { recursive: true });
fs.writeFileSync(
  path.join(generatedDirectory, "item-icon-index.json"),
  `${JSON.stringify({ version: 1, items: itemIndex })}\n`
);
fs.writeFileSync(
  path.join(generatedDirectory, "item-set-index.json"),
  `${JSON.stringify({ version: 1, sets: itemSetIndex }, null, 2)}\n`
);
console.log(
  `Generated ${Object.keys(itemIndex).length} item records and ${Object.keys(itemSetIndex).length} item sets.`
);
