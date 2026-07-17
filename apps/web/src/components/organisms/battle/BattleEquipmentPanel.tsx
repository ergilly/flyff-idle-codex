import { CharacterEquipmentPanel } from "@/components/organisms/main-application/CharacterEquipmentPanel";
import { type Character, type CharacterEquipmentSlot, type ItemMetadata } from "@/lib/api";

type BattleEquipmentPanelProps = {
  activeEquipmentSet: number;
  character: Character;
  itemsById: Record<string, ItemMetadata>;
  onSelectEquipmentSlot: (slot: CharacterEquipmentSlot) => void;
  onSelectEquipmentSet: (setIndex: number) => void;
  selectedEquipmentSlot: CharacterEquipmentSlot | null;
};

export function BattleEquipmentPanel({
  activeEquipmentSet,
  character,
  itemsById,
  onSelectEquipmentSlot,
  onSelectEquipmentSet,
  selectedEquipmentSlot
}: BattleEquipmentPanelProps) {
  return (
    <CharacterEquipmentPanel
      activeEquipmentSet={activeEquipmentSet}
      character={character}
      itemsById={itemsById}
      onEquipmentSetChange={onSelectEquipmentSet}
      onSelectEquipmentSlot={onSelectEquipmentSlot}
      selectedEquipmentSlot={selectedEquipmentSlot}
      showItemDetails={false}
      variant="embedded"
    />
  );
}
