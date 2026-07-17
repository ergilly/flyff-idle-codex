import { ShopFilterCheckbox } from "@/components/atoms/map/ShopFilterCheckbox";

export function ShopFilters({
  characterLevel,
  characterJob,
  characterSex,
  filterByClass,
  filterByLevel,
  filterBySex,
  onChange
}: {
  characterLevel?: number;
  characterJob?: string;
  characterSex?: "female" | "male";
  filterByClass: boolean;
  filterByLevel: boolean;
  filterBySex: boolean;
  onChange: (filter: "class" | "level" | "sex", checked: boolean) => void;
}) {
  return (
    <fieldset className="grid content-start gap-3 rounded-control border-2 border-border bg-black/25 px-2 py-3">
      <legend className="px-1 text-[0.65rem] font-black uppercase tracking-wide text-text-muted">
        Filters
      </legend>
      <ShopFilterCheckbox
        checked={filterByClass}
        disabled={!characterJob}
        label="By class"
        onChange={(checked) => onChange("class", checked)}
      />
      <ShopFilterCheckbox
        checked={filterBySex}
        disabled={!characterSex}
        label="By sex"
        onChange={(checked) => onChange("sex", checked)}
      />
      <ShopFilterCheckbox
        checked={filterByLevel}
        disabled={characterLevel === undefined}
        label="By level"
        onChange={(checked) => onChange("level", checked)}
      />
    </fieldset>
  );
}
