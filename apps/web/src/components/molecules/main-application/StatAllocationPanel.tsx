import { Minus, Plus } from "lucide-react";
import { Actions } from "@/components/atoms/Actions";
import { Button } from "@/components/atoms/Button";
import { AllocationButton } from "@/components/atoms/main-application/AllocationButton";
import { Panel } from "@/components/atoms/Panel";
import { StatLabel } from "@/components/atoms/StatRow";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import { PointsSummary } from "@/components/molecules/main-application/ContentHeading";
import type { ReactNode } from "react";
import type { Character } from "@/lib/api";

export type StatKey = "str" | "sta" | "dex" | "int";

type StatAllocationPanelProps = {
  appliedStats: Record<StatKey, number>;
  availableStatPoints: number;
  character: Character;
  onAddStat: (stat: StatKey) => void;
  onApplyStats: () => void;
  onRemoveStat: (stat: StatKey) => void;
  onResetStats: () => void;
  pendingStats: Record<StatKey, number>;
  statKeys: StatKey[];
};

export function StatAllocationPanel({
  appliedStats,
  availableStatPoints,
  character,
  onAddStat,
  onApplyStats,
  onRemoveStat,
  onResetStats,
  pendingStats,
  statKeys
}: StatAllocationPanelProps) {
  const hasPendingStats = statKeys.some((stat) => pendingStats[stat] > 0);

  return (
    <Panel className="[&_strong]:text-base" style={{ alignContent: "start" }}>
      <SectionHeading eyebrow="Stats" title="Point Allocation" />
      {statKeys.map((stat) => (
        <AllocationRow key={stat}>
          <AllocationStatValue>
            <StatLabel>{stat.toUpperCase()}</StatLabel>
            <strong>{character.stats[stat] + appliedStats[stat] + pendingStats[stat]}</strong>
          </AllocationStatValue>
          <AllocationControls>
            <AllocationButton
              type="button"
              aria-label={`Remove pending ${stat.toUpperCase()} point`}
              onClick={() => onRemoveStat(stat)}
              disabled={pendingStats[stat] === 0}
            >
              <Minus aria-hidden="true" size={14} />
            </AllocationButton>
            <span>{pendingStats[stat]}</span>
            <AllocationButton
              type="button"
              aria-label={`Add ${stat.toUpperCase()} point`}
              onClick={() => onAddStat(stat)}
              disabled={availableStatPoints === 0}
            >
              <Plus aria-hidden="true" size={14} />
            </AllocationButton>
          </AllocationControls>
        </AllocationRow>
      ))}
      <PointsSummary>
        <span>Available stat points</span>
        <strong>{availableStatPoints}</strong>
      </PointsSummary>
      <Actions gap={10}>
        <Button type="button" onClick={onApplyStats} disabled={!hasPendingStats}>
          Apply
        </Button>
        <Button variant="secondary" type="button" onClick={onResetStats} disabled={!hasPendingStats}>
          Reset
        </Button>
      </Actions>
    </Panel>
  );
}

function AllocationRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-control border border-border bg-panel-muted px-2.5 py-2 [&_strong]:text-[1rem]">
      {children}
    </div>
  );
}

function AllocationStatValue({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 items-baseline gap-2">{children}</div>;
}

function AllocationControls({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[28px_minmax(18px,1fr)_28px] items-center gap-1 [&_span]:text-center [&_span]:text-sm [&_span]:font-extrabold [&_span]:text-text-muted">
      {children}
    </div>
  );
}
