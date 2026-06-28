"use client";

import Image from "next/image";
import { type MouseEvent, type WheelEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { MutedText } from "@/components/atoms/MutedText";
import { Panel } from "@/components/atoms/Panel";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import {
  fetchMapMonsterFamiliesByRegion,
  getItemIconUrl,
  type MapMonsterFamily,
  type MonsterFamily,
  type MonsterFamilyVariant
} from "@/lib/api";
import { cx } from "@/lib/classNames";
import { getMonsterMarkerIconSrc, type MapRegionId, type MapMonsterMarker } from "@/lib/mapMonsterMarkers";

const minMapZoom = 1;
const maxMapZoom = 2.5;
const mapZoomStep = 0.25;
const zeroPan = { x: 0, y: 0 };
const emptyMonsterMarkers: MapMonsterMarker[] = [];
const emptyMonsterFamilies: MapMonsterFamily[] = [];

function getTestIdSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

type RegionDefinition = {
  id: MapRegionId;
  label: string;
  description: string;
  worldHighlightSrc: string;
  regionMapSrc: string;
  hitArea: {
    clipPath: string;
    height: string;
    left: string;
    top: string;
    width: string;
  };
};

const regions: RegionDefinition[] = [
  {
    id: "flaris",
    label: "Flaris",
    description: "A smaller island region southeast of the mainland.",
    worldHighlightSrc: "/images/maps/World/Flaris.png",
    regionMapSrc: "/images/maps/regions/WORLD_flaris.png",
    hitArea: {
      left: "50.8%",
      top: "62.4%",
      width: "17.8%",
      height: "23.4%",
      clipPath: "ellipse(42% 46% at 55% 50%)"
    }
  },
  {
    id: "saint",
    label: "Saint Morning",
    description: "A southern island region with rivers, fields, and city roads.",
    worldHighlightSrc: "/images/maps/World/SaintMorning.png",
    regionMapSrc: "/images/maps/regions/WORLD_saint.png",
    hitArea: {
      left: "62.5%",
      top: "66.3%",
      width: "17%",
      height: "27.8%",
      clipPath: "polygon(35% 3%, 56% 8%, 78% 28%, 88% 63%, 72% 94%, 38% 94%, 20% 73%, 15% 39%)"
    }
  },
  {
    id: "rhisis",
    label: "Garden of Rhisis",
    description: "An eastern island marked by narrow paths and old ruins.",
    worldHighlightSrc: "/images/maps/World/Rhisis.png",
    regionMapSrc: "/images/maps/regions/WORLD_rhisis.png",
    hitArea: {
      left: "68.3%",
      top: "63.1%",
      width: "17.5%",
      height: "17.5%",
      clipPath: "polygon(14% 37%, 41% 17%, 63% 20%, 89% 41%, 75% 76%, 49% 93%, 28% 74%)"
    }
  },
  {
    id: "darkon12",
    label: "Darkon 1 and 2",
    description: "The western Darkon landmass, rich with mines and old roads.",
    worldHighlightSrc: "/images/maps/World/Darkon12.png",
    regionMapSrc: "/images/maps/regions/WORLD_darkon12.png",
    hitArea: {
      left: "20.2%",
      top: "57.5%",
      width: "34%",
      height: "25.5%",
      clipPath: "polygon(5% 18%, 33% 8%, 58% 16%, 95% 35%, 91% 75%, 70% 96%, 40% 82%, 18% 58%)"
    }
  },
  {
    id: "darkon3",
    label: "Darkon 3",
    description: "A rugged southern zone shaped by cliffs, canyons, and heat.",
    worldHighlightSrc: "/images/maps/World/Darkon3.png",
    regionMapSrc: "/images/maps/regions/WORLD_darkon3.png",
    hitArea: {
      left: "11.5%",
      top: "61.6%",
      width: "25.5%",
      height: "32%",
      clipPath: "polygon(45% 0%, 68% 14%, 86% 47%, 75% 83%, 47% 98%, 12% 83%, 4% 53%, 18% 19%)"
    }
  },
  {
    id: "shaduwar",
    label: "Shaduwar",
    description: "A dark mountain region at the heart of the northern landmass.",
    worldHighlightSrc: "/images/maps/World/Shaduwar.png",
    regionMapSrc: "/images/maps/regions/WORLD_shaduwar.png",
    hitArea: {
      left: "42.7%",
      top: "34.8%",
      width: "24%",
      height: "24.4%",
      clipPath: "polygon(28% 10%, 55% 0%, 90% 17%, 93% 55%, 72% 90%, 32% 96%, 9% 68%, 8% 33%)"
    }
  },
  {
    id: "valley",
    label: "Valley of the Risen",
    description: "A central northern valley surrounded by mountain passes.",
    worldHighlightSrc: "/images/maps/World/Valley.png",
    regionMapSrc: "/images/maps/regions/WORLD_valley.png",
    hitArea: {
      left: "50.4%",
      top: "16.7%",
      width: "22.5%",
      height: "26.7%",
      clipPath: "polygon(13% 27%, 32% 7%, 78% 13%, 96% 42%, 82% 80%, 38% 92%, 13% 69%)"
    }
  },
  {
    id: "kaillun",
    label: "Kaillun",
    description: "A highland territory on the upper edge of Madrigal.",
    worldHighlightSrc: "/images/maps/World/Kaillun.png",
    regionMapSrc: "/images/maps/regions/WORLD_kaillun.png",
    hitArea: {
      left: "50.8%",
      top: "4.9%",
      width: "22.6%",
      height: "17%",
      clipPath: "polygon(18% 27%, 42% 8%, 84% 15%, 95% 47%, 75% 83%, 31% 89%, 8% 62%)"
    }
  },
  {
    id: "bahara",
    label: "Bahara",
    description: "A northern desert region beyond the mainland ridge.",
    worldHighlightSrc: "/images/maps/World/Bahara.png",
    regionMapSrc: "/images/maps/regions/WORLD_bahara.png",
    hitArea: {
      left: "34.4%",
      top: "5.9%",
      width: "20.4%",
      height: "20.8%",
      clipPath: "polygon(28% 12%, 77% 5%, 96% 46%, 82% 88%, 27% 92%, 4% 58%)"
    }
  }
];

type MapPageProps = {
  onSelectMonster?: (monsterFamily: MapMonsterFamily) => void;
};

export function MapPage({ onSelectMonster }: MapPageProps) {
  const [activeRegionId, setActiveRegionId] = useState<MapRegionId | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<MapRegionId | null>(null);
  const [mapZoom, setMapZoom] = useState(minMapZoom);
  const [mapPan, setMapPan] = useState(zeroPan);
  const [isPanning, setIsPanning] = useState(false);
  const [monsterFamilies, setMonsterFamilies] = useState<MapMonsterFamily[]>(emptyMonsterFamilies);
  const [isMonsterFamilyLoading, setIsMonsterFamilyLoading] = useState(false);
  const mapViewportRef = useRef<HTMLDivElement | null>(null);
  const panStartRef = useRef({ panX: 0, panY: 0, x: 0, y: 0 });
  const selectedRegion = regions.find((region) => region.id === selectedRegionId) ?? null;
  const activeRegion =
    regions.find((region) => region.id === (activeRegionId ?? selectedRegionId)) ?? selectedRegion;
  const panelRegion = selectedRegion ?? activeRegion;
  const selectedRegionMarkers = selectedRegion
    ? createMapMonsterMarkers(monsterFamilies)
    : emptyMonsterMarkers;
  const monsterFamiliesByMarkerId = getMonsterFamiliesByMarkerId(monsterFamilies);

  useEffect(() => {
    setMapZoom(minMapZoom);
    resetMapPan();
  }, [selectedRegionId]);

  useEffect(() => {
    let isCurrent = true;

    if (!selectedRegion) {
      setMonsterFamilies(emptyMonsterFamilies);
      setIsMonsterFamilyLoading(false);
      return;
    }

    setMonsterFamilies(emptyMonsterFamilies);
    setIsMonsterFamilyLoading(true);

    fetchMapMonsterFamiliesByRegion(selectedRegion.id)
      .then((families) => {
        if (isCurrent) {
          setMonsterFamilies(families);
          setIsMonsterFamilyLoading(false);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setMonsterFamilies(emptyMonsterFamilies);
          setIsMonsterFamilyLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedRegion]);

  function handleZoomIn() {
    zoomFromViewportCenter(mapZoom + mapZoomStep);
  }

  function handleZoomOut() {
    zoomFromViewportCenter(mapZoom - mapZoomStep);
  }

  function handleResetZoom() {
    setMapZoom(minMapZoom);
    resetMapPan();
  }

  function resetMapPan() {
    setMapPan(zeroPan);
  }

  function clampPan(nextPan: { x: number; y: number }, zoom = mapZoom) {
    const viewport = mapViewportRef.current;

    if (!viewport) {
      return zeroPan;
    }

    if (zoom <= minMapZoom) {
      return zeroPan;
    }

    const maxX = viewport.clientWidth * (zoom - 1);
    const maxY = viewport.clientHeight * (zoom - 1);

    return {
      x: Math.min(0, Math.max(-maxX, nextPan.x)),
      y: Math.min(0, Math.max(-maxY, nextPan.y))
    };
  }

  function handleWheelZoom(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    zoomFromViewportCenter(mapZoom + (event.deltaY < 0 ? mapZoomStep : -mapZoomStep));
  }

  function zoomFromViewportCenter(requestedZoom: number) {
    const viewport = mapViewportRef.current;
    const nextZoom = Math.min(maxMapZoom, Math.max(minMapZoom, requestedZoom));

    if (nextZoom === mapZoom) {
      return;
    }

    if (!viewport) {
      setMapZoom(nextZoom);
      return;
    }

    const centerX = viewport.clientWidth / 2;
    const centerY = viewport.clientHeight / 2;
    const zoomRatio = nextZoom / mapZoom;

    setMapPan((currentPan) =>
      clampPan(
        {
          x: centerX - (centerX - currentPan.x) * zoomRatio,
          y: centerY - (centerY - currentPan.y) * zoomRatio
        },
        nextZoom
      )
    );
    setMapZoom(nextZoom);
  }

  function handlePanStart(event: MouseEvent<HTMLDivElement>) {
    if (event.button !== 0 || mapZoom <= minMapZoom) {
      return;
    }

    event.preventDefault();
    panStartRef.current = {
      panX: mapPan.x,
      panY: mapPan.y,
      x: event.clientX,
      y: event.clientY
    };
    setIsPanning(true);
  }

  function handlePanMove(event: MouseEvent<HTMLDivElement>) {
    if (!isPanning) {
      return;
    }

    setMapPan(
      clampPan({
        x: panStartRef.current.panX + event.clientX - panStartRef.current.x,
        y: panStartRef.current.panY + event.clientY - panStartRef.current.y
      })
    );
  }

  function handlePanEnd() {
    setIsPanning(false);
  }

  return (
    <section
      className="grid h-full min-h-0 grid-cols-[max-content_minmax(360px,1fr)] gap-4 max-[1100px]:grid-cols-1"
      data-testid="map_section_page"
    >
      <Panel
        as="section"
        className="relative aspect-[1195/896] h-full min-h-0 max-h-full max-w-full justify-self-center overflow-hidden p-2"
        data-testid="map_panel_canvas"
        aria-label={selectedRegion ? `${selectedRegion.label} region map` : "World map"}
      >
        <ZoomControls
          onReset={handleResetZoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          zoom={mapZoom}
        />
        {selectedRegion ? (
          <div
            ref={mapViewportRef}
            className={cx(
              "relative h-full w-full touch-none overflow-hidden",
              mapZoom > minMapZoom && (isPanning ? "cursor-grabbing" : "cursor-grab")
            )}
            data-testid="map_div_region_viewport"
            onMouseDown={handlePanStart}
            onMouseLeave={handlePanEnd}
            onMouseMove={handlePanMove}
            onMouseUp={handlePanEnd}
            onWheel={handleWheelZoom}
          >
            <div
              className="absolute left-0 top-0 overflow-hidden"
              data-testid="map_div_region_layer"
              style={{
                height: `${mapZoom * 100}%`,
                transform: `translate(${mapPan.x}px, ${mapPan.y}px)`,
                width: `${mapZoom * 100}%`
              }}
            >
              <Image
                className="h-full w-full object-contain"
                src={selectedRegion.regionMapSrc}
                alt={`${selectedRegion.label} map`}
                width={1280}
                height={960}
                priority
                unoptimized
              />
              {isMonsterFamilyLoading ? (
                <div
                  className="absolute inset-0 grid place-items-center bg-black/18 text-xs font-black uppercase tracking-wide text-[#fff1ba]"
                  data-testid="map_div_monsters_loading"
                >
                  Loading monster data...
                </div>
              ) : (
                <MonsterMarkerLayer
                  markers={selectedRegionMarkers}
                  monsterFamiliesByMarkerId={monsterFamiliesByMarkerId}
                  onSelectMonster={onSelectMonster}
                />
              )}
            </div>
          </div>
        ) : (
          <div
            ref={mapViewportRef}
            className={cx(
              "relative h-full w-full touch-none overflow-hidden",
              mapZoom > minMapZoom && (isPanning ? "cursor-grabbing" : "cursor-grab")
            )}
            data-testid="map_div_world_viewport"
            onMouseDown={handlePanStart}
            onMouseLeave={() => {
              setActiveRegionId(null);
              handlePanEnd();
            }}
            onMouseMove={handlePanMove}
            onMouseUp={handlePanEnd}
            onWheel={handleWheelZoom}
          >
            <div
              className="absolute left-0 top-0 overflow-hidden"
              data-testid="map_div_world_layer"
              style={{
                height: `${mapZoom * 100}%`,
                transform: `translate(${mapPan.x}px, ${mapPan.y}px)`,
                width: `${mapZoom * 100}%`
              }}
            >
              <Image
                className="h-full w-full object-contain"
                src="/images/maps/World/BaseMap.png"
                alt="Madrigal world map"
                width={1195}
                height={896}
                priority
                unoptimized
              />
              {activeRegion ? (
                <Image
                  className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-100 transition-opacity duration-150"
                  src={activeRegion.worldHighlightSrc}
                  alt=""
                  aria-hidden="true"
                  width={1195}
                  height={896}
                  priority
                  unoptimized
                />
              ) : null}
              {regions.map((region) => (
                <button
                  key={region.id}
                  aria-label={`Select ${region.label}`}
                  data-testid={`map_button_region_hotspot_${getTestIdSegment(region.id)}`}
                  className="absolute rounded-[999px] border-2 border-transparent bg-transparent transition-colors hover:border-[#fff1ba]/80 focus-visible:border-[#fff1ba] focus-visible:bg-[#fff1ba]/10 focus-visible:outline-none"
                  onClick={() => setSelectedRegionId(region.id)}
                  onFocus={() => setActiveRegionId(region.id)}
                  onMouseEnter={() => setActiveRegionId(region.id)}
                  style={region.hitArea}
                  title={region.label}
                  type="button"
                />
              ))}
            </div>
          </div>
        )}
      </Panel>
      <Panel as="aside" className="h-full content-start gap-4" data-testid="map_panel_regions">
        <div className="flex items-start justify-between gap-3" data-testid="map_div_region_header">
          <SectionHeading
            eyebrow={selectedRegion ? "Region Map" : "World Map"}
            testId="map_heading_region"
            title={panelRegion?.label ?? "Select a region"}
          />
          {selectedRegion ? (
            <Button
              type="button"
              data-testid="map_button_back_to_world"
              variant="secondary"
              className="min-h-10 shrink-0 px-3"
              onClick={() => setSelectedRegionId(null)}
            >
              Back to world
            </Button>
          ) : null}
        </div>
        <MutedText data-testid="map_p_region_description">
          {panelRegion
            ? panelRegion.description
            : "Hover over a region to preview its highlighted world location, then select it to open the region map."}
        </MutedText>
        <div className="grid gap-2" data-testid="map_div_region_list">
          {regions.map((region) => (
            <button
              key={region.id}
              data-testid={`map_button_region_list_${getTestIdSegment(region.id)}`}
              className={cx(
                "min-h-10 rounded-control border-2 px-3 text-left text-sm font-extrabold transition-colors",
                panelRegion?.id === region.id
                  ? "border-primary bg-panel-muted text-foreground"
                  : "border-border bg-transparent text-text-muted hover:border-primary hover:text-foreground"
              )}
              onClick={() => setSelectedRegionId(region.id)}
              onFocus={() => setActiveRegionId(region.id)}
              onMouseEnter={() => setActiveRegionId(region.id)}
              type="button"
            >
              {region.label}
            </button>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function ZoomControls({
  onReset,
  onZoomIn,
  onZoomOut,
  zoom
}: {
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoom: number;
}) {
  return (
    <div
      className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-control border border-border bg-black/72 p-1 shadow-menu backdrop-blur-sm"
      data-testid="map_div_zoom_controls"
    >
      <button
        type="button"
        data-testid="map_button_zoom_out"
        className="grid h-8 w-8 place-items-center rounded-control border border-border bg-panel-muted text-base font-black text-foreground transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
        disabled={zoom <= minMapZoom}
        onClick={onZoomOut}
        aria-label="Zoom out"
        title="Zoom out"
      >
        -
      </button>
      <button
        type="button"
        data-testid="map_button_zoom_reset"
        className="min-w-14 rounded-control px-2 text-xs font-black text-[#fff1ba] transition-colors hover:bg-panel-muted"
        onClick={onReset}
        aria-label="Reset zoom"
        title="Reset zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        data-testid="map_button_zoom_in"
        className="grid h-8 w-8 place-items-center rounded-control border border-border bg-panel-muted text-base font-black text-foreground transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
        disabled={zoom >= maxMapZoom}
        onClick={onZoomIn}
        aria-label="Zoom in"
        title="Zoom in"
      >
        +
      </button>
    </div>
  );
}

function MonsterMarkerLayer({
  markers,
  monsterFamiliesByMarkerId,
  onSelectMonster
}: {
  markers: MapMonsterMarker[];
  monsterFamiliesByMarkerId: Record<string, MapMonsterFamily>;
  onSelectMonster?: (monsterFamily: MapMonsterFamily) => void;
}) {
  if (markers.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0" data-testid="map_div_monster_marker_layer">
      {markers.map((marker) => (
        <MonsterMarker
          key={marker.id}
          marker={marker}
          monsterFamily={monsterFamiliesByMarkerId[marker.id]}
          onSelectMonster={onSelectMonster}
        />
      ))}
    </div>
  );
}

function MonsterMarker({
  marker,
  monsterFamily,
  onSelectMonster
}: {
  marker: MapMonsterMarker;
  monsterFamily?: MapMonsterFamily;
  onSelectMonster?: (monsterFamily: MapMonsterFamily) => void;
}) {
  const markerLabel = monsterFamily?.name ?? marker.label;

  return (
    <button
      aria-describedby={`${marker.id}-description`}
      aria-label={markerLabel}
      data-testid={`map_button_monster_marker_${getTestIdSegment(marker.id)}`}
      className="group absolute grid aspect-square w-[4.35%] -translate-x-1/2 -translate-y-1/2 place-items-center transition-transform hover:z-20 hover:scale-110 focus-visible:z-20 focus-visible:scale-110 focus-visible:outline-none"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={() => {
        if (monsterFamily) {
          onSelectMonster?.(monsterFamily);
        }
      }}
      style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
      title={markerLabel}
      type="button"
    >
      <span
        className="pointer-events-none grid h-full w-full place-items-center overflow-hidden rounded-full border border-[#fff1ba]/70 bg-black/45 shadow-[0_2px_8px_rgba(0,0,0,0.65)] group-focus-visible:border-[#fff1ba] group-focus-visible:ring-2 group-focus-visible:ring-[#fff1ba]/70"
        data-testid={`map_span_monster_marker_frame_${getTestIdSegment(marker.id)}`}
      >
        <span
          className="grid h-[82%] w-[82%] place-items-center"
          data-testid={`map_span_monster_marker_icon_${getTestIdSegment(marker.id)}`}
        >
          <Image
            className="pointer-events-none h-full w-full object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]"
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

function createMapMonsterMarkers(monsterFamilies: MapMonsterFamily[]) {
  return monsterFamilies.flatMap((family) => {
    return [
      {
        description: `Spawn marker for ${family.name}.`,
        family: family.family,
        iconSrc: getMonsterMarkerIconSrc(family.family),
        id: getMapMonsterMarkerId(family),
        label: family.name,
        x: family.location.x,
        y: family.location.y
      }
    ];
  });
}

function getMonsterFamiliesByMarkerId(monsterFamilies: MapMonsterFamily[]) {
  return Object.fromEntries(monsterFamilies.map((family) => [getMapMonsterMarkerId(family), family]));
}

function getMapMonsterMarkerId(family: MapMonsterFamily) {
  return [family.location.region, family.family, family.location.x, family.location.y].join("-");
}
