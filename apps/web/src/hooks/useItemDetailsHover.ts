"use client";

import { useState, type FocusEvent, type MouseEvent } from "react";
import type { ItemMetadata } from "@/lib/api";

export type InspectedItemDetails = { item: ItemMetadata; rect: DOMRect };
type InspectEvent = MouseEvent<HTMLElement> | FocusEvent<HTMLElement>;

export function useItemDetailsHover() {
  const [inspectedItem, setInspectedItem] = useState<InspectedItemDetails | null>(null);

  function inspectItem(item: ItemMetadata, event: InspectEvent) {
    setInspectedItem({ item, rect: event.currentTarget.getBoundingClientRect() });
  }

  function hideItemDetails() {
    setInspectedItem(null);
  }

  return { hideItemDetails, inspectItem, inspectedItem };
}
