import Image from "next/image";
import { type CSSProperties } from "react";
import {
  getItemIconUrl,
  type MapMonsterFamily,
  type MonsterFamily,
  type MonsterFamilyVariant
} from "@/lib/api";
import { cx } from "@/lib/classNames";
import { type MapMonsterMarker } from "@/lib/mapMonsterMarkers";
import { getTestIdSegment } from "@/lib/testIds";

const mapMarkerSaturationPercent = 30;

type MonsterMarkerLayerProps = {
  markers: MapMonsterMarker[];
  monsterFamiliesByMarkerId: Record<string, MapMonsterFamily>;
  onSelectMonster?: (monsterFamily: MapMonsterFamily) => void;
  onSelectTown?: (town: MapMonsterMarker) => void;
};

export function MonsterMarkerLayer({
  markers,
  monsterFamiliesByMarkerId,
  onSelectMonster,
  onSelectTown
}: MonsterMarkerLayerProps) {
  if (markers.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-10" data-testid="map_div_monster_marker_layer">
      {markers.map((marker) => (
        <MonsterMarker
          key={marker.id}
          marker={marker}
          monsterFamily={monsterFamiliesByMarkerId[marker.id]}
          onSelectMonster={onSelectMonster}
          onSelectTown={onSelectTown}
        />
      ))}
    </div>
  );
}

function MonsterMarker({
  marker,
  monsterFamily,
  onSelectMonster,
  onSelectTown
}: {
  marker: MapMonsterMarker;
  monsterFamily?: MapMonsterFamily;
  onSelectMonster?: (monsterFamily: MapMonsterFamily) => void;
  onSelectTown?: (town: MapMonsterMarker) => void;
}) {
  const markerLabel = monsterFamily?.name ?? marker.label;
  const markerWidthPercent = marker.markerType === "monster" ? 4.35 : 6 * marker.scale;
  const markerStyle: CSSProperties & Partial<Record<"--map-marker-saturation", string>> = {
    left: `${marker.x}%`,
    top: `${marker.y}%`,
    width: `${markerWidthPercent}%`
  };

  if (marker.markerType !== "monster") {
    markerStyle["--map-marker-saturation"] = `${mapMarkerSaturationPercent}%`;
  }

  return (
    <button
      aria-describedby={`${marker.id}-description`}
      aria-label={markerLabel}
      data-testid={`map_button_monster_marker_${getTestIdSegment(marker.id)}`}
      className={cx(
        "group absolute grid aspect-square -translate-x-1/2 -translate-y-1/2 place-items-center transition-[filter,transform] hover:z-40 hover:scale-110 focus-visible:z-40 focus-visible:scale-110 focus-visible:outline-none",
        marker.markerType === "monster"
          ? "z-10"
          : "z-30 [filter:saturate(var(--map-marker-saturation))] hover:[filter:saturate(100%)] focus-visible:[filter:saturate(100%)]"
      )}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={() => {
        if (monsterFamily) {
          onSelectMonster?.(monsterFamily);
        } else if (marker.markerType === "town" && marker.townMapSrc) {
          onSelectTown?.(marker);
        }
      }}
      style={markerStyle}
      title={markerLabel}
      type="button"
    >
      <span
        className="pointer-events-none grid h-full w-full place-items-center overflow-hidden group-focus-visible:ring-2 group-focus-visible:ring-[#fff1ba]/70"
        data-testid={`map_span_monster_marker_frame_${getTestIdSegment(marker.id)}`}
      >
        <span
          className={cx(
            "grid place-items-center",
            marker.markerType === "monster" ? "h-[82%] w-[82%]" : "h-[88%] w-[88%]"
          )}
          data-testid={`map_span_monster_marker_icon_${getTestIdSegment(marker.id)}`}
        >
          <Image
            className="pointer-events-none h-full w-full object-contain"
            src={marker.iconSrc}
            alt=""
            aria-hidden="true"
            width={64}
            height={64}
            unoptimized
          />
        </span>
      </span>
      <MonsterTooltip marker={marker} monsterFamily={monsterFamily} />
    </button>
  );
}

function MonsterTooltip({
  marker,
  monsterFamily
}: {
  marker: MapMonsterMarker;
  monsterFamily?: MonsterFamily;
}) {
  return (
    <span
      id={`${marker.id}-description`}
      role="tooltip"
      data-testid={`map_span_monster_tooltip_${getTestIdSegment(marker.id)}`}
      className={cx(
        "pointer-events-none absolute z-30 grid w-max min-w-64 max-w-[min(32rem,calc(100vw-2rem))] gap-2 rounded-control border border-[#fff1ba]/70 bg-black/90 px-3 py-2 text-left opacity-0 shadow-menu transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100",
        getMonsterTooltipPlacement(marker)
      )}
    >
      <span
        className="text-xs font-black uppercase tracking-wide text-[#fff1ba]"
        data-testid={`map_span_monster_tooltip_name_${getTestIdSegment(marker.id)}`}
      >
        {monsterFamily?.name ?? marker.label}
      </span>
      {!monsterFamily ? (
        <span className="text-[0.62rem] font-black uppercase tracking-wide text-text-muted">
          {marker.markerType}
        </span>
      ) : null}
      {monsterFamily ? (
        <>
          <span
            className="grid gap-1"
            data-testid={`map_span_monster_tooltip_variants_${getTestIdSegment(marker.id)}`}
          >
            {monsterFamily.variants.map((variant) => (
              <MonsterVariantRow key={`${variant.variantRank}-${variant.id}`} variant={variant} />
            ))}
          </span>
          <MonsterQuestDropBox monsterFamily={monsterFamily} />
        </>
      ) : (
        <span
          className="text-xs font-bold leading-snug text-foreground"
          data-testid={`map_span_monster_tooltip_description_${getTestIdSegment(marker.id)}`}
        >
          {marker.description}
        </span>
      )}
    </span>
  );
}

function MonsterVariantRow({ variant }: { variant: MonsterFamilyVariant }) {
  return (
    <span
      className="grid grid-cols-[54px_minmax(0,1fr)_18px] items-center gap-2 rounded-[4px] border border-[rgba(187,161,89,0.2)] bg-[rgba(255,255,255,0.04)] px-2 py-1"
      data-testid={`map_span_monster_variant_${getTestIdSegment(String(variant.id))}`}
    >
      <span
        className={cx(
          "text-[0.68rem] font-black uppercase leading-none text-text-muted",
          variant.variantRank === "giant" && "text-[#c27bff]"
        )}
      >
        {variant.variantRank}
      </span>
      <span
        className="min-w-0 whitespace-nowrap text-[0.72rem] font-extrabold leading-tight text-foreground"
        data-testid={`map_span_monster_variant_level_${getTestIdSegment(String(variant.id))}`}
      >
        Lv. {formatMonsterValue(variant.level)}{" "}
        <span
          className="text-text-muted"
          data-testid={`map_span_monster_variant_name_${getTestIdSegment(String(variant.id))}`}
        >
          {variant.name}
        </span>
      </span>
      <MonsterElementIcon element={variant.element} />
    </span>
  );
}

function MonsterElementIcon({ element }: { element: string | null }) {
  const elementIconSrc = getElementIconSrc(element);

  if (!elementIconSrc) {
    return <span className="h-[18px] w-[18px]" aria-hidden="true" />;
  }

  return (
    <Image
      className="h-[18px] w-[18px] object-contain"
      src={elementIconSrc}
      alt={`${element} element`}
      width={18}
      height={18}
      unoptimized
    />
  );
}

function MonsterQuestDropBox({ monsterFamily }: { monsterFamily: MonsterFamily }) {
  const monsterTestId = getTestIdSegment(monsterFamily.name);

  if (monsterFamily.questDrops.length === 0) {
    return (
      <span
        className="rounded-[4px] border border-[rgba(187,161,89,0.2)] bg-[rgba(0,0,0,0.35)] px-2 py-1.5 text-[0.7rem] font-bold text-text-muted"
        data-testid={`map_span_monster_quest_drop_empty_${monsterTestId}`}
      >
        Quest drop: none found
      </span>
    );
  }

  return (
    <span
      className="grid gap-1 rounded-[4px] border border-[rgba(194,123,255,0.35)] bg-[rgba(20,9,31,0.72)] px-2 py-1.5"
      data-testid={`map_span_monster_quest_drops_${monsterTestId}`}
    >
      <span
        className="text-[0.62rem] font-black uppercase tracking-wide text-[#c27bff]"
        data-testid={`map_span_monster_quest_drops_label_${monsterTestId}`}
      >
        Quest drop
      </span>
      {monsterFamily.questDrops.map((item) => (
        <span
          key={String(item.id)}
          className="grid grid-cols-[22px_1fr] items-center gap-2"
          data-testid={`map_span_monster_quest_drop_${monsterTestId}_${getTestIdSegment(String(item.id))}`}
        >
          <span
            className="grid h-[22px] w-[22px] place-items-center rounded-[3px] border border-[rgba(187,161,89,0.3)] bg-black/55"
            data-testid={`map_span_monster_quest_drop_icon_${monsterTestId}_${getTestIdSegment(String(item.id))}`}
          >
            {item.icon ? (
              <Image
                className="h-[18px] w-[18px] object-contain"
                src={getItemIconUrl(item.icon)}
                alt=""
                aria-hidden="true"
                width={18}
                height={18}
                unoptimized
              />
            ) : null}
          </span>
          <span
            className="whitespace-nowrap text-[0.72rem] font-extrabold leading-tight text-foreground"
            data-testid={`map_span_monster_quest_drop_name_${monsterTestId}_${getTestIdSegment(String(item.id))}`}
          >
            {item.name}
          </span>
        </span>
      ))}
    </span>
  );
}

function formatMonsterValue(value: string | number | null) {
  return value === null ? "Unknown" : String(value);
}

function getElementIconSrc(element: string | null) {
  if (!element || element === "none") {
    return null;
  }

  return `/images/elements/${element}.png`;
}

function getMonsterTooltipPlacement(marker: MapMonsterMarker) {
  return cx(
    marker.y >= 60 ? "bottom-[calc(100%+0.45rem)]" : "top-[calc(100%+0.45rem)]",
    marker.x < 22 ? "left-0" : marker.x > 78 ? "right-0" : "left-1/2 -translate-x-1/2"
  );
}
