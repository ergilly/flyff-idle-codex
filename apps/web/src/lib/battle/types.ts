import {
  type Character,
  type CharacterConsumableResource,
  type ItemMetadata,
  type MapMonsterFamily
} from "@/lib/api";
import { type SkillDefinition, type SkillTreeTab } from "@/lib/skillTrees";

export type ActionSlot = SkillDefinition | null;
export type ConsumableResource = CharacterConsumableResource;

export type RecoveryInventoryItem = {
  inventoryItem: Character["inventory"]["items"][number];
  item: ItemMetadata;
  recoverAmount: number | null;
};

export type CharacterResourceState = {
  fp: number;
  hp: number;
  mp: number;
};

export type ConsumableCooldownState = Record<ConsumableResource, number>;
export type CharacterPanelTab = "equipment" | "skills";
export type BattleOutcome = "fighting" | "playerDefeated" | "monsterDefeated";

export type BattleLogEntry = {
  id: number;
  message: string;
  tone: "danger" | "muted" | "success";
};

export type BattleDroppedItem = {
  itemId: string;
  quantity: number;
};

export type BattlePersistenceState = {
  droppedItems: BattleDroppedItem[];
  log: BattleLogEntry[];
};

export type BattleState = {
  characterFp: number;
  characterHp: number;
  characterMp: number;
  droppedItems: BattleDroppedItem[];
  earnedPenya: number;
  log: BattleLogEntry[];
  monsterDefeatCount: number;
  monsterHp: number | null;
  outcome: BattleOutcome;
  playerDefeatCount: number;
};

export type BattlePageProps = {
  character: Character;
  initialBattleState?: BattlePersistenceState;
  initialCharacterResources?: CharacterResourceState;
  itemsById: Record<string, ItemMetadata>;
  onBattleStateChange?: (state: BattlePersistenceState) => void;
  onClearMonsterTarget?: () => void;
  onCharacterResourcesChange?: (resources: CharacterResourceState) => void;
  onConsumeInventoryItem?: (resource: ConsumableResource) => Promise<void> | void;
  onEquipConsumableItem?: (resource: ConsumableResource, slotIndex: number | null) => void;
  onLootInventoryItems?: (items: BattleDroppedItem[]) => Promise<void> | void;
  onUpdateCharacterProgression?: (progression: {
    exp?: number;
    level?: number;
    penya?: number;
  }) => Promise<void> | void;
  selectedMonsterFamily: MapMonsterFamily | null;
  skillTabs: SkillTreeTab[];
};
