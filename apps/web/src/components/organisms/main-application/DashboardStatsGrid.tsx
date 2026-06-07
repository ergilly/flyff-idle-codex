import { Panel } from "@/components/atoms/Panel";
import { StatLabel } from "@/components/atoms/StatRow";
import type { Character } from "@/lib/api";

type DashboardStatsGridProps = {
  character: Character;
};

export function DashboardStatsGrid({ character }: DashboardStatsGridProps) {
  return (
    <div className="grid grid-cols-4 gap-3.5 max-[920px]:grid-cols-2 max-[560px]:grid-cols-1">
      <Panel>
        <StatLabel>STR</StatLabel>
        <strong>{character.stats.str}</strong>
      </Panel>
      <Panel>
        <StatLabel>STA</StatLabel>
        <strong>{character.stats.sta}</strong>
      </Panel>
      <Panel>
        <StatLabel>DEX</StatLabel>
        <strong>{character.stats.dex}</strong>
      </Panel>
      <Panel>
        <StatLabel>INT</StatLabel>
        <strong>{character.stats.int}</strong>
      </Panel>
    </div>
  );
}
