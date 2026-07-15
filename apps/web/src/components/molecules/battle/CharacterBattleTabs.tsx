import { Panel } from "@/components/atoms/Panel";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import { type CharacterPanelTab } from "@/lib/battle/types";
import { cx } from "@/lib/classNames";
import { getTestIdSegment } from "@/lib/testIds";

export function CharacterBattleTabs({
  activeTab,
  onTabChange
}: {
  activeTab: CharacterPanelTab;
  onTabChange: (tab: CharacterPanelTab) => void;
}) {
  return (
    <Panel as="section" className="min-w-0 content-start gap-3" data-testid="battle_panel_character_menu">
      <SectionHeading eyebrow="Loadout" testId="battle_heading_character_menu" />
      <div
        className="grid grid-cols-2 gap-1 rounded-control border border-border bg-black/35 p-1"
        data-testid="battle_div_character_tabs"
      >
        {[
          { id: "equipment", label: "Equipment" },
          { id: "skills", label: "Skills" }
        ].map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              aria-pressed={isActive}
              data-testid={`battle_button_character_tab_${getTestIdSegment(tab.id)}`}
              className={cx(
                "min-h-9 rounded-[4px] px-2 text-sm font-black transition-colors",
                isActive
                  ? "bg-primary text-button-text"
                  : "text-text-muted hover:bg-panel-muted hover:text-foreground"
              )}
              key={tab.id}
              onClick={() => onTabChange(tab.id as CharacterPanelTab)}
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
