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
  onClearStat: (stat: StatKey) => void;
  onMaxStat: (stat: StatKey) => void;
  onRemoveStat: (stat: StatKey) => void;
  onResetStats: () => void;
  onSetStat: (stat: StatKey, value: number) => void;
  pendingStats: Record<StatKey, number>;
  statKeys: StatKey[];
};

export function StatAllocationContent({
  appliedStats,
  availableStatPoints,
  character,
  onAddStat,
  onApplyStats,
  onClearStat,
  onMaxStat,
  onRemoveStat,
  onResetStats,
  onSetStat,
  pendingStats,
  statKeys
}: StatAllocationPanelProps) {
  const hasPendingStats = statKeys.some((stat) => pendingStats[stat] > 0);

  return (
    <>
      <SectionHeading eyebrow="Stats" testId="character_stats_heading" />
      {statKeys.map((stat) => (
        <AllocationRow key={stat} testId={`character_stats_div_row_${stat}`}>
          <AllocationStatValue>
            <StatLabel data-testid={`character_stats_span_label_${stat}`}>{stat.toUpperCase()}</StatLabel>
            <strong data-testid={`character_stats_strong_value_${stat}`}>
              {character.stats[stat] + appliedStats[stat] + pendingStats[stat]}
            </strong>
          </AllocationStatValue>
          <AllocationControls>
            <AllocationButton
              type="button"
              className="w-9 text-[0.75rem] font-extrabold"
              data-testid={`character_stats_button_clear_${stat}`}
              aria-label={`Remove all pending ${stat.toUpperCase()} points`}
              onClick={() => onClearStat(stat)}
              disabled={pendingStats[stat] === 0}
            >
              --
            </AllocationButton>
            <AllocationButton
              type="button"
              data-testid={`character_stats_button_remove_${stat}`}
              aria-label={`Remove pending ${stat.toUpperCase()} point`}
              onClick={() => onRemoveStat(stat)}
              disabled={pendingStats[stat] === 0}
            >
              <Minus aria-hidden="true" size={14} />
            </AllocationButton>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={pendingStats[stat] + availableStatPoints}
              className="h-7 w-12 rounded-control border-2 border-border bg-[rgba(9,9,7,0.96)] px-1 text-center text-sm font-extrabold text-text-muted shadow-[inset_0_0_0_1px_rgba(255,225,115,0.1)] [appearance:textfield] focus:border-primary focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              data-testid={`character_stats_input_pending_${stat}`}
              aria-label={`Pending ${stat.toUpperCase()} points`}
              value={pendingStats[stat]}
              onChange={(event) => onSetStat(stat, Number(event.target.value))}
            />
            <AllocationButton
              type="button"
              data-testid={`character_stats_button_add_${stat}`}
              aria-label={`Add ${stat.toUpperCase()} point`}
              onClick={() => onAddStat(stat)}
              disabled={availableStatPoints === 0}
            >
              <Plus aria-hidden="true" size={14} />
            </AllocationButton>
            <AllocationButton
              type="button"
              className="w-9 text-[0.75rem] font-extrabold"
              data-testid={`character_stats_button_max_${stat}`}
              aria-label={`Assign all available points to ${stat.toUpperCase()}`}
              onClick={() => onMaxStat(stat)}
              disabled={availableStatPoints === 0}
            >
              ++
            </AllocationButton>
          </AllocationControls>
        </AllocationRow>
      ))}
      <PointsSummary testId="character_stats_div_points_summary">
        <span data-testid="character_stats_span_available_label">Available stat points</span>
        <strong data-testid="character_stats_strong_available_value">{availableStatPoints}</strong>
      </PointsSummary>
      <Actions gap={10}>
        <Button
          data-testid="character_stats_button_apply"
          type="button"
          onClick={onApplyStats}
          disabled={!hasPendingStats}
        >
          Apply
        </Button>
        <Button
          data-testid="character_stats_button_reset"
          variant="secondary"
          type="button"
          onClick={onResetStats}
          disabled={!hasPendingStats}
        >
          Reset
        </Button>
      </Actions>
    </>
  );
}

export function StatAllocationPanel(props: StatAllocationPanelProps) {
  return (
    <Panel
      className="[&_strong]:text-base"
      data-testid="character_stats_panel"
      style={{ alignContent: "start" }}
    >
      <StatAllocationContent {...props} />
    </Panel>
  );
}

function AllocationRow({ children, testId }: { children: ReactNode; testId?: string }) {
  return (
    <div
      className="flex items-center justify-between gap-2 rounded-control border-2 border-border bg-[linear-gradient(180deg,rgba(31,29,22,0.92),rgba(9,9,7,0.96))] px-2.5 py-2 shadow-[inset_0_0_0_1px_rgba(255,225,115,0.1)] [&_strong]:text-[1rem]"
      data-testid={testId}
    >
      {children}
    </div>
  );
}

function AllocationStatValue({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 items-baseline gap-2">{children}</div>;
}

function AllocationControls({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[36px_28px_48px_28px_36px] items-center gap-1">{children}</div>;
}
