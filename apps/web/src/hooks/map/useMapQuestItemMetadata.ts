import { useEffect, useMemo, useState } from "react";
import { fetchItems, type ItemMetadata, type MapMonsterFamily } from "@/lib/api";

export function useMapQuestItemMetadata(
  monsterFamilies: MapMonsterFamily[],
  suppliedItemsById: Record<string, ItemMetadata>
) {
  const [loadedItemsById, setLoadedItemsById] = useState<Record<string, ItemMetadata>>({});
  const itemsById = useMemo(
    () => ({ ...suppliedItemsById, ...loadedItemsById }),
    [loadedItemsById, suppliedItemsById]
  );

  useEffect(() => {
    const token = localStorage.getItem("flyffIdleToken");
    const missingItemIds = Array.from(
      new Set(
        monsterFamilies
          .flatMap((family) => family.questDrops)
          .map((questDrop) => String(questDrop.id))
          .filter((itemId) => !itemsById[itemId])
      )
    );

    if (!token || missingItemIds.length === 0) return;

    let current = true;
    fetchItems(token, missingItemIds)
      .then((items) => {
        if (current && items.length > 0) {
          setLoadedItemsById((loadedItems) => ({
            ...loadedItems,
            ...Object.fromEntries(items.map((item) => [item.id, item]))
          }));
        }
      })
      .catch(() => {
        // The map family data retains a quest-drop icon fallback when authoritative metadata fails.
      });

    return () => {
      current = false;
    };
  }, [itemsById, monsterFamilies]);

  return itemsById;
}
