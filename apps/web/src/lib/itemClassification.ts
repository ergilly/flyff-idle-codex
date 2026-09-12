import type { ItemMetadata } from "@/lib/api/types";

type ClassifiableItem = Pick<ItemMetadata, "category" | "subcategory">;

export const questDropItemLookupCategories = ["booty", "quest"] as const;

export function isQuestDropItem(item: ClassifiableItem | undefined) {
  const category = item?.category?.toLowerCase() ?? "";
  const subcategory = item?.subcategory?.toLowerCase() ?? "";

  return category === "booty" || category.includes("quest") || subcategory.includes("quest");
}
