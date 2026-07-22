import Image from "next/image";
import { MonsterMarkerLayer } from "@/components/organisms/map/MonsterMarkerLayer";
import { TownLocationLayer } from "@/components/organisms/map/TownLocationLayer";
import type { useMapNavigation } from "@/hooks/map/useMapNavigation";
import type { useMapViewport } from "@/hooks/map/useMapViewport";
import type { ItemMetadata, MapMonsterFamily } from "@/lib/api";
import { cx } from "@/lib/classNames";

export function RegionMapView({
  itemsById,
  navigation,
  onSelectMonster,
  viewport
}: {
  itemsById?: Record<string, ItemMetadata>;
  navigation: ReturnType<typeof useMapNavigation>;
  onSelectMonster?: (monster: MapMonsterFamily) => void;
  viewport: ReturnType<typeof useMapViewport>;
}) {
  if (!navigation.selectedRegion || !navigation.displayedMapSrc) return null;

  return (
    <div
      ref={viewport.viewportRef}
      className={cx(
        "relative h-full w-full touch-none overflow-hidden",
        viewport.zoom > 1 && (viewport.isPanning ? "cursor-grabbing" : "cursor-grab")
      )}
      data-testid="map_div_region_viewport"
      onMouseDown={viewport.handlePanStart}
      onMouseLeave={viewport.handlePanEnd}
      onMouseMove={viewport.handlePanMove}
      onMouseUp={viewport.handlePanEnd}
      onWheel={viewport.handleWheel}
    >
      <div
        className="absolute left-0 top-0 overflow-hidden"
        data-testid="map_div_region_layer"
        style={viewport.layerStyle}
      >
        <Image
          className="h-full w-full object-contain"
          src={navigation.displayedMapSrc}
          alt={`${navigation.selectedTown?.label ?? navigation.selectedRegion.label} map`}
          width={1280}
          height={960}
          priority
          unoptimized
        />
        {navigation.selectedTown ? (
          <TownLocationLayer
            locations={navigation.selectedTownLocations}
            onSelectLocation={navigation.setSelectedTownLocation}
            selectedLocationId={navigation.selectedTownLocation?.id}
            zoom={viewport.zoom}
          />
        ) : (
          <MonsterMarkerLayer
            itemsById={itemsById}
            markers={navigation.selectedRegionMarkers}
            monsterFamiliesByMarkerId={navigation.monsterFamiliesByMarkerId}
            onSelectMonster={onSelectMonster}
            onSelectTown={navigation.selectTown}
          />
        )}
      </div>
    </div>
  );
}
