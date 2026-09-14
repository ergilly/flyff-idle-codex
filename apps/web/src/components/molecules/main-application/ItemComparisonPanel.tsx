import type { Character, ItemMetadata } from "@/lib/api";
import { getItemComparison } from "@/lib/itemComparison";
import { cx } from "@/lib/classNames";
import { StatLabel } from "@/components/atoms/StatRow";

type ItemComparisonPanelProps = {
  character: Character;
  equipmentSet?: number;
  item: ItemMetadata;
  itemsById: Record<string, ItemMetadata>;
};

const panelClassName =
  "grid gap-2 rounded-control border-2 border-[rgba(226,179,63,0.42)] bg-[linear-gradient(180deg,rgba(255,225,115,0.14),rgba(13,13,11,0.72))] px-2.5 py-2 shadow-[inset_0_0_12px_rgba(255,216,76,0.08)]";

export function ItemComparisonPanel({
  character,
  equipmentSet = 0,
  item,
  itemsById
}: ItemComparisonPanelProps) {
  const comparison = getItemComparison(character, item, itemsById, equipmentSet);

  return (
    <section className={panelClassName} data-testid="item_comparison_section">
      <StatLabel data-testid="item_comparison_label">Compared with equipped</StatLabel>
      {comparison.currentItem ? (
        <p className="m-0 text-[0.78rem] text-text-muted" data-testid="item_comparison_current_item">
          Replacing {comparison.currentItem.name}
        </p>
      ) : null}
      {comparison.requirementErrors.length > 0 ? (
        <div className="grid gap-1" data-testid="item_comparison_requirements">
          <strong className="text-[0.82rem] text-[#ff6464]">Cannot equip</strong>
          {comparison.requirementErrors.map((error) => (
            <span className="text-[0.82rem] text-[#ff9b9b]" key={error}>
              {error}
            </span>
          ))}
        </div>
      ) : comparison.rows.length > 0 ? (
        <dl className="m-0 grid gap-1.5" data-testid="item_comparison_stats">
          {comparison.rows.map((row) => (
            <div className="flex items-center justify-between gap-2" key={row.label}>
              <dt className="text-[0.78rem] font-extrabold uppercase text-text-muted">{row.label}</dt>
              <dd
                className={cx(
                  "m-0 text-right text-[0.82rem] font-extrabold",
                  row.direction === "increase" && "text-[#64d875]",
                  row.direction === "decrease" && "text-[#ff6464]",
                  row.direction === "unchanged" && "text-text-muted"
                )}
              >
                {row.before} → {row.after}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="m-0 text-[0.82rem] text-text-muted" data-testid="item_comparison_no_changes">
          No combat stat changes
        </p>
      )}
    </section>
  );
}
