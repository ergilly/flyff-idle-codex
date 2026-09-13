import { Panel } from "@/components/atoms/Panel";
import { StatRow } from "@/components/atoms/StatRow";
import { CharacterInfoSection } from "@/components/molecules/main-application/CharacterInfoSection";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import { CharacterEquipmentPanel } from "@/components/organisms/main-application/CharacterEquipmentPanel";
import { CharacterSkillsPanel } from "@/components/organisms/main-application/CharacterSkillsPanel";
import {
  StatAllocationContent,
  type StatKey
} from "@/components/molecules/main-application/StatAllocationPanel";
import type { ReactNode } from "react";
import type { Character, CharacterEquipmentSlot, ItemMetadata } from "@/lib/api";
import type { SkillDefinition, SkillTreeTab } from "@/lib/skillTrees";
import { getTestIdSegment } from "@/lib/testIds";

type DetailStat = {
  label: string;
  value: number | string;
};

type CharacterPageContentProps = {
  activeEquipmentSet: number;
  appliedStats: Record<StatKey, number>;
  availableSkillPoints: number;
  availableStatPoints: number;
  character: Character;
  detailStats: DetailStat[];
  itemsById: Record<string, ItemMetadata>;
  onAddStat: (stat: StatKey) => void;
  onAddSkillLevel: (skill: SkillDefinition) => void;
  onApplySkills: () => void;
  onCanRemoveSkillLevel: (skill: SkillDefinition) => boolean;
  onApplyStats: () => void;
  onClearStat: (stat: StatKey) => void;
  onEquipmentSetChange: (equipmentSet: number) => void;
  onMaxStat: (stat: StatKey) => void;
  onUnequipEquipmentSlot?: (equipmentSlot: keyof Character["equipment"], equipmentSet: number) => void;
  onRemoveSkillLevel: (skill: SkillDefinition) => void;
  onRemoveStat: (stat: StatKey) => void;
  onResetSkills: () => void;
  onResetStats: () => void;
  onSelectEquipmentSlot: (slot: CharacterEquipmentSlot) => void;
  onSetStat: (stat: StatKey, value: number) => void;
  equipmentActionError?: string;
  isEquipmentActionPending?: boolean;
  pendingSkillLevels: Character["skillLevels"];
  pendingStats: Record<StatKey, number>;
  selectedEquipmentSlot: CharacterEquipmentSlot | null;
  skillTabs: SkillTreeTab[];
  statKeys: StatKey[];
};

export function CharacterPageContent({
  activeEquipmentSet,
  appliedStats,
  availableSkillPoints,
  availableStatPoints,
  character,
  detailStats,
  itemsById,
  onAddStat,
  onAddSkillLevel,
  onApplySkills,
  onCanRemoveSkillLevel,
  onApplyStats,
  onClearStat,
  onEquipmentSetChange,
  onMaxStat,
  onUnequipEquipmentSlot,
  onRemoveSkillLevel,
  onRemoveStat,
  onResetSkills,
  onResetStats,
  onSelectEquipmentSlot,
  onSetStat,
  equipmentActionError = "",
  isEquipmentActionPending = false,
  pendingSkillLevels,
  pendingStats,
  selectedEquipmentSlot,
  skillTabs,
  statKeys
}: CharacterPageContentProps) {
  return (
    <div className="grid h-full min-h-0 gap-[18px] max-[1800px]:h-auto" data-testid="character_div_page">
      <CharacterPageWorkspace>
        <Panel className="h-full content-start gap-4 [&_strong]:text-base" data-testid="character_panel_info">
          <SectionHeading eyebrow="Combat snapshot" testId="character_heading_info" />
          <CharacterInfoSection>
            {detailStats.map((stat) => (
              <StatRow
                data-testid={`character_stat_detail_${getTestIdSegment(stat.label)}`}
                key={stat.label}
                label={stat.label}
                value={stat.value}
              />
            ))}
          </CharacterInfoSection>
          <div className="grid gap-2.5 border-t-2 border-border pt-4" data-testid="character_div_stats">
            <StatAllocationContent
              appliedStats={appliedStats}
              availableStatPoints={availableStatPoints}
              character={character}
              onAddStat={onAddStat}
              onApplyStats={onApplyStats}
              onClearStat={onClearStat}
              onMaxStat={onMaxStat}
              onRemoveStat={onRemoveStat}
              onResetStats={onResetStats}
              onSetStat={onSetStat}
              pendingStats={pendingStats}
              statKeys={statKeys}
            />
          </div>
        </Panel>

        <div
          className="grid min-w-0 content-start gap-4 min-[640px]:grid-cols-2"
          data-testid="character_div_setup_column"
        >
          <div className="min-w-0" data-testid="character_div_equipment_column">
            <CharacterEquipmentPanel
              actionError={equipmentActionError}
              activeEquipmentSet={activeEquipmentSet}
              character={character}
              isActionPending={isEquipmentActionPending}
              itemsById={itemsById}
              onEquipmentSetChange={onEquipmentSetChange}
              onUnequipEquipmentSlot={onUnequipEquipmentSlot}
              onSelectEquipmentSlot={onSelectEquipmentSlot}
              selectedEquipmentSlot={selectedEquipmentSlot}
            />
          </div>
          <div className="min-w-0" data-testid="character_div_skills_row">
            <CharacterSkillsPanel
              availableSkillPoints={availableSkillPoints}
              character={character}
              onAddSkillLevel={onAddSkillLevel}
              onApplySkills={onApplySkills}
              onCanRemoveSkillLevel={onCanRemoveSkillLevel}
              onRemoveSkillLevel={onRemoveSkillLevel}
              onResetSkills={onResetSkills}
              pendingSkillLevels={pendingSkillLevels}
              skillTabs={skillTabs}
            />
          </div>
        </div>
      </CharacterPageWorkspace>
    </div>
  );
}

function CharacterPageWorkspace({ children }: { children: ReactNode }) {
  return (
    <section
      className="grid h-full min-h-0 items-start gap-4 min-[640px]:grid-cols-[minmax(240px,320px)_minmax(0,1fr)] max-[640px]:h-auto"
      data-testid="character_section_workspace"
    >
      {children}
    </section>
  );
}
