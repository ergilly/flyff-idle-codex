import type { ShopInventoryItem } from "@/lib/townShops";
import { meetsRequiredJobForJob } from "@/lib/jobProgression";

export type ShopFilterOptions = {
  characterLevel?: number;
  characterJob?: string;
  characterSex?: "female" | "male";
  filterByClass: boolean;
  filterByLevel: boolean;
  filterBySex: boolean;
};

export function meetsShopFilters(item: ShopInventoryItem, options: ShopFilterOptions) {
  const meetsClass =
    !options.filterByClass ||
    !item.requiredJob ||
    Boolean(options.characterJob && meetsRequiredJobForJob(options.characterJob, item.requiredJob));
  const meetsSex = !options.filterBySex || !item.sex || item.sex.toLowerCase() === options.characterSex;
  const meetsLevel =
    !options.filterByLevel || item.level === null || item.level <= (options.characterLevel ?? 0);

  return meetsClass && meetsSex && meetsLevel;
}
