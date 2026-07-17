"use client";

import { useEffect, useState } from "react";
import { fetchMapMonsterFamilyIndex, type MapMonsterFamily } from "@/lib/api";
import {
  createMapMonsterMarkers,
  getMonsterFamiliesByMarkerId,
  mapLocationMarkers,
  type MapMonsterMarker,
  type MapRegionId
} from "@/lib/mapMonsterMarkers";
import { mapRegions } from "@/lib/mapRegions";
import { getRegionIdForLocation, mapTravelDestinations, type TravelMethod } from "@/lib/mapTravel";
import { townMapLocations, type TownMapLocation } from "@/lib/townMapLocations";

const emptyMonsterFamilies: MapMonsterFamily[] = [];
const emptyMonsterFamilyIndex: Record<string, MapMonsterFamily[]> = {};

export function useMapNavigation({
  characterLocation,
  onTravel
}: {
  characterLocation: string;
  onTravel?: (destination: MapRegionId, method: TravelMethod) => Promise<void>;
}) {
  const [activeRegionId, setActiveRegionId] = useState<MapRegionId | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<MapRegionId | null>(null);
  const [selectedTown, setSelectedTown] = useState<MapMonsterMarker | null>(null);
  const [selectedTownLocation, setSelectedTownLocation] = useState<TownMapLocation | null>(null);
  const [monsterFamilyIndex, setMonsterFamilyIndex] = useState(emptyMonsterFamilyIndex);
  const [pendingTravelRegionId, setPendingTravelRegionId] = useState<MapRegionId | null>(null);
  const selectedRegion = mapRegions.find((region) => region.id === selectedRegionId) ?? null;
  const activeRegion =
    mapRegions.find((region) => region.id === (activeRegionId ?? selectedRegionId)) ?? selectedRegion;
  const panelRegion = selectedRegion ?? activeRegion;
  const currentRegionId = getRegionIdForLocation(characterLocation);
  const selectedRegionFamilies = selectedRegion
    ? (monsterFamilyIndex[selectedRegion.id] ?? emptyMonsterFamilies)
    : emptyMonsterFamilies;
  const selectedRegionMarkers = selectedRegion
    ? [...mapLocationMarkers[selectedRegion.id], ...createMapMonsterMarkers(selectedRegionFamilies)]
    : [];

  useEffect(() => {
    setSelectedTownLocation(null);
  }, [selectedRegionId, selectedTown?.id]);

  useEffect(() => {
    let isCurrent = true;
    fetchMapMonsterFamilyIndex()
      .then((index) => {
        if (isCurrent) setMonsterFamilyIndex(index);
      })
      .catch(() => {
        if (isCurrent) setMonsterFamilyIndex(emptyMonsterFamilyIndex);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  function selectRegion(regionId: MapRegionId) {
    if (onTravel && regionId !== currentRegionId) {
      setPendingTravelRegionId(regionId);
      return;
    }
    setSelectedTown(null);
    setSelectedRegionId(regionId);
  }

  async function travel(method: TravelMethod) {
    if (!onTravel || !pendingTravelRegionId) return;
    const destinationId = pendingTravelRegionId;
    await onTravel(destinationId, method);
    setPendingTravelRegionId(null);
    setSelectedTown(null);
    setSelectedRegionId(destinationId);
  }

  return {
    activeRegion,
    backToWorld: () => {
      setSelectedTown(null);
      setSelectedRegionId(null);
    },
    currentRegion: mapRegions.find((region) => region.id === currentRegionId),
    displayedMapSrc: selectedTown?.townMapSrc ?? selectedRegion?.regionMapSrc,
    monsterFamiliesByMarkerId: getMonsterFamiliesByMarkerId(selectedRegionFamilies),
    panelRegion,
    pendingTravelDestination: pendingTravelRegionId ? mapTravelDestinations[pendingTravelRegionId] : null,
    resetKey: `${selectedRegionId ?? "world"}:${selectedTown?.id ?? "region"}`,
    selectRegion,
    selectedRegion,
    selectedRegionMarkers,
    selectedTown,
    selectedTownLocation,
    selectedTownLocations: selectedTown?.townMapId ? townMapLocations[selectedTown.townMapId] : [],
    setActiveRegionId,
    setPendingTravelRegionId,
    setSelectedTown,
    setSelectedTownLocation,
    travel
  };
}
