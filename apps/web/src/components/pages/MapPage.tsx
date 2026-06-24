"use client";

import Image from "next/image";
import { type MouseEvent, type WheelEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { MutedText } from "@/components/atoms/MutedText";
import { Panel } from "@/components/atoms/Panel";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import {
  fetchMonsterFamiliesByNames,
  getItemIconUrl,
  type MonsterFamily,
  type MonsterFamilyVariant
} from "@/lib/api";
import { cx } from "@/lib/classNames";
import { monsterMarkersByRegion, type MapRegionId, type MapMonsterMarker } from "@/lib/mapMonsterMarkers";

const minMapZoom = 1;
const maxMapZoom = 2.5;
const mapZoomStep = 0.25;
const zeroPan = { x: 0, y: 0 };
const emptyMonsterMarkers: MapMonsterMarker[] = [];

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

export function MapPage() {
  const [activeRegionId, setActiveRegionId] = useState<MapRegionId | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<MapRegionId | null>(null);
  const [mapZoom, setMapZoom] = useState(minMapZoom);
  const [mapPan, setMapPan] = useState(zeroPan);
  const [isPanning, setIsPanning] = useState(false);
  const [monsterFamiliesByName, setMonsterFamiliesByName] = useState<Record<string, MonsterFamily>>({});
  const mapViewportRef = useRef<HTMLDivElement | null>(null);
  const panStartRef = useRef({ panX: 0, panY: 0, x: 0, y: 0 });
  const selectedRegion = regions.find((region) => region.id === selectedRegionId) ?? null;
  const activeRegion =
    regions.find((region) => region.id === (activeRegionId ?? selectedRegionId)) ?? selectedRegion;
  const panelRegion = selectedRegion ?? activeRegion;
  const selectedRegionMarkers = selectedRegion
    ? monsterMarkersByRegion[selectedRegion.id]
    : emptyMonsterMarkers;

  useEffect(() => {
    setMapZoom(minMapZoom);
    resetMapPan();
  }, [selectedRegionId]);

  useEffect(() => {
    let isCurrent = true;
    const monsterNames = Array.from(
      new Set(
        selectedRegionMarkers
          .map((marker) => marker.monsterName)
          .filter((name): name is string => Boolean(name))
      )
    );

    if (monsterNames.length === 0) {
      setMonsterFamiliesByName({});
      return;
    }

    setMonsterFamiliesByName({});

    fetchMonsterFamiliesByNames(monsterNames)
      .then((familiesByName) => {
        if (isCurrent) {
          setMonsterFamiliesByName(familiesByName);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setMonsterFamiliesByName({});
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedRegionMarkers]);

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
    <section className="grid h-full min-h-0 grid-cols-[max-content_minmax(360px,1fr)] gap-4 max-[1100px]:grid-cols-1">
      <Panel
        as="section"
        className="relative aspect-[1195/896] h-full min-h-0 max-h-full max-w-full justify-self-center overflow-hidden p-2"
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
            onMouseDown={handlePanStart}
            onMouseLeave={handlePanEnd}
            onMouseMove={handlePanMove}
            onMouseUp={handlePanEnd}
            onWheel={handleWheelZoom}
          >
            <div
              className="absolute left-0 top-0 overflow-hidden"
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
              <MonsterMarkerLayer
                markers={selectedRegionMarkers}
                monsterFamiliesByName={monsterFamiliesByName}
              />
            </div>
          </div>
        ) : (
          <div
            ref={mapViewportRef}
            className={cx(
              "relative h-full w-full touch-none overflow-hidden",
              mapZoom > minMapZoom && (isPanning ? "cursor-grabbing" : "cursor-grab")
            )}
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
      <Panel as="aside" className="h-full content-start gap-4">
        <div className="flex items-start justify-between gap-3">
          <SectionHeading
            eyebrow={selectedRegion ? "Region Map" : "World Map"}
            title={panelRegion?.label ?? "Select a region"}
          />
          {selectedRegion ? (
            <Button
              type="button"
              variant="secondary"
              className="min-h-10 shrink-0 px-3"
              onClick={() => setSelectedRegionId(null)}
            >
              Back to world
            </Button>
          ) : null}
        </div>
        <MutedText>
          {panelRegion
            ? panelRegion.description
            : "Hover over a region to preview its highlighted world location, then select it to open the region map."}
        </MutedText>
        <div className="grid gap-2">
          {regions.map((region) => (
            <button
              key={region.id}
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
    <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-control border border-border bg-black/72 p-1 shadow-menu backdrop-blur-sm">
      <button
        type="button"
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
        className="min-w-14 rounded-control px-2 text-xs font-black text-[#fff1ba] transition-colors hover:bg-panel-muted"
        onClick={onReset}
        aria-label="Reset zoom"
        title="Reset zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
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
  monsterFamiliesByName
}: {
  markers: MapMonsterMarker[];
  monsterFamiliesByName: Record<string, MonsterFamily>;
}) {
  if (markers.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0">
      {markers.map((marker) => (
        <MonsterMarker
          key={marker.id}
          marker={marker}
          monsterFamily={getMonsterFamily(marker, monsterFamiliesByName)}
        />
      ))}
    </div>
  );
}

function MonsterMarker({
  marker,
  monsterFamily
}: {
  marker: MapMonsterMarker;
  monsterFamily?: MonsterFamily;
}) {
  const markerLabel = monsterFamily?.name ?? marker.label;

  return (
    <button
      aria-describedby={`${marker.id}-description`}
      aria-label={markerLabel}
      className="group absolute grid aspect-square w-[4.6%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#fff1ba]/70 bg-black/45 p-[0.35%] shadow-[0_2px_8px_rgba(0,0,0,0.65)] transition-transform hover:z-20 hover:scale-110 focus-visible:z-20 focus-visible:scale-110 focus-visible:border-[#fff1ba] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff1ba]/70"
      onMouseDown={(event) => event.stopPropagation()}
      style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
      title={markerLabel}
      type="button"
    >
      <Image
        className="pointer-events-none h-full w-full object-contain [image-rendering:pixelated]"
        src={marker.iconSrc}
        alt=""
        aria-hidden="true"
        width={40}
        height={40}
        unoptimized
      />
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
      className={cx(
        "pointer-events-none absolute z-30 grid w-max min-w-64 max-w-[min(32rem,calc(100vw-2rem))] gap-2 rounded-control border border-[#fff1ba]/70 bg-black/90 px-3 py-2 text-left opacity-0 shadow-menu transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100",
        getMonsterTooltipPlacement(marker)
      )}
    >
      <span className="text-xs font-black uppercase tracking-wide text-[#fff1ba]">
        {monsterFamily?.name ?? marker.label}
      </span>
      {monsterFamily ? (
        <>
          <span className="grid gap-1">
            {monsterFamily.variants.map((variant) => (
              <MonsterVariantRow key={`${variant.variantRank}-${variant.id}`} variant={variant} />
            ))}
          </span>
          <MonsterQuestDropBox monsterFamily={monsterFamily} />
        </>
      ) : (
        <span className="text-xs font-bold leading-snug text-foreground">{marker.description}</span>
      )}
    </span>
  );
}

function MonsterVariantRow({ variant }: { variant: MonsterFamilyVariant }) {
  return (
    <span className="grid grid-cols-[54px_minmax(0,1fr)_18px] items-center gap-2 rounded-[4px] border border-[rgba(187,161,89,0.2)] bg-[rgba(255,255,255,0.04)] px-2 py-1">
      <span
        className={cx(
          "text-[0.68rem] font-black uppercase leading-none text-text-muted",
          variant.variantRank === "giant" && "text-[#c27bff]"
        )}
      >
        {variant.variantRank}
      </span>
      <span className="min-w-0 whitespace-nowrap text-[0.72rem] font-extrabold leading-tight text-foreground">
        Lv. {formatMonsterValue(variant.level)} <span className="text-text-muted">{variant.name}</span>
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
  if (monsterFamily.questDrops.length === 0) {
    return (
      <span className="rounded-[4px] border border-[rgba(187,161,89,0.2)] bg-[rgba(0,0,0,0.35)] px-2 py-1.5 text-[0.7rem] font-bold text-text-muted">
        Quest drop: none found
      </span>
    );
  }

  return (
    <span className="grid gap-1 rounded-[4px] border border-[rgba(194,123,255,0.35)] bg-[rgba(20,9,31,0.72)] px-2 py-1.5">
      <span className="text-[0.62rem] font-black uppercase tracking-wide text-[#c27bff]">Quest drop</span>
      {monsterFamily.questDrops.map((item) => (
        <span key={String(item.id)} className="grid grid-cols-[22px_1fr] items-center gap-2">
          <span className="grid h-[22px] w-[22px] place-items-center rounded-[3px] border border-[rgba(187,161,89,0.3)] bg-black/55">
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
          <span className="whitespace-nowrap text-[0.72rem] font-extrabold leading-tight text-foreground">
            {item.name}
          </span>
        </span>
      ))}
    </span>
  );
}

function getMonsterFamily(marker: MapMonsterMarker, monsterFamiliesByName: Record<string, MonsterFamily>) {
  return marker.monsterName ? monsterFamiliesByName[marker.monsterName] : undefined;
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
    marker.y > 72 ? "bottom-[calc(100%+0.45rem)]" : "top-[calc(100%+0.45rem)]",
    marker.x < 22 ? "left-0" : marker.x > 78 ? "right-0" : "left-1/2 -translate-x-1/2"
  );
}
