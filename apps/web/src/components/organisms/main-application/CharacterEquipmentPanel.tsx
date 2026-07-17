import {
  EquipmentLayout,
  EquipmentPanelContent,
  EquipmentPanelFrame,
  EquipmentSetSelector,
  EquipmentSlot,
  EquipmentSlotIcon,
  EquipmentSlotLabel,
  EquipmentSlotValue,
  ModelViewerReserved,
  equipmentSlots
} from "@/components/molecules/main-application/EquipmentLayout";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import { ItemDetailsPanel } from "@/components/organisms/main-application/ItemDetailsPanel";
import { getItemIconUrl, type Character, type CharacterEquipmentSlot, type ItemMetadata } from "@/lib/api";
import { getCharacterEquipmentSet } from "@/lib/characterEquipment";
import { getTestIdSegment } from "@/lib/testIds";

export { getEquipmentItems, getEquippedItemIds } from "@/lib/characterEquipment";

type CharacterEquipmentPanelProps = {
  actionError?: string;
  activeEquipmentSet?: number;
  character: Character;
  isActionPending?: boolean;
  itemsById: Record<string, ItemMetadata>;
  onEquipmentSetChange?: (equipmentSet: number) => void;
  onUnequipEquipmentSlot?: (equipmentSlot: CharacterEquipmentSlot, equipmentSet: number) => void;
  onSelectEquipmentSlot: (slot: CharacterEquipmentSlot) => void;
  selectedEquipmentSlot: CharacterEquipmentSlot | null;
  showItemDetails?: boolean;
  showSetSelector?: boolean;
  variant?: "framed" | "embedded";
};

function getEquipmentValue(equipment: Character["equipment"], slot: keyof Character["equipment"]) {
  return equipment[slot] ?? "Empty";
}

export function CharacterEquipmentPanel({
  actionError = "",
  activeEquipmentSet = 0,
  character,
  isActionPending = false,
  itemsById,
  onEquipmentSetChange,
  onUnequipEquipmentSlot,
  onSelectEquipmentSlot,
  selectedEquipmentSlot,
  showItemDetails = true,
  showSetSelector = true,
  variant = "framed"
}: CharacterEquipmentPanelProps) {
  const equipment = getCharacterEquipmentSet(character, activeEquipmentSet);
  const activeEquipmentItemIds = Object.values(equipment).filter((itemId): itemId is string =>
    Boolean(itemId)
  );
  const selectedEquipmentSlotDefinition = equipmentSlots.find(({ slot }) => slot === selectedEquipmentSlot);
  const selectedEquipmentItemId = selectedEquipmentSlot ? equipment[selectedEquipmentSlot] : null;
  const selectedItem = selectedEquipmentItemId ? itemsById[selectedEquipmentItemId] : null;
  const mainhandItemId = equipment.mainhand;
  const mainhandItem = mainhandItemId ? itemsById[mainhandItemId] : null;
  const hasTwoHandedMainhand = mainhandItem?.category === "weapon" && mainhandItem.twoHanded === true;

  const content = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3" data-testid="equipment_div_header">
        <SectionHeading eyebrow="Equipment" testId="equipment_heading" />
        {showSetSelector ? (
          <EquipmentSetSelector
            activeEquipmentSet={activeEquipmentSet}
            onEquipmentSetChange={onEquipmentSetChange}
          />
        ) : null}
      </div>
      <EquipmentPanelContent showItemDetails={showItemDetails}>
        <EquipmentLayout aria-label="Character equipment slots">
          {equipmentSlots.map(({ frame, label, slot }) => {
            const isOffhandBlockedByTwoHander = slot === "offhand" && hasTwoHandedMainhand;
            const itemId = isOffhandBlockedByTwoHander ? mainhandItemId : equipment[slot];
            const selectableSlot = isOffhandBlockedByTwoHander ? "mainhand" : slot;
            const item = itemId ? itemsById[itemId] : null;
            const value = item?.name ?? getEquipmentValue(equipment, slot);
            const iconUrl = item?.icon ? getItemIconUrl(item.icon) : null;
            const isSelected = itemId !== null && selectableSlot === selectedEquipmentSlot;
            const slotLabel = isOffhandBlockedByTwoHander
              ? `${label}: ${value} occupies this slot`
              : `${label}: ${value}`;

            return (
              <EquipmentSlot
                $equipped={Boolean(itemId)}
                $frame={frame}
                $selected={isSelected}
                $twoHandedOccupied={isOffhandBlockedByTwoHander}
                key={slot}
                data-testid={`equipment_button_slot_${getTestIdSegment(slot)}`}
                type="button"
                aria-label={slotLabel}
                aria-pressed={isSelected}
                title={slotLabel}
                onClick={() => (itemId ? onSelectEquipmentSlot(selectableSlot) : undefined)}
                disabled={!itemId}
              >
                <EquipmentSlotLabel testId={`equipment_span_slot_label_${getTestIdSegment(slot)}`}>
                  {label}
                </EquipmentSlotLabel>
                {iconUrl ? (
                  <EquipmentSlotIcon src={iconUrl} alt={value} loading="lazy" />
                ) : (
                  <EquipmentSlotValue
                    $empty={!itemId}
                    testId={`equipment_strong_slot_value_${getTestIdSegment(slot)}`}
                  >
                    {value}
                  </EquipmentSlotValue>
                )}
              </EquipmentSlot>
            );
          })}
          <ModelViewerReserved aria-label={`${character.name} model preview`} />
        </EquipmentLayout>
        {showItemDetails ? (
          <ItemDetailsPanel
            actionDisabled={isActionPending}
            actionError={actionError}
            actionLabel={selectedEquipmentSlotDefinition ? "Unequip" : undefined}
            character={character}
            equippedItemIds={activeEquipmentItemIds}
            item={selectedItem}
            onAction={
              selectedEquipmentSlotDefinition && onUnequipEquipmentSlot
                ? () => onUnequipEquipmentSlot(selectedEquipmentSlotDefinition.slot, activeEquipmentSet)
                : undefined
            }
            slotLabel={selectedEquipmentSlotDefinition?.label ?? null}
          />
        ) : null}
      </EquipmentPanelContent>
    </>
  );

  if (variant === "embedded") {
    return <div className="grid content-start gap-4">{content}</div>;
  }

  return <EquipmentPanelFrame>{content}</EquipmentPanelFrame>;
}
