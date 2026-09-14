import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { TownShop } from "../shops/shopTypes.js";

const shopStockItemSchema = z
  .object({
    id: z.string().min(1)
  })
  .strict();

const shopTabSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    items: z.array(shopStockItemSchema)
  })
  .strict();

const shopMerchantSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    tabs: z.array(shopTabSchema)
  })
  .strict();

const townShopSchema = z
  .object({
    id: z.string().regex(/^[^/]+\/[^/]+$/),
    merchantNames: z.array(z.string().min(1)),
    merchants: z.array(shopMerchantSchema)
  })
  .strict();

const shopsDocumentSchema = z
  .object({
    version: z.literal(1),
    shops: z.array(townShopSchema)
  })
  .strict();

type ShopsDocument = z.infer<typeof shopsDocumentSchema>;
export type ContentValidationOptions = {
  knownItemIds?: ReadonlySet<string>;
};

export function resolveContentDataDirectory(contentDirectory = process.env.CONTENT_DATA_DIR) {
  if (contentDirectory) {
    return path.isAbsolute(contentDirectory)
      ? contentDirectory
      : path.resolve(process.cwd(), contentDirectory);
  }

  const candidates = [
    path.resolve(process.cwd(), "apps/api/data/content"),
    path.resolve(process.cwd(), "data/content")
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
}

export function loadShopCatalog(
  contentDirectory = resolveContentDataDirectory(),
  options: ContentValidationOptions = {}
): Record<string, TownShop> {
  const filePath = path.join(contentDirectory, "shops.json");
  let source: string;

  try {
    source = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    throw new Error(`Unable to read local shop content at ${filePath}`, { cause: error });
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(source) as unknown;
  } catch (error) {
    throw new Error(`Invalid JSON in local shop content at ${filePath}`, { cause: error });
  }

  const document = shopsDocumentSchema.safeParse(parsed);

  if (!document.success) {
    throw new Error(`Invalid local shop content at ${filePath}: ${formatValidationError(document.error)}`);
  }

  validateShopCatalog(document.data, filePath, options);

  return Object.fromEntries(document.data.shops.map((shop) => [shop.id, shop]));
}

function validateShopCatalog(
  document: ShopsDocument,
  filePath: string,
  { knownItemIds }: ContentValidationOptions
) {
  const shopIds = new Set<string>();

  for (const shop of document.shops) {
    if (shopIds.has(shop.id)) {
      throw new Error(`Invalid local shop content at ${filePath}: duplicate shop id "${shop.id}"`);
    }
    shopIds.add(shop.id);

    const merchantIds = new Set<string>();

    for (const merchant of shop.merchants) {
      if (merchantIds.has(merchant.id)) {
        throw new Error(
          `Invalid local shop content at ${filePath}: duplicate merchant id "${merchant.id}" in shop "${shop.id}"`
        );
      }
      merchantIds.add(merchant.id);

      const tabIds = new Set<string>();

      for (const tab of merchant.tabs) {
        if (tabIds.has(tab.id)) {
          throw new Error(
            `Invalid local shop content at ${filePath}: duplicate tab id "${tab.id}" in merchant "${merchant.id}"`
          );
        }
        tabIds.add(tab.id);

        if (knownItemIds) {
          for (const item of tab.items) {
            if (!knownItemIds.has(item.id)) {
              throw new Error(
                `Invalid local shop content at ${filePath}: item id "${item.id}" is not present in game data`
              );
            }
          }
        }
      }
    }
  }
}

function formatValidationError(error: z.ZodError) {
  return error.issues.map((issue) => `${issue.path.join(".") || "document"}: ${issue.message}`).join("; ");
}
