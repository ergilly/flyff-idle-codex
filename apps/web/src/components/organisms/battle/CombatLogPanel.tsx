import { Button } from "@/components/atoms/Button";
import { MutedText } from "@/components/atoms/MutedText";
import { Panel } from "@/components/atoms/Panel";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import { type BattleLogEntry } from "@/lib/battle/types";
import { cx } from "@/lib/classNames";

export function CombatLogPanel({
  battleLog,
  onClearBattleLog
}: {
  battleLog: BattleLogEntry[];
  onClearBattleLog: () => void;
}) {
  return (
    <Panel
      as="section"
      className="h-full min-h-0 gap-3 [grid-template-rows:auto_minmax(0,1fr)]"
      data-testid="battle_panel_monster_loot_box"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeading eyebrow="Combat Log" testId="battle_heading_monster_loot_box" />
        <Button
          className="min-h-9 px-3 text-sm"
          data-testid="battle_button_clear_combat_log"
          disabled={battleLog.length === 0}
          onClick={onClearBattleLog}
          type="button"
          variant="secondary"
        >
          Clear
        </Button>
      </div>
      <div
        className="grid min-h-0 overflow-y-auto rounded-control border border-dashed border-[rgba(138,116,65,0.62)] bg-black/24 p-3 pr-2 [scrollbar-color:rgba(245,212,81,0.55)_rgba(0,0,0,0.28)] [scrollbar-width:thin]"
        data-testid="battle_div_monster_loot_box_inventory"
      >
        {battleLog.length > 0 ? (
          <ol className="grid content-start gap-1.5 text-sm font-bold" data-testid="battle_list_combat_log">
            {battleLog.map((entry) => (
              <li
                className={cx(
                  "rounded-[4px] border border-transparent bg-black/18 px-2 py-1",
                  entry.tone === "danger"
                    ? "text-[#ff9b86]"
                    : entry.tone === "success"
                      ? "text-[#94e6a7]"
                      : "text-text-muted"
                )}
                data-testid={`battle_li_combat_log_${entry.id}`}
                key={entry.id}
              >
                {entry.message}
              </li>
            ))}
          </ol>
        ) : (
          <div className="grid place-items-center">
            <MutedText data-testid="battle_p_monster_loot_box_empty">No combat actions yet.</MutedText>
          </div>
        )}
      </div>
    </Panel>
  );
}
