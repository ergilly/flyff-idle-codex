import { Panel } from "@/components/atoms/Panel";
import { StatLabel } from "@/components/atoms/StatRow";
import type { Character } from "@/lib/api";

type DashboardStatsGridProps = {
  character: Character;
};

export function DashboardStatsGrid({ character }: DashboardStatsGridProps) {
  return (
    <div
      className="grid grid-cols-4 gap-3.5 max-[920px]:grid-cols-2 max-[560px]:grid-cols-1"
      data-testid="dashboard_div_stats_grid"
    >
      <Panel data-testid="dashboard_panel_stat_str">
        <StatLabel data-testid="dashboard_span_stat_label_str">STR</StatLabel>
        <strong data-testid="dashboard_strong_stat_value_str">{character.stats.str}</strong>
      </Panel>
      <Panel data-testid="dashboard_panel_stat_sta">
        <StatLabel data-testid="dashboard_span_stat_label_sta">STA</StatLabel>
        <strong data-testid="dashboard_strong_stat_value_sta">{character.stats.sta}</strong>
      </Panel>
      <Panel data-testid="dashboard_panel_stat_dex">
        <StatLabel data-testid="dashboard_span_stat_label_dex">DEX</StatLabel>
        <strong data-testid="dashboard_strong_stat_value_dex">{character.stats.dex}</strong>
      </Panel>
      <Panel data-testid="dashboard_panel_stat_int">
        <StatLabel data-testid="dashboard_span_stat_label_int">INT</StatLabel>
        <strong data-testid="dashboard_strong_stat_value_int">{character.stats.int}</strong>
      </Panel>
    </div>
  );
}
