import { getTestIdSegment } from "@/lib/testIds";

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"
      data-testid={`battle_div_info_row_${getTestIdSegment(label)}`}
    >
      <span className="text-text-muted" data-testid={`battle_span_info_label_${getTestIdSegment(label)}`}>
        {label}
      </span>
      <strong
        className="min-w-0 truncate text-right !text-sm"
        data-testid={`battle_strong_info_value_${getTestIdSegment(label)}`}
      >
        {value}
      </strong>
    </div>
  );
}
