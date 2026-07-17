"use client";

import { createPortal } from "react-dom";
import { ItemDetailsPanel } from "@/components/organisms/main-application/ItemDetailsPanel";
import type { ShopInventoryItem } from "@/lib/townShops";

export function ShopItemDetailsOverlay({ item, rect }: { item: ShopInventoryItem; rect: DOMRect }) {
  const gap = 12;
  const viewportPadding = 8;
  const width = Math.min(340, window.innerWidth - viewportPadding * 2);
  const fitsToRight = rect.right + gap + width <= window.innerWidth - viewportPadding;
  const left = fitsToRight ? rect.right + gap : Math.max(viewportPadding, rect.left - gap - width);
  const top = Math.max(viewportPadding, Math.min(rect.top, window.innerHeight - 360));

  return createPortal(
    <div
      className="pointer-events-none fixed z-[100]"
      data-testid="shop_item_details_overlay"
      style={{ left, top, width }}
    >
      <ItemDetailsPanel
        className="!min-h-0 max-h-[calc(100vh-16px)] !max-w-none !bg-[#0b0b09] overflow-y-auto"
        item={item}
      >
        <div className="flex justify-between gap-3 border-t border-border pt-2 text-sm">
          <span className="font-extrabold text-text-muted">Shop price</span>
          <strong className="text-[#f4cf67]">{item.price.toLocaleString()} Penya</strong>
        </div>
      </ItemDetailsPanel>
    </div>,
    document.body
  );
}
