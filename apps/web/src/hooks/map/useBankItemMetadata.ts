import { useEffect, useMemo, useState } from "react";
import { fetchItems, type Bank, type ItemMetadata } from "@/lib/api";

export function useBankItemMetadata(bank: Bank | null, suppliedItemsById: Record<string, ItemMetadata>) {
  const [loadedItemsById, setLoadedItemsById] = useState<Record<string, ItemMetadata>>({});
  const [error, setError] = useState("");
  const itemsById = useMemo(
    () => ({ ...suppliedItemsById, ...loadedItemsById }),
    [loadedItemsById, suppliedItemsById]
  );

  useEffect(() => {
    const token = localStorage.getItem("flyffIdleToken");
    const missingItemIds = Array.from(
      new Set(bank?.items.map((item) => item.itemId).filter((itemId) => !itemsById[itemId]) ?? [])
    );

    if (!token || missingItemIds.length === 0) return;

    let current = true;
    setError("");
    fetchItems(token, missingItemIds)
      .then((items) => {
        if (current) {
          setLoadedItemsById((loadedItems) => ({
            ...loadedItems,
            ...Object.fromEntries(items.map((item) => [item.id, item]))
          }));
        }
      })
      .catch(() => {
        if (current) setError("Unable to load stored item details");
      });

    return () => {
      current = false;
    };
  }, [bank, itemsById]);

  return { error, itemsById };
}
