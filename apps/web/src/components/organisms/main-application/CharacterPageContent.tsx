import { Panel } from "@/components/atoms/Panel";
import { StatRow } from "@/components/atoms/StatRow";
import { CharacterInfoSection } from "@/components/molecules/main-application/CharacterInfoSection";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import { CharacterEquipmentPanel } from "@/components/molecules/main-application/CharacterEquipmentPanel";
import { CharacterSkillsPanel } from "@/components/molecules/main-application/CharacterSkillsPanel";
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
          <SectionHeading eyebrow="Info" testId="character_heading_info" />
          <CharacterInfoSection>
            <StatRow data-testid="character_stat_name" label="Name" value={character.name} />
            <StatRow data-testid="character_stat_job" label="Job" value={character.job} />
            <StatRow data-testid="character_stat_level" label="Level" value={character.level} />
          </CharacterInfoSection>
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
      </CharacterPageWorkspace>
    </div>
  );
}

function CharacterPageWorkspace({ children }: { children: ReactNode }) {
  return (
    <section
      className="grid h-full min-h-0 grid-cols-[minmax(240px,0.6fr)_minmax(600px,1.3fr)_minmax(580px,1fr)] items-stretch gap-4 max-[1800px]:h-auto max-[1800px]:grid-cols-1 max-[1800px]:items-start"
      data-testid="character_section_workspace"
    >
      {children}
    </section>
  );
}
