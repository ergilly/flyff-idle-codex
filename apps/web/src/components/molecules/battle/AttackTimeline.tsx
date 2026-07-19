import { useEffect, useState } from "react";
import { cx } from "@/lib/classNames";
import { getTestIdSegment } from "@/lib/testIds";

export function AttackTimeline({
  attackDelaySeconds,
  attackIntervalSeconds,
  isActive,
  label,
  tone = "primary"
}: {
  attackDelaySeconds?: number;
  attackIntervalSeconds: number;
  isActive: boolean;
  label: string;
  tone?: "primary" | "danger";
}) {
  const animationDuration = Math.max(0.1, attackIntervalSeconds);
  const hasDelayPhase = attackDelaySeconds !== undefined;
  const delayDuration = Math.max(0.1, attackDelaySeconds ?? 0);
  const [monsterPhase, setMonsterPhase] = useState<"attack" | "delay">("attack");
  const [hasCompletedDelay, setHasCompletedDelay] = useState(false);

  useEffect(() => {
    if (!isActive || !hasDelayPhase) {
      return undefined;
    }

    let attackTimeout: number | undefined;
    let delayTimeout: number | undefined;
    const startAttackPhase = () => {
      setMonsterPhase("attack");
      attackTimeout = window.setTimeout(() => {
        setMonsterPhase("delay");
        delayTimeout = window.setTimeout(() => {
          setHasCompletedDelay(true);
          startAttackPhase();
        }, delayDuration * 1000);
      }, animationDuration * 1000);
    };

    setHasCompletedDelay(false);
    startAttackPhase();

    return () => {
      if (attackTimeout !== undefined) {
        window.clearTimeout(attackTimeout);
      }
      if (delayTimeout !== undefined) {
        window.clearTimeout(delayTimeout);
      }
    };
  }, [animationDuration, delayDuration, hasDelayPhase, isActive]);

  const fillStyle = !isActive
    ? { transform: "scaleX(0)" }
    : hasDelayPhase
      ? monsterPhase === "attack"
        ? { animation: `battle-attack-fill ${animationDuration}s linear forwards` }
        : { transform: "scaleX(1)" }
      : { animation: `battle-attack-fill ${animationDuration}s linear infinite` };
  const delayFillStyle = !isActive
    ? { transform: "scaleX(0)" }
    : monsterPhase === "delay"
      ? { animation: `battle-attack-fill ${delayDuration}s linear forwards` }
      : { transform: hasCompletedDelay ? "scaleX(1)" : "scaleX(0)" };

  return (
    <div
      className={hasDelayPhase ? "relative h-[82px]" : "relative h-[72px]"}
      data-testid={`battle_div_timeline_${getTestIdSegment(label)}`}
    >
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
      {hasDelayPhase ? (
        <div
          className="absolute left-2 right-0 top-[calc(50%+9px)] h-2 overflow-hidden rounded-[999px] border border-border bg-black/55"
          data-testid={`battle_div_timeline_delay_track_${getTestIdSegment(label)}`}
        >
          <div
            className="h-full origin-left rounded-[999px] bg-gradient-to-r from-[#8f8060] to-[#d8cda8]"
            data-testid={`battle_div_timeline_delay_fill_${getTestIdSegment(label)}`}
            style={delayFillStyle}
          />
        </div>
      ) : null}
      <div
        className={`absolute left-0 right-0 text-right text-[0.68rem] font-black uppercase tracking-wide text-text-muted ${hasDelayPhase ? "top-[calc(50%+22px)]" : "top-[calc(50%+12px)]"}`}
        data-testid={`battle_div_timeline_speed_${getTestIdSegment(label)}`}
      >
        {hasDelayPhase ? (
          <>
            Attack {attackIntervalSeconds.toFixed(1)}s · Delay {delayDuration.toFixed(1)}s
          </>
        ) : (
          <>Attack every {attackIntervalSeconds.toFixed(1)}s</>
        )}
      </div>
    </div>
  );
}
