import { Button } from "@/components/atoms/Button";
import { MutedText } from "@/components/atoms/MutedText";
import { Panel } from "@/components/atoms/Panel";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import { TownInteractionPanel } from "@/components/organisms/map/TownInteractionPanel";
import type { useMapNavigation } from "@/hooks/map/useMapNavigation";
import type { Bank, CharacterInventory, ItemMetadata } from "@/lib/api/types";
import { cx } from "@/lib/classNames";
import { mapRegions } from "@/lib/mapRegions";
import { getTestIdSegment } from "@/lib/testIds";
import type { TownMapId } from "@/lib/townMapLocations";

type MapSidePanelProps = {
  activeQuestIds?: number[];
  completedQuestIds?: number[];
  characterInventory?: CharacterInventory;
  characterJob?: string;
  characterLevel?: number;
  characterPenya?: number;
  characterSex?: "female" | "male";
  itemsById?: Record<string, ItemMetadata>;
  navigation: ReturnType<typeof useMapNavigation>;
  onAcceptQuest?: (npcId: number, questId: number) => Promise<void>;
  onCompleteQuest?: (npcId: number, questId: number) => Promise<void>;
  onBuyShopItem?: (
    townMapId: TownMapId,
    locationId: string,
    itemId: string,
    quantity: number
  ) => Promise<void>;
  onLoadBank?: () => Promise<Bank>;
  onSellShopItem?: (slotIndex: number, quantity: number) => Promise<void>;
  onTransferAllBankItems?: (direction: "deposit" | "withdraw") => Promise<Bank>;
  onTransferBankItem?: (direction: "deposit" | "withdraw", slotIndex: number) => Promise<Bank>;
  onTransferBankPenya?: (direction: "deposit" | "withdraw", amount: number | "all") => Promise<Bank>;
};

export function MapSidePanel({ navigation, ...props }: MapSidePanelProps) {
  return (
    <Panel
      as="aside"
      className="h-full min-h-0 min-w-0 max-w-full content-start gap-4 overflow-x-hidden overflow-y-auto"
      data-testid="map_panel_regions"
    >
      <div className="flex items-start justify-between gap-3" data-testid="map_div_region_header">
        <SectionHeading
          eyebrow={
            navigation.selectedTown ? "Town Map" : navigation.selectedRegion ? "Region Map" : "World Map"
          }
          testId="map_heading_region"
          title={navigation.selectedTown?.label ?? navigation.panelRegion?.label ?? "Select a region"}
        />
        {navigation.selectedRegion ? (
          <Button
            type="button"
            data-testid={navigation.selectedTown ? "map_button_back_to_region" : "map_button_back_to_world"}
            variant="secondary"
            className="min-h-10 shrink-0 px-3"
            onClick={() =>
              navigation.selectedTown ? navigation.setSelectedTown(null) : navigation.backToWorld()
            }
          >
            {navigation.selectedTown ? "Back to region" : "Back to world"}
          </Button>
        ) : null}
      </div>
      <MutedText data-testid="map_p_region_description">
        {navigation.selectedTown
          ? navigation.selectedTown.description
          : navigation.panelRegion
            ? navigation.panelRegion.description
            : "Hover over a region to preview its highlighted world location, then select it to open the region map."}
      </MutedText>
      {navigation.selectedTown?.townMapId ? (
        <TownInteractionPanel
          activeQuestIds={props.activeQuestIds}
          completedQuestIds={props.completedQuestIds}
          characterLevel={props.characterLevel}
          characterJob={props.characterJob}
          characterInventory={props.characterInventory}
          characterPenya={props.characterPenya}
          characterSex={props.characterSex}
          itemsById={props.itemsById}
          location={navigation.selectedTownLocation}
          onAcceptQuest={props.onAcceptQuest}
          onCompleteQuest={props.onCompleteQuest}
          onBuyItem={props.onBuyShopItem}
          onLoadBank={props.onLoadBank}
          onSellItem={props.onSellShopItem}
          onTransferAllBankItems={props.onTransferAllBankItems}
          onTransferBankItem={props.onTransferBankItem}
          onTransferBankPenya={props.onTransferBankPenya}
          townMapId={navigation.selectedTown.townMapId}
        />
      ) : (
        <RegionList navigation={navigation} />
      )}
    </Panel>
  );
}

function RegionList({ navigation }: { navigation: ReturnType<typeof useMapNavigation> }) {
  return (
    <div className="grid gap-2" data-testid="map_div_region_list">
      {mapRegions.map((region) => (
        <button
          key={region.id}
          data-testid={`map_button_region_list_${getTestIdSegment(region.id)}`}
          className={cx(
            "min-h-10 rounded-control border-2 px-3 text-left text-sm font-extrabold transition-colors",
            navigation.panelRegion?.id === region.id
              ? "border-primary bg-panel-muted text-foreground"
              : "border-border bg-transparent text-text-muted hover:border-primary hover:text-foreground"
          )}
          onClick={() => navigation.selectRegion(region.id)}
          onFocus={() => navigation.setActiveRegionId(region.id)}
          onMouseEnter={() => navigation.setActiveRegionId(region.id)}
          type="button"
        >
          {region.label}
        </button>
      ))}
    </div>
  );
}
