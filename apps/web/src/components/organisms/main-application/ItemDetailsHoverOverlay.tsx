"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { ItemDetailsPanel } from "@/components/organisms/main-application/ItemDetailsPanel";
import type { Character, ItemMetadata } from "@/lib/api";

type ItemDetailsHoverOverlayProps = {
  character?: Character;
  children?: ReactNode;
  equippedItemIds?: string[];
  item: ItemMetadata;
  rect: DOMRect;
  testId?: string;
};

export function ItemDetailsHoverOverlay({
  character,
  children,
  equippedItemIds,
  item,
  rect,
  testId = "item_details_hover_overlay"
}: ItemDetailsHoverOverlayProps) {
  const gap = 12;
  const viewportPadding = 8;
  const width = Math.min(340, window.innerWidth - viewportPadding * 2);
  const fitsToRight = rect.right + gap + width <= window.innerWidth - viewportPadding;
  const left = fitsToRight ? rect.right + gap : Math.max(viewportPadding, rect.left - gap - width);
  const top = Math.max(viewportPadding, Math.min(rect.top, window.innerHeight - 360));

  return createPortal(
    <div className="pointer-events-none fixed z-[100]" data-testid={testId} style={{ left, top, width }}>
      <ItemDetailsPanel
        character={character}
        className="!min-h-0 max-h-[calc(100vh-16px)] !max-w-none !bg-[#0b0b09] overflow-y-auto"
        equippedItemIds={equippedItemIds}
        item={item}
      >
        {children}
      </ItemDetailsPanel>
    </div>,
    document.body
  );
}
