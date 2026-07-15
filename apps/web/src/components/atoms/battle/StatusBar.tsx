import { cx } from "@/lib/classNames";
import { getTestIdSegment } from "@/lib/testIds";

export function StatusBar({
  label,
  max,
  testIdPrefix,
  tone,
  value
}: {
  label: string;
  max: number;
  testIdPrefix: string;
  tone: "hp" | "fp" | "mp";
  value: number;
}) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const toneClass = {
    hp: "from-[#ff4f4f] to-[#9b1717]",
    fp: "from-[#5fe07a] to-[#18803b]",
    mp: "from-[#4f91ff] to-[#17459b]"
  }[tone];
  const testId = `${testIdPrefix}_${getTestIdSegment(label)}`;

  return (
    <div className="grid" data-testid={`${testId}_div_status`}>
      <div
        className="relative h-6 overflow-hidden rounded-[4px] border border-border bg-black/55 shadow-[inset_0_2px_6px_rgba(0,0,0,0.72)]"
        data-testid={`${testId}_div_status_track`}
      >
        <div
          className={cx("h-full bg-gradient-to-r shadow-[inset_0_1px_0_rgba(255,255,255,0.32)]", toneClass)}
          data-testid={`${testId}_div_status_fill`}
          style={{ width: `${percent}%` }}
        />
        <div
          className="absolute inset-0 flex items-center justify-between gap-2 px-2 text-[0.7rem] font-black uppercase tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]"
          data-testid={`${testId}_div_status_header`}
        >
          <span data-testid={`${testId}_span_status_label`}>{label}</span>
          <span data-testid={`${testId}_span_status_value`}>
            {value} / {max}
          </span>
        </div>
      </div>
    </div>
  );
}
