import { Panel } from "@/components/atoms/Panel";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import type { ActiveQuest } from "@/lib/api";
import { cx } from "@/lib/classNames";

type QuestLogNavigationProps = {
  activeQuests: ActiveQuest[];
  completedQuests: ActiveQuest[];
  onSelect: (questId: number) => void;
  selectedQuestId: number | null;
};

export function QuestLogNavigation({
  activeQuests,
  completedQuests,
  onSelect,
  selectedQuestId
}: QuestLogNavigationProps) {
  return (
    <Panel
      as="section"
      className="min-h-0 content-start overflow-hidden [grid-template-rows:auto_minmax(0,1fr)]"
    >
      <SectionHeading eyebrow="Quest Log" title={`${activeQuests.length} active`} />
      <div className="grid content-start gap-2 overflow-y-auto pr-1">
        <div className="grid gap-2" aria-label="Active quests">
          {activeQuests.map((quest) => (
            <QuestNavigationButton
              key={quest.id}
              onSelect={onSelect}
              quest={quest}
              selected={quest.id === selectedQuestId}
            />
          ))}
          {activeQuests.length === 0 ? <p className="text-sm text-text-muted">No active quests.</p> : null}
        </div>
        {completedQuests.length > 0 ? (
          <details className="mt-2 rounded-control border border-border bg-panel-muted p-3 opacity-70">
            <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-text-muted">
              Completed quests ({completedQuests.length})
            </summary>
            <div className="mt-3 grid gap-2" aria-label="Completed quests">
              {completedQuests.map((quest) => (
                <QuestNavigationButton
                  completed
                  key={quest.id}
                  onSelect={onSelect}
                  quest={quest}
                  selected={quest.id === selectedQuestId}
                />
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </Panel>
  );
}

function QuestNavigationButton({
  completed = false,
  onSelect,
  quest,
  selected
}: {
  completed?: boolean;
  onSelect: (questId: number) => void;
  quest: ActiveQuest;
  selected: boolean;
}) {
  return (
    <button
      aria-pressed={selected}
      className={cx(
        "grid min-h-16 gap-1 rounded-control border-2 p-3 text-left transition-colors",
        selected
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-panel-muted text-text-muted hover:border-primary hover:text-foreground",
        completed && "grayscale opacity-70"
      )}
      onClick={() => onSelect(quest.id)}
      type="button"
    >
      <span className="font-black">{quest.name}</span>
      <span className="text-xs">
        Level {formatLevelRange(quest)} · {formatQuestType(quest.type)}
      </span>
    </button>
  );
}

function formatLevelRange(quest: Pick<ActiveQuest, "maxLevel" | "minLevel">) {
  return quest.minLevel === quest.maxLevel ? String(quest.minLevel) : `${quest.minLevel}-${quest.maxLevel}`;
}

function formatQuestType(type: string) {
  return type ? `${type.charAt(0).toUpperCase()}${type.slice(1)}` : "Quest";
}
