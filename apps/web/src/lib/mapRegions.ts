import { type CSSProperties } from "react";
import { type MapRegionId } from "@/lib/mapMonsterMarkers";
import authoredMapRegions from "../../../../content/authored/maps/regions.json";

export type MapRegionDefinition = {
  id: MapRegionId;
  label: string;
  description: string;
  worldHighlightSrc: string;
  regionMapSrc: string;
  hitArea: CSSProperties;
  worldMarkerPosition: CSSProperties;
};

export const mapRegions: MapRegionDefinition[] = authoredMapRegions.regions.map((region) => ({
  ...region,
  id: region.id as MapRegionId,
  hitArea: region.hitArea as CSSProperties,
  worldMarkerPosition: region.worldMarkerPosition as CSSProperties
}));
