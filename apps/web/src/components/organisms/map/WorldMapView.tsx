import Image from "next/image";
import type { useMapNavigation } from "@/hooks/map/useMapNavigation";
import type { useMapViewport } from "@/hooks/map/useMapViewport";
import { cx } from "@/lib/classNames";
import { mapRegions } from "@/lib/mapRegions";
import { getTestIdSegment } from "@/lib/testIds";

type WorldMapViewProps = {
  characterLocation: string;
  navigation: ReturnType<typeof useMapNavigation>;
  viewport: ReturnType<typeof useMapViewport>;
};

export function WorldMapView({ characterLocation, navigation, viewport }: WorldMapViewProps) {
  return (
    <div
      ref={viewport.viewportRef}
      className={cx(
        "relative h-full w-full touch-none overflow-hidden",
        viewport.zoom > 1 && (viewport.isPanning ? "cursor-grabbing" : "cursor-grab")
      )}
      data-testid="map_div_world_viewport"
      onMouseDown={viewport.handlePanStart}
      onMouseLeave={() => {
        navigation.setActiveRegionId(null);
        viewport.handlePanEnd();
      }}
      onMouseMove={viewport.handlePanMove}
      onMouseUp={viewport.handlePanEnd}
      onWheel={viewport.handleWheel}
    >
      <div
        className="absolute left-0 top-0 overflow-hidden"
        data-testid="map_div_world_layer"
        style={viewport.layerStyle}
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
        {navigation.activeRegion ? (
          <Image
            className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-100 transition-opacity duration-150"
            src={navigation.activeRegion.worldHighlightSrc}
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
            onClick={() => navigation.selectRegion(region.id)}
            onFocus={() => navigation.setActiveRegionId(region.id)}
            onMouseEnter={() => navigation.setActiveRegionId(region.id)}
            style={region.hitArea}
            title={region.label}
            type="button"
          />
        ))}
        {navigation.currentRegion ? (
          <div
            aria-label={`Current location: ${characterLocation}`}
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full"
            data-testid="map_div_current_location_marker"
            role="img"
            style={navigation.currentRegion.worldMarkerPosition}
          >
            <div className="animate-bounce rounded-full border-2 border-[#fff1ba] bg-[#15130d] px-2 py-1 text-xs font-black text-[#fff1ba] shadow-[0_3px_10px_rgba(0,0,0,0.8)]">
              You are here
            </div>
            <div className="mx-auto h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-[#fff1ba]" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
