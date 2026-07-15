import { cx } from "@/lib/classNames";
import { getTestIdSegment } from "@/lib/testIds";

export function AttackTimeline({
  attackIntervalSeconds,
  isActive,
  label,
  tone = "primary"
}: {
  attackIntervalSeconds: number;
  isActive: boolean;
  label: string;
  tone?: "primary" | "danger";
}) {
  const animationDuration = Math.max(0.1, attackIntervalSeconds);
  const fillStyle = isActive
    ? {
        animation: `battle-attack-fill ${animationDuration}s linear infinite`
      }
    : {
        transform: "scaleX(0)"
      };

  return (
    <div className="relative h-[72px]" data-testid={`battle_div_timeline_${getTestIdSegment(label)}`}>
      <style jsx global>{`
        @keyframes battle-attack-fill {
          from {
            transform: scaleX(0);
          }

          to {
            transform: scaleX(1);
          }
        }
      `}</style>
      <div className="sr-only" data-testid={`battle_div_timeline_header_${getTestIdSegment(label)}`}>
        <span data-testid={`battle_span_timeline_label_${getTestIdSegment(label)}`}>{label}</span>
      </div>
      <div
        className="absolute left-0 right-0 top-1/2 h-4 -translate-y-1/2 overflow-hidden rounded-[999px] border border-border bg-black/55"
        data-testid={`battle_div_timeline_track_${getTestIdSegment(label)}`}
      >
        <div
          className={cx(
            "h-full origin-left rounded-[999px]",
            tone === "danger"
              ? "bg-gradient-to-r from-[#ff7b58] to-[#c82c2c]"
              : "bg-gradient-to-r from-[#ffe173] to-[#d88f2e]"
          )}
          data-testid={`battle_div_timeline_fill_${getTestIdSegment(label)}`}
          style={fillStyle}
        />
      </div>
      <div
        className="absolute left-0 right-0 top-[calc(50%+12px)] text-right text-[0.68rem] font-black uppercase tracking-wide text-text-muted"
        data-testid={`battle_div_timeline_speed_${getTestIdSegment(label)}`}
      >
        Attack every {attackIntervalSeconds.toFixed(1)}s
      </div>
    </div>
  );
}
