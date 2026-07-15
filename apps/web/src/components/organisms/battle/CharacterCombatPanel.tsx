import { Panel } from "@/components/atoms/Panel";
import { BattleEquipmentPanel } from "@/components/molecules/battle/BattleEquipmentPanel";
import { CharacterBattleTabs } from "@/components/molecules/battle/CharacterBattleTabs";
import { CharacterCombatHeader } from "@/components/molecules/battle/CharacterCombatHeader";
import { ActionWheel } from "@/components/organisms/battle/ActionWheel";
import { BattleSkillTrees } from "@/components/organisms/battle/BattleSkillTrees";
import { CharacterStatsPanel } from "@/components/organisms/battle/CharacterStatsPanel";
import { CombatLogPanel } from "@/components/organisms/battle/CombatLogPanel";
import { RecoveryPanel } from "@/components/organisms/battle/RecoveryPanel";
import { type Character, type CharacterEquipmentSlot, type ItemMetadata } from "@/lib/api";
import { emptyConsumableLoadout } from "@/lib/battle/recovery";
import {
  type ActionSlot,
  type BattleLogEntry,
  type CharacterPanelTab,
  type ConsumableCooldownState,
  type ConsumableResource,
  type RecoveryInventoryItem
} from "@/lib/battle/types";
import { type AttackTiming, type CombatStat } from "@/lib/combatStats";
import { type SkillDefinition, type SkillTreeTab } from "@/lib/skillTrees";

export function CharacterCombatPanel({
  actionSlots,
  activeEquipmentSet,
  activeTab,
  character,
  characterAttackTiming,
  characterFp,
  characterMaxFp,
  characterHp,
  characterMaxHp,
  characterMp,
  characterMaxMp,
  combatStats,
  cooldownRemainingByResource,
  battleLog,
  isCombatInProgress,
  itemsById,
  onMoveActionSlot,
  onRemoveActionSlot,
  onSelectActionSlot,
  onSelectEquipmentSlot,
  onSelectEquipmentSet,
  onTabChange,
  onAddSkillToActionSlot,
  onClearBattleLog,
  onEquipConsumableItem,
  onUseRecoveryItem,
  recoveryItemsByResource,
  selectedActionSlotIndex,
  selectedEquipmentSlot,
  onInsertSkillAtActionSlot,
  skillTabs,
  skills
}: {
  actionSlots: ActionSlot[];
  activeEquipmentSet: number;
  activeTab: CharacterPanelTab;
  character: Character;
  characterAttackTiming: AttackTiming;
  characterFp: number;
  characterMaxFp: number;
  characterHp: number;
  characterMaxHp: number;
  characterMp: number;
  characterMaxMp: number;
  combatStats: CombatStat[];
  cooldownRemainingByResource: ConsumableCooldownState;
  battleLog: BattleLogEntry[];
  isCombatInProgress: boolean;
  itemsById: Record<string, ItemMetadata>;
  onAddSkillToActionSlot: (skill: SkillDefinition) => void;
  onClearBattleLog: () => void;
  onEquipConsumableItem?: (resource: ConsumableResource, slotIndex: number | null) => void;
  onInsertSkillAtActionSlot: (skill: SkillDefinition, targetSlotIndex: number) => void;
  onMoveActionSlot: (sourceSlotIndex: number, targetSlotIndex: number) => void;
  onRemoveActionSlot: (slotIndex: number) => void;
  onSelectActionSlot: (slotIndex: number) => void;
  onSelectEquipmentSlot: (slot: CharacterEquipmentSlot) => void;
  onSelectEquipmentSet: (setIndex: number) => void;
  onTabChange: (tab: CharacterPanelTab) => void;
  onUseRecoveryItem: (resource: ConsumableResource, recoveryItem: RecoveryInventoryItem | null) => void;
  recoveryItemsByResource: Record<ConsumableResource, RecoveryInventoryItem[]>;
  selectedActionSlotIndex: number;
  selectedEquipmentSlot: CharacterEquipmentSlot | null;
  skillTabs: SkillTreeTab[];
  skills: SkillDefinition[];
}) {
  return (
    <Panel
      as="section"
      className="h-full min-h-0 gap-4 [grid-template-rows:auto_minmax(0,1fr)]"
      data-testid="battle_panel_character"
    >
      <CharacterCombatHeader
        attackTiming={characterAttackTiming}
        characterFp={characterFp}
        characterMaxFp={characterMaxFp}
        characterHp={characterHp}
        characterMaxHp={characterMaxHp}
        characterMp={characterMp}
        characterMaxMp={characterMaxMp}
        isCombatInProgress={isCombatInProgress}
      />
      <div className="grid min-h-0 items-stretch gap-4 lg:grid-cols-2">
        <div
          className="grid min-h-0 min-w-0 gap-4 [grid-template-rows:auto_auto_minmax(0,1fr)]"
          data-testid="battle_div_character_control_column"
        >
          <RecoveryPanel
            consumableLoadout={character.consumableLoadout ?? emptyConsumableLoadout}
            cooldownRemainingByResource={cooldownRemainingByResource}
            itemsById={itemsById}
            onEquipConsumableItem={onEquipConsumableItem}
            onUseRecoveryItem={onUseRecoveryItem}
            recoveryItemsByResource={recoveryItemsByResource}
          />
          <CharacterBattleTabs activeTab={activeTab} onTabChange={onTabChange} />
          <Panel
            as="section"
            className="h-full min-h-0 content-start gap-4 overflow-y-auto [&_[data-testid='equipment_div_content']]:justify-center [&_[data-testid='equipment_div_layout']]:!max-w-[190px]"
            data-testid="battle_panel_character_loadout"
          >
            {activeTab === "equipment" ? (
              <BattleEquipmentPanel
                activeEquipmentSet={activeEquipmentSet}
                character={character}
                itemsById={itemsById}
                onSelectEquipmentSlot={onSelectEquipmentSlot}
                onSelectEquipmentSet={onSelectEquipmentSet}
                selectedEquipmentSlot={selectedEquipmentSlot}
              />
            ) : (
              <div className="grid gap-4" data-testid="battle_div_skills_and_actions">
                <BattleSkillTrees
                  character={character}
                  onAddSkillToActionSlot={onAddSkillToActionSlot}
                  skillTabs={skillTabs}
                />
                <ActionWheel
                  actionSlots={actionSlots}
                  onAddSkillToActionSlot={onAddSkillToActionSlot}
                  onInsertSkillAtActionSlot={onInsertSkillAtActionSlot}
                  onMoveActionSlot={onMoveActionSlot}
                  onRemoveActionSlot={onRemoveActionSlot}
                  selectedActionSlotIndex={selectedActionSlotIndex}
                  onSelectActionSlot={onSelectActionSlot}
                  skills={skills}
                />
              </div>
            )}
          </Panel>
        </div>
        <div
          className="grid min-h-0 min-w-0 gap-4 [grid-template-rows:auto_minmax(0,1fr)]"
          data-testid="battle_div_character_stats_column"
        >
          <CharacterStatsPanel combatStats={combatStats} />
          <CombatLogPanel battleLog={battleLog} onClearBattleLog={onClearBattleLog} />
        </div>
      </div>
    </Panel>
  );
}
