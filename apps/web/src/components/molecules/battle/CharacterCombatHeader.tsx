import { StatusBar } from "@/components/atoms/battle/StatusBar";
import { AttackTimeline } from "@/components/molecules/battle/AttackTimeline";
import { type AttackTiming } from "@/lib/combatStats";

export function CharacterCombatHeader({
  attackTiming,
  characterFp,
  characterMaxFp,
  characterHp,
  characterMaxHp,
  characterMp,
  characterMaxMp,
  isCombatInProgress
}: {
  attackTiming: AttackTiming;
  characterFp: number;
  characterMaxFp: number;
  characterHp: number;
  characterMaxHp: number;
  characterMp: number;
  characterMaxMp: number;
  isCombatInProgress: boolean;
}) {
  return (
    <div
      className="grid min-h-[98px] min-w-0 gap-4 rounded-control border border-border bg-black/35 p-3 min-[720px]:grid-cols-2 min-[720px]:items-center"
      data-testid="battle_div_character_combat_header"
    >
      <div className="grid gap-0" data-testid="battle_div_character_header_resources">
        <StatusBar
          label="HP"
          testIdPrefix="battle_character_header"
          value={characterHp}
          max={characterMaxHp}
          tone="hp"
        />
        <StatusBar
          label="MP"
          testIdPrefix="battle_character_header"
          value={characterMp}
          max={characterMaxMp}
          tone="mp"
        />
        <StatusBar
          label="FP"
          testIdPrefix="battle_character_header"
          value={characterFp}
          max={characterMaxFp}
          tone="fp"
        />
      </div>
      <div className="grid h-full items-center" data-testid="battle_div_character_header_attack">
        <AttackTimeline
          attackIntervalSeconds={attackTiming.secondsPerAttack}
          isActive={isCombatInProgress}
          label="Player attack"
        />
      </div>
    </div>
  );
}
