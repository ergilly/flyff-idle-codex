"use client";

import { ItemDetailsHoverOverlay } from "@/components/organisms/main-application/ItemDetailsHoverOverlay";
import type { ShopInventoryItem } from "@/lib/townShops";

export function ShopItemDetailsOverlay({
  item,
  rect,
  showPrice = true
}: {
  item: ShopInventoryItem;
  rect: DOMRect;
  showPrice?: boolean;
}) {
  return (
    <ItemDetailsHoverOverlay item={item} rect={rect} testId="shop_item_details_overlay">
      {showPrice ? (
        <div className="flex justify-between gap-3 border-t border-border pt-2 text-sm">
          <span className="font-extrabold text-text-muted">Shop price</span>
          <strong className="text-[#f4cf67]">{item.price.toLocaleString()} Penya</strong>
        </div>
      ) : null}
    </ItemDetailsHoverOverlay>
  );
}
