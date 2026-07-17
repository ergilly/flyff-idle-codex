"use client";

import Image from "next/image";
import { type FocusEvent, type MouseEvent } from "react";
import { getItemIconUrl } from "@/lib/api";
import { cx } from "@/lib/classNames";
import type { ShopInventoryItem } from "@/lib/townShops";

type ShopInventorySlotProps = {
  isSelected: boolean;
  onHideDetails: () => void;
  onInspect: (event: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>) => void;
  onSelect: () => void;
  quantity?: number;
  shopItem: ShopInventoryItem;
};

export function ShopInventorySlot({
  isSelected,
  onHideDetails,
  onInspect,
  onSelect,
  quantity,
  shopItem
}: ShopInventorySlotProps) {
  return (
    <button
      aria-label={`${shopItem.name}, ${shopItem.price.toLocaleString()} Penya`}
      aria-pressed={isSelected}
      className={cx(
        "relative grid h-[68px] w-[68px] place-items-center rounded-[5px] border-2 border-[rgba(118,107,73,0.72)] bg-[linear-gradient(180deg,rgba(12,12,10,0.94),rgba(0,0,0,0.98))] p-1 shadow-[inset_0_0_0_2px_rgba(0,0,0,0.9),inset_0_0_12px_rgba(214,199,119,0.1),0_0_8px_rgba(0,0,0,0.4)] hover:outline hover:outline-1 hover:-outline-offset-4 hover:outline-[rgba(255,222,91,0.74)] hover:shadow-[inset_0_0_18px_rgba(255,216,76,0.2)]",
        isSelected &&
          "outline outline-1 -outline-offset-4 outline-[rgba(255,222,91,0.74)] shadow-[inset_0_0_18px_rgba(255,216,76,0.2)]"
      )}
      onBlur={onHideDetails}
      onClick={onSelect}
      onFocus={onInspect}
      onMouseEnter={onInspect}
      onMouseLeave={onHideDetails}
      title={shopItem.name}
      type="button"
    >
      <span className="sr-only">{shopItem.name}</span>
      <Image
        className="h-[82%] w-[82%] object-contain [filter:drop-shadow(0_2px_3px_rgba(0,0,0,0.72))]"
        src={getItemIconUrl(shopItem.icon)}
        alt=""
        aria-hidden="true"
        width={52}
        height={52}
        unoptimized
      />
      {quantity !== undefined ? (
        <span
          className="absolute bottom-1 right-1 rounded bg-black/90 px-1 text-[0.65rem] font-black text-white"
          data-testid="shop_item_quantity"
        >
          {quantity.toLocaleString()}
        </span>
      ) : null}
    </button>
  );
}
