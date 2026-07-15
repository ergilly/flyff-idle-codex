import { InfoRow } from "@/components/atoms/battle/CombatInfoRow";
import { Panel } from "@/components/atoms/Panel";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import { type CombatStat } from "@/lib/combatStats";
import { getTestIdSegment } from "@/lib/testIds";

export function CharacterStatsPanel({ combatStats }: { combatStats: CombatStat[] }) {
  const statsByLabel = new Map(combatStats.map((stat) => [stat.label, stat]));
  const statGroups = [
    {
      title: "Attributes",
      labels: ["STR", "STA", "DEX", "INT"]
    },
    {
      title: "Resources",
      labels: ["Max HP", "Max MP", "Max FP"]
    },
    {
      title: "Offense",
      labels: ["Attack", "Magic Attack", "PvE Damage", "Critical Chance", "Critical Damage"]
    },
    {
      title: "Speed & Accuracy",
      labels: ["Attack Speed", "DCT", "Hit Rate"]
    },
    {
      title: "Defense",
      labels: ["Defense", "Magic DEF", "Critical Resist", "Melee Block", "Ranged Block", "Parry"]
    },
    {
      title: "Recovery",
      labels: ["Reflect Damage", "HP Recovery After Kill", "MP Recovery After Kill"]
    }
  ].map((group) => ({
    ...group,
    stats: group.labels
      .map((label) => statsByLabel.get(label))
      .filter((stat): stat is CombatStat => Boolean(stat))
  }));

  return (
    <Panel as="section" className="min-w-0 content-start gap-4" data-testid="battle_panel_character_stats">
      <SectionHeading eyebrow="Character" testId="battle_heading_character_stats" />
      <div
        className="grid gap-2 text-sm font-bold min-[520px]:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2"
        data-testid="battle_div_character_stats"
      >
        {statGroups.map((group) =>
          group.stats.length > 0 ? (
            <div
              className="grid content-start gap-1.5 rounded-control border border-[rgba(138,116,65,0.58)] bg-black/24 p-2.5"
              data-testid={`battle_div_character_stats_group_${getTestIdSegment(group.title)}`}
              key={group.title}
            >
              <h3
                className="text-[0.68rem] font-black uppercase tracking-wide text-text-muted"
                data-testid={`battle_heading_character_stats_group_${getTestIdSegment(group.title)}`}
              >
                {group.title}
              </h3>
              <div
                className="grid gap-1.5"
                data-testid={`battle_div_character_stats_group_rows_${getTestIdSegment(group.title)}`}
              >
                {group.stats.map((stat) => (
                  <InfoRow key={stat.label} label={stat.label} value={stat.value} />
                ))}
              </div>
            </div>
          ) : null
        )}
      </div>
    </Panel>
  );
}
