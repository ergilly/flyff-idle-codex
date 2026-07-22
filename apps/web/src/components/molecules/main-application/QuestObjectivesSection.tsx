import type { ActiveQuestObjective, CharacterInventoryItem } from "@/lib/api";
import { cx } from "@/lib/classNames";
import { getQuestItemProgress } from "@/lib/questProgress";

export function QuestObjectivesSection({
  inventoryItems,
  objectives
}: {
  inventoryItems: CharacterInventoryItem[];
  objectives: ActiveQuestObjective[];
}) {
  return (
    <section className="grid gap-2">
      <h3 className="text-sm font-black uppercase tracking-wide text-primary-strong">Objectives</h3>
      {objectives.length > 0 ? (
        <ul className="grid gap-2 text-sm text-foreground">
          {objectives.map((objective, index) => (
            <QuestObjective
              inventoryItems={inventoryItems}
              key={`${objective.label}-${index}`}
              objective={objective}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-muted">No structured objectives.</p>
      )}
    </section>
  );
}

function QuestObjective({
  inventoryItems,
  objective
}: {
  inventoryItems: CharacterInventoryItem[];
  objective: ActiveQuestObjective;
}) {
  if (objective.kind !== "item") {
    return (
      <li className="rounded-control border border-border bg-panel-muted px-3 py-2">{objective.label}</li>
    );
  }

  const progress = getQuestItemProgress(inventoryItems, objective.itemId, objective.requiredCount);
  const progressPercent = progress.required > 0 ? (progress.current / progress.required) * 100 : 100;

  return (
    <li className="grid gap-2 rounded-control border border-border bg-panel-muted px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span>{objective.label}</span>
        <strong
          aria-label={`${objective.label} progress`}
          className={cx("text-sm", progress.isComplete ? "text-primary-strong" : "text-foreground")}
        >
          {progress.current}/{progress.required}
        </strong>
      </div>
      <div
        aria-label={`${objective.label} completion`}
        aria-valuemax={progress.required}
        aria-valuemin={0}
        aria-valuenow={progress.current}
        className="h-2 overflow-hidden rounded-full bg-background"
        role="progressbar"
      >
        <div className="h-full bg-primary transition-[width]" style={{ width: `${progressPercent}%` }} />
      </div>
    </li>
  );
}
