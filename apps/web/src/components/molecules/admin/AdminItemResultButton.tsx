import Image from "next/image";
import type { FocusEvent, MouseEvent } from "react";
import { getItemIconUrl, type ItemMetadata } from "@/lib/api";
import { cx } from "@/lib/classNames";
import { getTestIdSegment } from "@/lib/testIds";

type InspectEvent = FocusEvent<HTMLButtonElement> | MouseEvent<HTMLButtonElement>;

export function AdminItemResultButton({
  isSelected,
  item,
  onClick,
  onHideDetails,
  onInspect
}: {
  isSelected: boolean;
  item: ItemMetadata;
  onClick: () => void;
  onHideDetails: () => void;
  onInspect: (event: InspectEvent) => void;
}) {
  const iconUrl = item.icon ? getItemIconUrl(item.icon) : null;
  return (
    <button
      className={cx(
        "flex min-h-[72px] w-full cursor-pointer items-center gap-3 rounded-control border-2 bg-panel-muted p-2.5 text-left transition-colors hover:border-primary",
        isSelected ? "border-primary text-foreground" : "border-border text-text-muted"
      )}
      data-testid={`admin_button_item_result_${getTestIdSegment(item.id)}`}
      onBlur={onHideDetails}
      onClick={onClick}
      onFocus={onInspect}
      onMouseEnter={onInspect}
      onMouseLeave={onHideDetails}
      type="button"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-control border border-border bg-panel">
        {iconUrl ? (
          <Image
            aria-hidden="true"
            alt=""
            className="max-h-10 max-w-10 object-contain"
            height={40}
            loading="lazy"
            src={iconUrl}
            unoptimized
            width={40}
          />
        ) : null}
      </span>
      <span
        className="grid min-w-0 flex-1 gap-1"
        data-testid={`admin_span_item_result_content_${getTestIdSegment(item.id)}`}
      >
        <strong
          className="line-clamp-2 text-sm leading-snug text-foreground"
          data-testid={`admin_strong_item_result_name_${getTestIdSegment(item.id)}`}
        >
          {item.name}
        </strong>
        <span
          className="break-words text-xs font-bold uppercase leading-snug"
          data-testid={`admin_span_item_result_meta_${getTestIdSegment(item.id)}`}
        >
          #{String(item.id)}
          {item.category ? ` - ${item.category}` : ""}
          {item.level !== null ? ` - Lv. ${item.level}` : ""}
        </span>
      </span>
    </button>
  );
}
