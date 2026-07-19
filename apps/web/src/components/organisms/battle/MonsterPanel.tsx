"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { InfoRow } from "@/components/atoms/battle/CombatInfoRow";
import { StatusBar } from "@/components/atoms/battle/StatusBar";
import { MutedText } from "@/components/atoms/MutedText";
import { Panel } from "@/components/atoms/Panel";
import { AttackTimeline } from "@/components/molecules/battle/AttackTimeline";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import { MonsterDroppedItemsPanel } from "@/components/organisms/battle/MonsterDroppedItemsPanel";
import { MonsterDropsOverlay } from "@/components/organisms/battle/MonsterDropsOverlay";
import {
  getMonsterIconUrl,
  type ItemMetadata,
  type MapMonsterFamily,
  type MonsterFamilyVariant
} from "@/lib/api";
import { formatBattleValue } from "@/lib/battle/loot";
import { getMonsterAttackTiming } from "@/lib/battle/monsterAttackTiming";
import { type BattleDroppedItem, type BattleOutcome } from "@/lib/battle/types";
import { type AutoAttackDamage } from "@/lib/combatStats";

export function MonsterPanel({
  autoAttackDamage,
  battleOutcome,
  combatUnavailableReason,
  droppedItems,
  isAttackTimelineActive,
  isCombatInProgress,
  isLootPending,
  isPauseAfterCurrentMonster,
  itemsById,
  monsterAttack,
  monsterExperience,
  monsterFamily,
  monsterHp,
  monsterMaxHp,
  onDeleteDroppedItems,
  onLootAllDroppedItems,
  onLootDroppedItem,
  onLootSelectedDroppedItem,
  onPauseCombat,
  onRunAway,
  onSelectDroppedItem,
  onStartCombat,
  selectedDroppedItemId,
  selectedVariant
}: {
  autoAttackDamage: AutoAttackDamage | null;
  battleOutcome: BattleOutcome;
  combatUnavailableReason: string | null;
  droppedItems: BattleDroppedItem[];
  isAttackTimelineActive: boolean;
  isCombatInProgress: boolean;
  isLootPending: boolean;
  isPauseAfterCurrentMonster: boolean;
  itemsById: Record<string, ItemMetadata>;
  monsterAttack: number | null;
  monsterExperience: number | null;
  monsterFamily: MapMonsterFamily | null;
  monsterHp: number | null;
  monsterMaxHp: number | null;
  onDeleteDroppedItems: () => void;
  onLootAllDroppedItems: () => void;
  onLootDroppedItem: (drop: BattleDroppedItem) => void;
  onLootSelectedDroppedItem: () => void;
  onPauseCombat: () => void;
  onRunAway: () => void;
  onSelectDroppedItem: (itemId: string) => void;
  onStartCombat: () => void;
  selectedDroppedItemId: string | null;
  selectedVariant: MonsterFamilyVariant | null;
}) {
  const [isDropsOverlayOpen, setIsDropsOverlayOpen] = useState(false);

  return (
    <Panel
      as="section"
      className="h-full min-h-0 gap-4 [grid-template-rows:auto_auto_auto_minmax(0,1fr)]"
      data-testid="battle_panel_monster"
    >
      <MonsterCombatHeader
        isCombatInProgress={isAttackTimelineActive}
        monsterHp={monsterHp}
        monsterMaxHp={monsterMaxHp}
        selectedVariant={selectedVariant}
      />
      <MonsterBasicPanel monsterFamily={monsterFamily} selectedVariant={selectedVariant} />
      <MonsterStatsAndOptionsPanel
        autoAttackDamage={autoAttackDamage}
        battleOutcome={battleOutcome}
        combatUnavailableReason={combatUnavailableReason}
        isCombatInProgress={isCombatInProgress}
        isPauseAfterCurrentMonster={isPauseAfterCurrentMonster}
        monsterAttack={monsterAttack}
        monsterExperience={monsterExperience}
        onPauseCombat={onPauseCombat}
        onRunAway={onRunAway}
        onStartCombat={onStartCombat}
        onViewDrops={() => setIsDropsOverlayOpen(true)}
        selectedVariant={selectedVariant}
      />
      <MonsterDroppedItemsPanel
        droppedItems={droppedItems}
        isLootPending={isLootPending}
        itemsById={itemsById}
        onDeleteDroppedItems={onDeleteDroppedItems}
        onLootAllDroppedItems={onLootAllDroppedItems}
        onLootDroppedItem={onLootDroppedItem}
        onLootSelectedDroppedItem={onLootSelectedDroppedItem}
        onSelectDroppedItem={onSelectDroppedItem}
        selectedDroppedItemId={selectedDroppedItemId}
      />
      {isDropsOverlayOpen ? (
        <MonsterDropsOverlay
          itemsById={itemsById}
          monsterFamily={monsterFamily}
          onClose={() => setIsDropsOverlayOpen(false)}
          selectedVariant={selectedVariant}
        />
      ) : null}
    </Panel>
  );
}

function MonsterCombatHeader({
  isCombatInProgress,
  monsterHp,
  monsterMaxHp,
  selectedVariant
}: {
  isCombatInProgress: boolean;
  monsterHp: number | null;
  monsterMaxHp: number | null;
  selectedVariant: MonsterFamilyVariant | null;
}) {
  const monsterAttackTiming = getMonsterAttackTiming(selectedVariant);

  return (
    <div
      className="grid min-h-[98px] gap-4 rounded-control border border-border bg-black/35 p-3 min-[560px]:grid-cols-2 min-[560px]:items-center"
      data-testid="battle_div_monster_combat_header"
    >
      <AttackTimeline
        attackDelaySeconds={monsterAttackTiming.attackDelaySeconds}
        attackIntervalSeconds={monsterAttackTiming.attackSpeedSeconds}
        isActive={isCombatInProgress}
        label="Monster attack"
        tone="danger"
      />
      {monsterHp !== null ? (
        <StatusBar
          label="HP"
          testIdPrefix="battle_monster_header"
          value={monsterHp}
          max={monsterMaxHp ?? monsterHp}
          tone="hp"
        />
      ) : (
        <div
          className="grid h-6 place-items-center rounded-[4px] border border-border bg-black/55 px-2 text-[0.7rem] font-black uppercase tracking-wide text-text-muted"
          data-testid="battle_monster_header_no_target"
        >
          No target
        </div>
      )}
    </div>
  );
}

function MonsterBasicPanel({
  selectedVariant
}: {
  monsterFamily: MapMonsterFamily | null;
  selectedVariant: MonsterFamilyVariant | null;
}) {
  return (
    <Panel as="section" className="content-start gap-4" data-testid="battle_panel_monster_basic">
      <SectionHeading eyebrow="Target" testId="battle_heading_monster_basic" />
      <div className="grid gap-4 min-[560px]:grid-cols-[96px_1fr] min-[560px]:items-start">
        {selectedVariant?.icon ? (
          <div
            className="grid aspect-square place-items-center rounded-control border border-[rgba(138,116,65,0.58)] bg-black/32 p-3"
            data-testid="battle_div_monster_image"
          >
            <Image
              alt=""
              aria-hidden="true"
              className="h-full w-full object-contain drop-shadow-[0_2px_5px_rgba(0,0,0,0.72)]"
              height={96}
              src={getMonsterIconUrl(selectedVariant.icon)}
              unoptimized
              width={96}
            />
          </div>
        ) : (
          <div
            className="grid aspect-square place-items-center rounded-control border border-dashed border-[rgba(138,116,65,0.64)] bg-black/24 text-xs font-black uppercase text-text-muted"
            data-testid="battle_div_monster_image_empty"
          >
            No target
          </div>
        )}
        {selectedVariant ? (
          <div className="grid gap-2 text-sm font-bold" data-testid="battle_div_monster_info">
            <InfoRow label="Monster" value={selectedVariant.name} />
            <InfoRow label="Level" value={formatBattleValue(selectedVariant.level)} />
            <InfoRow label="Rank" value={formatBattleValue(selectedVariant.rank)} />
            <InfoRow label="Element" value={formatBattleValue(selectedVariant.element)} />
          </div>
        ) : (
          <MutedText data-testid="battle_p_no_monster_target">
            Select a monster from the map to prepare a battle target.
          </MutedText>
        )}
      </div>
    </Panel>
  );
}

function MonsterStatsAndOptionsPanel({
  autoAttackDamage,
  battleOutcome,
  combatUnavailableReason,
  isCombatInProgress,
  isPauseAfterCurrentMonster,
  monsterAttack,
  monsterExperience,
  onPauseCombat,
  onRunAway,
  onStartCombat,
  onViewDrops,
  selectedVariant
}: {
  autoAttackDamage: AutoAttackDamage | null;
  battleOutcome: BattleOutcome;
  combatUnavailableReason: string | null;
  isCombatInProgress: boolean;
  isPauseAfterCurrentMonster: boolean;
  monsterAttack: number | null;
  monsterExperience: number | null;
  onPauseCombat: () => void;
  onRunAway: () => void;
  onStartCombat: () => void;
  onViewDrops: () => void;
  selectedVariant: MonsterFamilyVariant | null;
}) {
  return (
    <Panel as="section" className="content-start gap-4" data-testid="battle_panel_monster_stats">
      <SectionHeading eyebrow="Monster" testId="battle_heading_monster_stats" />
      {selectedVariant ? (
        <div className="grid gap-3 min-[900px]:grid-cols-3" data-testid="battle_div_monster_more_stats">
          <div
            className="grid content-start gap-2 rounded-control border border-[rgba(138,116,65,0.58)] bg-black/24 p-3 text-sm font-bold"
            data-testid="battle_div_monster_offensive_stats"
          >
            <h3
              className="text-[0.68rem] font-black uppercase tracking-wide text-text-muted"
              data-testid="battle_heading_monster_offensive_stats"
            >
              Offensive Stats
            </h3>
            <InfoRow label="Attack" value={String(monsterAttack || "?")} />
            <InfoRow
              label="EXP"
              value={monsterExperience === null ? "Unknown" : Math.floor(monsterExperience).toLocaleString()}
            />
            <InfoRow
              label="Damage"
              value={`${formatBattleValue(selectedVariant.minAttack)} - ${formatBattleValue(selectedVariant.maxAttack)}`}
            />
            {autoAttackDamage ? (
              <>
                <InfoRow label="Player Damage" value={formatBattleValue(autoAttackDamage.averageDamage)} />
                <InfoRow
                  label="Player DPS"
                  value={formatBattleValue(Math.round(autoAttackDamage.damagePerSecond))}
                />
                <InfoRow label="Hit Chance" value={`${autoAttackDamage.effectiveHitRate.toFixed(0)}%`} />
                <InfoRow
                  label="Time To Kill"
                  value={
                    autoAttackDamage.secondsToKill === null
                      ? "Unknown"
                      : `${autoAttackDamage.secondsToKill.toFixed(1)}s`
                  }
                />
              </>
            ) : null}
          </div>
          <div
            className="grid content-start gap-2 rounded-control border border-[rgba(138,116,65,0.58)] bg-black/24 p-3 text-sm font-bold"
            data-testid="battle_div_monster_defensive_stats"
          >
            <h3
              className="text-[0.68rem] font-black uppercase tracking-wide text-text-muted"
              data-testid="battle_heading_monster_defensive_stats"
            >
              Defensive Stats
            </h3>
            <InfoRow label="Defense" value={formatBattleValue(selectedVariant.defense)} />
            <InfoRow label="Magic DEF" value={formatBattleValue(selectedVariant.magicDefense)} />
          </div>
          <MonsterCombatOptions
            battleOutcome={battleOutcome}
            combatUnavailableReason={combatUnavailableReason}
            isCombatInProgress={isCombatInProgress}
            isPauseAfterCurrentMonster={isPauseAfterCurrentMonster}
            onPauseCombat={onPauseCombat}
            onRunAway={onRunAway}
            onStartCombat={onStartCombat}
            onViewDrops={onViewDrops}
            selectedVariant={selectedVariant}
          />
        </div>
      ) : (
        <div className="grid gap-3 min-[900px]:grid-cols-3" data-testid="battle_div_monster_more_stats">
          <MutedText data-testid="battle_p_no_monster_stats">No monster stats are available yet.</MutedText>
        </div>
      )}
    </Panel>
  );
}

function MonsterCombatOptions({
  battleOutcome,
  combatUnavailableReason,
  isCombatInProgress,
  isPauseAfterCurrentMonster,
  onPauseCombat,
  onRunAway,
  onStartCombat,
  onViewDrops,
  selectedVariant
}: {
  battleOutcome: BattleOutcome;
  combatUnavailableReason: string | null;
  isCombatInProgress: boolean;
  isPauseAfterCurrentMonster: boolean;
  onPauseCombat: () => void;
  onRunAway: () => void;
  onStartCombat: () => void;
  onViewDrops: () => void;
  selectedVariant: MonsterFamilyVariant | null;
}) {
  const startLabel =
    battleOutcome === "monsterDefeated" || battleOutcome === "playerDefeated"
      ? "Restart combat"
      : "Start combat";

  return (
    <div
      className="grid content-start gap-3 rounded-control border border-[rgba(138,116,65,0.58)] bg-black/24 p-3"
      data-testid="battle_div_monster_combat_options"
    >
      <h3
        className="text-[0.68rem] font-black uppercase tracking-wide text-text-muted"
        data-testid="battle_heading_monster_combat_options"
      >
        Combat Options
      </h3>
      <div className="grid gap-2" data-testid="battle_div_monster_combat_buttons">
        {combatUnavailableReason ? (
          <MutedText data-testid="battle_p_combat_unavailable">{combatUnavailableReason}</MutedText>
        ) : null}
        {isCombatInProgress ? (
          <Button
            data-testid="battle_button_pause_combat"
            disabled={isPauseAfterCurrentMonster}
            onClick={onPauseCombat}
            type="button"
          >
            {isPauseAfterCurrentMonster ? "Pausing..." : "Pause combat"}
          </Button>
        ) : (
          <Button
            data-testid="battle_button_start_combat"
            disabled={!selectedVariant || Boolean(combatUnavailableReason)}
            onClick={onStartCombat}
            type="button"
          >
            {startLabel}
          </Button>
        )}
        <Button
          data-testid="battle_button_view_monster_drops"
          onClick={onViewDrops}
          type="button"
          variant="secondary"
        >
          View monster drops
        </Button>
        {isCombatInProgress ? (
          <Button data-testid="battle_button_run_away" onClick={onRunAway} type="button" variant="secondary">
            Run away
          </Button>
        ) : null}
      </div>
    </div>
  );
}
