import type { ActiveQuest } from "@/lib/api";

export function PinnedQuestCard({
  quest,
  onOpenQuestLog
}: {
  quest: ActiveQuest;
  onOpenQuestLog?: () => void;
}) {
  const nextObjective = quest.objectives[0]?.label ?? "Review the quest log for details.";

  return (
    <section
      className="grid gap-2 rounded-control border-2 border-primary bg-primary/10 p-3"
      data-testid="map_section_pinned_quest"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-wide text-primary-strong">
            Pinned objective
          </p>
          <h2 className="font-black text-foreground">{quest.name}</h2>
        </div>
        {onOpenQuestLog ? (
          <button
            className="shrink-0 rounded-control border border-primary px-2 py-1 text-[0.65rem] font-black uppercase tracking-wide text-primary-strong transition-colors hover:bg-primary/10"
            onClick={onOpenQuestLog}
            type="button"
          >
            Quest log
          </button>
        ) : null}
      </div>
      <p className="text-sm text-text-muted">{nextObjective}</p>
    </section>
  );
}
