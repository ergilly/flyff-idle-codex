import Image from "next/image";
import { getItemIconUrl } from "@/lib/api";
import { cx } from "@/lib/classNames";
import { getTestIdSegment } from "@/lib/testIds";

export function DropItemImage({
  icon,
  isQuestDrop,
  name
}: {
  icon: string | null | undefined;
  isQuestDrop: boolean;
  name: string | null | undefined;
}) {
  return (
    <div
      className={cx(
        "grid h-[42px] w-[42px] place-items-center rounded-[4px] border bg-black/38",
        isQuestDrop ? "border-[#f59e0b]" : "border-[rgba(226,179,63,0.34)]"
      )}
      data-testid={`battle_div_monster_drop_image_${getTestIdSegment(name ?? "unknown_item")}`}
    >
      {icon ? (
        <Image
          alt=""
          aria-hidden="true"
          className="h-9 w-9 object-contain"
          height={36}
          src={getItemIconUrl(icon)}
          unoptimized
          width={36}
        />
      ) : (
        <span className="text-xs font-black text-text-muted" aria-hidden="true">
          ?
        </span>
      )}
    </div>
  );
}

export function SmallDropItemImage({
  icon,
  name
}: {
  icon: string | null | undefined;
  name: string | null | undefined;
}) {
  return (
    <span
      className="grid h-9 w-9 place-items-center"
      data-testid={`battle_span_monster_quest_drop_image_${getTestIdSegment(name ?? "unknown_item")}`}
    >
      {icon ? (
        <Image
          alt=""
          aria-hidden="true"
          className="h-8 w-8 object-contain"
          height={32}
          src={getItemIconUrl(icon)}
          unoptimized
          width={32}
        />
      ) : (
        <span className="text-xs font-black text-text-muted" aria-hidden="true">
          ?
        </span>
      )}
    </span>
  );
}
