"use client";

import { Panel } from "@/components/atoms/Panel";
import { MapZoomControls } from "@/components/molecules/map/MapZoomControls";
import { MapSidePanel } from "@/components/organisms/map/MapSidePanel";
import { MapTravelDialog } from "@/components/organisms/map/MapTravelDialog";
import { RegionMapView } from "@/components/organisms/map/RegionMapView";
import { WorldMapView } from "@/components/organisms/map/WorldMapView";
import { useMapNavigation } from "@/hooks/map/useMapNavigation";
import { useMapViewport } from "@/hooks/map/useMapViewport";
import type { MapMonsterFamily } from "@/lib/api";
import type { CharacterInventory, ItemMetadata } from "@/lib/api/types";
import type { MapRegionId } from "@/lib/mapMonsterMarkers";
import type { TravelMethod } from "@/lib/mapTravel";
import type { TownMapId } from "@/lib/townMapLocations";

type MapPageProps = {
  characterLocation?: string;
  characterJob?: string;
  characterLevel?: number;
  characterInventory?: CharacterInventory;
  characterPenya?: number;
  characterSex?: "female" | "male";
  equippedFlyingItemId?: string | null;
  itemsById?: Record<string, ItemMetadata>;
  onBuyShopItem?: (
    townMapId: TownMapId,
    locationId: string,
    itemId: string,
    quantity: number
  ) => Promise<void>;
  onSelectMonster?: (monsterFamily: MapMonsterFamily) => void;
  onSellShopItem?: (slotIndex: number, quantity: number) => Promise<void>;
  onTravel?: (destination: MapRegionId, method: TravelMethod) => Promise<void>;
};

export function MapPage({
  characterLocation = "Flaris",
  characterJob,
  characterLevel,
  characterInventory,
  characterPenya,
  characterSex,
  equippedFlyingItemId,
  itemsById,
  onBuyShopItem,
  onSelectMonster,
  onSellShopItem,
  onTravel
}: MapPageProps) {
  const navigation = useMapNavigation({ characterLocation, onTravel });
  const viewport = useMapViewport(navigation.resetKey);

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
          navigation.selectedTown
            ? `${navigation.selectedTown.label} town map`
            : navigation.selectedRegion
              ? `${navigation.selectedRegion.label} region map`
              : "World map"
        }
      >
        <MapZoomControls
          canZoomIn={viewport.canZoomIn}
          canZoomOut={viewport.canZoomOut}
          onReset={viewport.reset}
          onZoomIn={viewport.zoomIn}
          onZoomOut={viewport.zoomOut}
          zoom={viewport.zoom}
        />
        {navigation.selectedRegion && navigation.displayedMapSrc ? (
          <RegionMapView navigation={navigation} onSelectMonster={onSelectMonster} viewport={viewport} />
        ) : (
          <WorldMapView characterLocation={characterLocation} navigation={navigation} viewport={viewport} />
        )}
      </Panel>
      <MapSidePanel
        characterInventory={characterInventory}
        characterJob={characterJob}
        characterLevel={characterLevel}
        characterPenya={characterPenya}
        characterSex={characterSex}
        itemsById={itemsById}
        navigation={navigation}
        onBuyShopItem={onBuyShopItem}
        onSellShopItem={onSellShopItem}
      />
      {navigation.pendingTravelDestination ? (
        <MapTravelDialog
          destination={navigation.pendingTravelDestination}
          equippedFlyingItemId={equippedFlyingItemId}
          inventory={characterInventory}
          itemsById={itemsById}
          onCancel={() => navigation.setPendingTravelRegionId(null)}
          onTravel={navigation.travel}
        />
      ) : null}
    </section>
  );
}
