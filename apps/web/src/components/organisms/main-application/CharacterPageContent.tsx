import { Panel } from "@/components/atoms/Panel";
import { StatRow } from "@/components/atoms/StatRow";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import { CharacterEquipmentPanel } from "@/components/molecules/main-application/CharacterEquipmentPanel";
import { CharacterSkillsPanel } from "@/components/molecules/main-application/CharacterSkillsPanel";
import { StatAllocationPanel, type StatKey } from "@/components/molecules/main-application/StatAllocationPanel";
import type { ReactNode } from "react";
import type { Character, ItemMetadata } from "@/lib/api";

type DetailStat = {
  label: string;
  value: number | string;
};

type CharacterPageContentProps = {
  appliedStats: Record<StatKey, number>;
  availableSkillPoints: number;
  availableStatPoints: number;
  character: Character;
  detailStats: DetailStat[];
  itemsById: Record<string, ItemMetadata>;
  onAddStat: (stat: StatKey) => void;
  onApplySkills: () => void;
  onApplyStats: () => void;
  onRemoveStat: (stat: StatKey) => void;
  onResetSkills: () => void;
  onResetStats: () => void;
  onSelectEquipmentItem: (itemId: string) => void;
  pendingSkillPoints: number;
  pendingStats: Record<StatKey, number>;
  selectedEquipmentItemId: string | null;
  statKeys: StatKey[];
};

export function CharacterPageContent({
  appliedStats,
  availableSkillPoints,
  availableStatPoints,
  character,
  detailStats,
  itemsById,
  onAddStat,
  onApplySkills,
  onApplyStats,
  onRemoveStat,
  onResetSkills,
  onResetStats,
  onSelectEquipmentItem,
  pendingSkillPoints,
  pendingStats,
  selectedEquipmentItemId,
  statKeys
}: CharacterPageContentProps) {
  return (
    <div className="grid gap-[18px]">
      <CharacterPageWorkspace>
        <CharacterInfoGrid>
          <Panel className="[&_strong]:text-base" style={{ alignContent: "start" }}>
            <SectionHeading eyebrow="Info" title="Character Stats" />
            <CharacterInfoSection>
              <StatRow label="Name" value={character.name} />
              <StatRow label="Job" value={character.job} />
              <StatRow label="Level" value={character.level} />
            </CharacterInfoSection>
            <CharacterInfoSection>
              {detailStats.map((stat) => (
                <StatRow key={stat.label} label={stat.label} value={stat.value} />
              ))}
            </CharacterInfoSection>
          </Panel>

          <StatAllocationPanel
            appliedStats={appliedStats}
            availableStatPoints={availableStatPoints}
            character={character}
            onAddStat={onAddStat}
            onApplyStats={onApplyStats}
            onRemoveStat={onRemoveStat}
            onResetStats={onResetStats}
            pendingStats={pendingStats}
            statKeys={statKeys}
          />
        </CharacterInfoGrid>

        <CharacterEquipmentPanel
          character={character}
          itemsById={itemsById}
          onSelectEquipmentItem={onSelectEquipmentItem}
          selectedEquipmentItemId={selectedEquipmentItemId}
        />
      </CharacterPageWorkspace>

      <CharacterSkillsPanel
        availableSkillPoints={availableSkillPoints}
        onApplySkills={onApplySkills}
        onResetSkills={onResetSkills}
        pendingSkillPoints={pendingSkillPoints}
      />
    </div>
  );
}

function CharacterPageWorkspace({ children }: { children: ReactNode }) {
  return (
    <section className="grid grid-cols-[minmax(220px,300px)_minmax(0,1fr)] items-start gap-4 max-[1100px]:grid-cols-1">
      {children}
    </section>
  );
}

function CharacterInfoGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3.5 max-[1100px]:grid-cols-3 max-[920px]:grid-cols-2 max-[560px]:grid-cols-1">{children}</div>;
}

function CharacterInfoSection({ children }: { children: ReactNode }) {
  return <div className="grid gap-1.5 border-b border-border pb-2.5 last:border-b-0 last:pb-0">{children}</div>;
}
