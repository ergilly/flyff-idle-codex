"use client";

import Image from "next/image";
import { type MouseEvent, type WheelEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { MutedText } from "@/components/atoms/MutedText";
import { Panel } from "@/components/atoms/Panel";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import { MapZoomControls } from "@/components/molecules/map/MapZoomControls";
import { MonsterMarkerLayer } from "@/components/organisms/map/MonsterMarkerLayer";
import { TownLocationLayer } from "@/components/organisms/map/TownLocationLayer";
import { fetchMapMonsterFamilyIndex, type MapMonsterFamily } from "@/lib/api";
import { cx } from "@/lib/classNames";
import {
  createMapMonsterMarkers,
  getMonsterFamiliesByMarkerId,
  mapLocationMarkers,
  type MapRegionId,
  type MapMonsterMarker
} from "@/lib/mapMonsterMarkers";
import { mapRegions } from "@/lib/mapRegions";
import { getTestIdSegment } from "@/lib/testIds";
import { townMapLocations, type TownMapLocation } from "@/lib/townMapLocations";

const minMapZoom = 1;
const maxMapZoom = 2.5;
const mapZoomStep = 0.25;
const zeroPan = { x: 0, y: 0 };
const emptyMonsterMarkers: MapMonsterMarker[] = [];
const emptyMonsterFamilies: MapMonsterFamily[] = [];
const emptyMonsterFamilyIndex: Record<string, MapMonsterFamily[]> = {};

type MapPageProps = {
  onSelectMonster?: (monsterFamily: MapMonsterFamily) => void;
};

export function MapPage({ onSelectMonster }: MapPageProps) {
  const [activeRegionId, setActiveRegionId] = useState<MapRegionId | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<MapRegionId | null>(null);
  const [selectedTown, setSelectedTown] = useState<MapMonsterMarker | null>(null);
  const [selectedTownLocation, setSelectedTownLocation] = useState<TownMapLocation | null>(null);
  const [mapZoom, setMapZoom] = useState(minMapZoom);
  const [mapPan, setMapPan] = useState(zeroPan);
  const [isPanning, setIsPanning] = useState(false);
  const [monsterFamilyIndex, setMonsterFamilyIndex] = useState(emptyMonsterFamilyIndex);
  const mapViewportRef = useRef<HTMLDivElement | null>(null);
  const panStartRef = useRef({ panX: 0, panY: 0, x: 0, y: 0 });
  const selectedRegion = mapRegions.find((region) => region.id === selectedRegionId) ?? null;
  const activeRegion =
    mapRegions.find((region) => region.id === (activeRegionId ?? selectedRegionId)) ?? selectedRegion;
  const panelRegion = selectedRegion ?? activeRegion;
  const displayedMapSrc = selectedTown?.townMapSrc ?? selectedRegion?.regionMapSrc;
  const selectedTownLocations = selectedTown?.townMapId ? townMapLocations[selectedTown.townMapId] : [];
  const selectedRegionLocationMarkers = selectedRegion
    ? mapLocationMarkers[selectedRegion.id]
    : emptyMonsterMarkers;
  const selectedRegionMonsterMarkers = selectedRegion
    ? createMapMonsterMarkers(monsterFamilyIndex[selectedRegion.id] ?? emptyMonsterFamilies)
    : emptyMonsterMarkers;
  const selectedRegionMarkers = selectedRegion
    ? [...selectedRegionLocationMarkers, ...selectedRegionMonsterMarkers]
    : emptyMonsterMarkers;
  const monsterFamiliesByMarkerId = getMonsterFamiliesByMarkerId(
    selectedRegion ? (monsterFamilyIndex[selectedRegion.id] ?? emptyMonsterFamilies) : emptyMonsterFamilies
  );

  useEffect(() => {
    setMapZoom(minMapZoom);
    resetMapPan();
    setSelectedTownLocation(null);
  }, [selectedRegionId, selectedTown?.id]);

  useEffect(() => {
    let isCurrent = true;

    fetchMapMonsterFamilyIndex()
      .then((familiesByRegion) => {
        if (isCurrent) {
          setMonsterFamilyIndex(familiesByRegion);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setMonsterFamilyIndex(emptyMonsterFamilyIndex);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

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

  function selectRegion(regionId: MapRegionId) {
    setSelectedTown(null);
    setSelectedRegionId(regionId);
  }

  function backToWorld() {
    setSelectedTown(null);
    setSelectedRegionId(null);
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
        aria-label={
          selectedTown
            ? `${selectedTown.label} town map`
            : selectedRegion
              ? `${selectedRegion.label} region map`
              : "World map"
        }
      >
        <MapZoomControls
          canZoomIn={mapZoom < maxMapZoom}
          canZoomOut={mapZoom > minMapZoom}
          onReset={handleResetZoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          zoom={mapZoom}
        />
        {selectedRegion && displayedMapSrc ? (
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
                src={displayedMapSrc}
                alt={`${selectedTown?.label ?? selectedRegion.label} map`}
                width={1280}
                height={960}
                priority
                unoptimized
              />
              {!selectedTown ? (
                <MonsterMarkerLayer
                  markers={selectedRegionMarkers}
                  monsterFamiliesByMarkerId={monsterFamiliesByMarkerId}
                  onSelectMonster={onSelectMonster}
                  onSelectTown={setSelectedTown}
                />
              ) : (
                <TownLocationLayer
                  locations={selectedTownLocations}
                  onSelectLocation={setSelectedTownLocation}
                  selectedLocationId={selectedTownLocation?.id}
                  zoom={mapZoom}
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
                src="/images/maps/World/BaseMap.webp"
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
                  unoptimized
                />
              ) : null}
              {mapRegions.map((region) => (
                <button
                  key={region.id}
                  aria-label={`Select ${region.label}`}
                  data-testid={`map_button_region_hotspot_${getTestIdSegment(region.id)}`}
                  className="absolute rounded-[999px] border-2 border-transparent bg-transparent transition-colors hover:border-[#fff1ba]/80 focus-visible:border-[#fff1ba] focus-visible:bg-[#fff1ba]/10 focus-visible:outline-none"
                  onClick={() => selectRegion(region.id)}
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
            eyebrow={selectedTown ? "Town Map" : selectedRegion ? "Region Map" : "World Map"}
            testId="map_heading_region"
            title={selectedTown?.label ?? panelRegion?.label ?? "Select a region"}
          />
          {selectedRegion ? (
            <Button
              type="button"
              data-testid={selectedTown ? "map_button_back_to_region" : "map_button_back_to_world"}
              variant="secondary"
              className="min-h-10 shrink-0 px-3"
              onClick={() => (selectedTown ? setSelectedTown(null) : backToWorld())}
            >
              {selectedTown ? "Back to region" : "Back to world"}
            </Button>
          ) : null}
        </div>
        <MutedText data-testid="map_p_region_description">
          {selectedTown
            ? selectedTown.description
            : panelRegion
              ? panelRegion.description
              : "Hover over a region to preview its highlighted world location, then select it to open the region map."}
        </MutedText>
        {selectedTownLocation ? (
          <div
            className="grid gap-1 rounded-control border-2 border-primary bg-panel-muted px-3 py-2"
            data-testid="map_div_selected_town_location"
          >
            <span className="text-[0.65rem] font-black uppercase tracking-wide text-text-muted">
              Selected {selectedTownLocation.kind}
            </span>
            <span className="text-sm font-extrabold text-foreground">{selectedTownLocation.label}</span>
          </div>
        ) : null}
        <div className="grid gap-2" data-testid="map_div_region_list">
          {mapRegions.map((region) => (
            <button
              key={region.id}
              data-testid={`map_button_region_list_${getTestIdSegment(region.id)}`}
              className={cx(
                "min-h-10 rounded-control border-2 px-3 text-left text-sm font-extrabold transition-colors",
                panelRegion?.id === region.id
                  ? "border-primary bg-panel-muted text-foreground"
                  : "border-border bg-transparent text-text-muted hover:border-primary hover:text-foreground"
              )}
              onClick={() => selectRegion(region.id)}
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
