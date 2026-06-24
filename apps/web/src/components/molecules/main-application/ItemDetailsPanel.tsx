import Image from "next/image";
import type { ReactNode } from "react";
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { MutedText } from "@/components/atoms/MutedText";
import { StatLabel } from "@/components/atoms/StatRow";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import { getItemIconUrl, type Character, type ItemMetadata } from "@/lib/api";
import { cx } from "@/lib/classNames";

type ItemDetailsPanelProps = {
  actionDisabled?: boolean;
  actionError?: string;
  actionLabel?: string;
  awakeningStats?: ItemMetadata["abilities"];
  character?: Character;
  className?: string;
  emptyDescription?: string;
  item?: ItemMetadata | null;
  onAction?: () => void;
  slotLabel?: string | null;
};

const rarityClassByName: Record<string, string> = {
  common: "text-[#5fb3ff]",
  uncommon: "text-[#64d875]",
  rare: "text-[#f5d451]",
  veryrare: "text-[#ff6464]",
  unique: "text-[#c27bff]"
};

const panelClassName =
  "grid min-h-[260px] w-full max-w-[340px] content-start gap-3.5 justify-self-start rounded-card border-[3px] border-[rgba(226,179,63,0.58)] bg-[linear-gradient(180deg,rgba(31,29,22,0.92),rgba(5,6,5,0.98)),var(--panel)] p-4 shadow-[inset_0_0_0_2px_rgba(255,225,115,0.16),inset_0_16px_30px_rgba(255,255,255,0.04),0_18px_38px_rgba(0,0,0,0.34)]";

const detailsListClassName =
  "m-0 grid gap-2 [&_div:last-child]:border-b-0 [&_div:last-child]:pb-0 [&_div]:flex [&_div]:justify-between [&_div]:gap-3 [&_div]:border-b [&_div]:border-[rgba(187,161,89,0.18)] [&_div]:pb-[7px] [&_dd]:m-0 [&_dd]:text-right [&_dd]:font-extrabold [&_dd]:text-foreground [&_dt]:text-[0.78rem] [&_dt]:font-extrabold [&_dt]:uppercase [&_dt]:text-text-muted";

const effectListClassName =
  "grid gap-2 [&_strong]:rounded-control [&_strong]:border-2 [&_strong]:border-[rgba(226,179,63,0.42)] [&_strong]:bg-[linear-gradient(180deg,rgba(255,225,115,0.14),rgba(13,13,11,0.72))] [&_strong]:px-2.5 [&_strong]:py-2 [&_strong]:text-[0.9rem] [&_strong]:text-primary-strong [&_strong]:shadow-[inset_0_0_12px_rgba(255,216,76,0.08)]";

const secondJobToFirstJob: Record<string, string> = {
  Blade: "Mercenary",
  Knight: "Mercenary",
  Elementor: "Magician",
  Psykeeper: "Magician",
  Billposter: "Assist",
  Ringmaster: "Assist",
  Jester: "Acrobat",
  Ranger: "Acrobat"
};

const thirdJobToSecondJob: Record<string, string> = {
  Slayer: "Blade",
  Templar: "Knight",
  Arcanist: "Elementor",
  Mentalist: "Psykeeper",
  Forcemaster: "Billposter",
  Seraph: "Ringmaster",
  Harlequin: "Jester",
  Crackshooter: "Ranger"
};

function formatLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/veryfast/i, "very fast")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatAbility({ add, parameter, rate }: ItemMetadata["abilities"][number]) {
  const sign = add !== null && add > 0 ? "+" : "";
  const suffix = rate ? "%" : "";

  return `${formatLabel(parameter)} ${add === null ? "" : `${sign}${add}${suffix}`}`.trim();
}

function getRarityClass(rarity: string | null) {
  return rarityClassByName[rarity?.toLowerCase() ?? "common"] ?? rarityClassByName.common;
}

function canItemTypeAwaken(item: ItemMetadata) {
  if (item.category === "weapon" || item.category === "armor") {
    return true;
  }

  return (
    item.category === "fashion" &&
    item.subcategory !== null &&
    ["cloth", "glove", "hat", "mask", "shoes"].includes(item.subcategory)
  );
}

function normalizeRequirement(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function getJobLineage(job: string) {
  const secondJob = thirdJobToSecondJob[job];
  const firstJob = secondJob ? secondJobToFirstJob[secondJob] : secondJobToFirstJob[job];

  return [job, secondJob, firstJob, "Vagrant"].filter((value): value is string => Boolean(value));
}

function meetsRequiredJob(character: Character, requiredJob: string) {
  const normalizedRequirement = normalizeRequirement(requiredJob);

  return getJobLineage(character.job).some((job) => normalizeRequirement(job) === normalizedRequirement);
}

function isRequirementUnmet(label: string, item: ItemMetadata, character?: Character) {
  if (!character) {
    return false;
  }

  if (label === "Gender" && item.sex) {
    return item.sex !== character.gender;
  }

  if (label === "Req Job" && item.requiredJob) {
    return !meetsRequiredJob(character, item.requiredJob);
  }

  if (label === "Level" && item.level !== null) {
    return character.level < item.level;
  }

  return false;
}

function renderDescription(description: string, itemName: string): ReactNode {
  if (!itemName || !description.includes(itemName)) {
    return description;
  }

  const descriptionParts = description.split(itemName);

  return descriptionParts.map((part, index) => (
    <span key={`${part}-${index}`}>
      {index > 0 ? <strong className="text-[#fff1ba] [font-weight:900]">{itemName}</strong> : null}
      {part}
    </span>
  ));
}

export function ItemDetailsPanel({
  actionDisabled = false,
  actionError = "",
  actionLabel,
  awakeningStats = [],
  character,
  className,
  emptyDescription = "Select an equipped item to inspect its stats.",
  item,
  onAction,
  slotLabel
}: ItemDetailsPanelProps) {
  if (!item) {
    return (
      <aside className={cx(panelClassName, className)} aria-label="Item details">
        <SectionHeading title="No item selected" />
        <MutedText>{emptyDescription}</MutedText>
      </aside>
    );
  }

  const iconUrl = item.icon ? getItemIconUrl(item.icon) : null;
  const attackRange =
    item.minAttack !== null && item.maxAttack !== null ? `${item.minAttack} - ${item.maxAttack}` : null;
  const defenseRange =
    item.minDefense !== null && item.maxDefense !== null ? `${item.minDefense} - ${item.maxDefense}` : null;
  const weaponHandedness =
    item.category === "weapon" && item.twoHanded !== null
      ? item.twoHanded
        ? "Two-Handed Weapon"
        : "One-Handed Weapon"
      : null;
  const metadataRows = [
    weaponHandedness ? ["", weaponHandedness] : null,
    item.sex ? ["Gender", formatLabel(item.sex)] : null,
    attackRange ? ["Attack", attackRange] : null,
    item.attackSpeed ? ["Attack Speed", formatLabel(item.attackSpeed)] : null,
    defenseRange ? ["Defense", defenseRange] : null,
    item.requiredJob ? ["Req Job", item.requiredJob] : null,
    item.level !== null ? ["Level", item.level.toString()] : null
  ]
    .filter((row): row is [string, string] => Boolean(row))
    .map(([label, value]) => ({
      label,
      unmet: isRequirementUnmet(label, item, character),
      value
    }));
  const hasAwakeningStats = awakeningStats.length > 0;

  return (
    <aside
      className={cx(panelClassName, className)}
      aria-label={`${item.name} details`}
      data-slot={slotLabel ?? undefined}
    >
      <div className="grid grid-cols-[54px_minmax(0,1fr)] items-center gap-3">
        <div className="grid h-[54px] w-[54px] place-items-center rounded-control border-2 border-[rgba(187,161,89,0.58)] bg-[rgba(0,0,0,0.62)] shadow-[inset_0_0_14px_rgba(255,216,76,0.1)]">
          {iconUrl ? (
            <Image
              className="h-[88%] w-[88%] object-contain"
              src={iconUrl}
              alt=""
              aria-hidden="true"
              loading="lazy"
              width={48}
              height={48}
              unoptimized
            />
          ) : null}
        </div>
        <div>
          <h3 className={cx("m-0 text-[1.35rem] font-black leading-[1.2]", getRarityClass(item.rarity))}>
            {item.name}
          </h3>
        </div>
      </div>

      {metadataRows.length > 0 ? (
        <dl className={detailsListClassName}>
          {metadataRows.map(({ label, unmet, value }) => (
            <div
              className={cx(
                !label && "justify-start [&_dd]:text-left [&_dd]:uppercase [&_dd]:text-text-muted",
                unmet && "[&_dd]:!text-[#ff4d4d]"
              )}
              key={`${label}-${value}`}
            >
              {label ? <dt>{label}</dt> : null}
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {item.description ? (
        <p className="m-0 text-[0.92rem] leading-normal text-[#d6cfb2]">
          {renderDescription(item.description, item.name)}
        </p>
      ) : null}

      {item.abilities.length > 0 ? <ItemEffectList label="Effects" abilities={item.abilities} /> : null}

      {hasAwakeningStats ? <ItemEffectList label="Awakening" abilities={awakeningStats} /> : null}

      {canItemTypeAwaken(item) && !hasAwakeningStats ? (
        <div className="mt-0.5 border-t border-[rgba(187,161,89,0.22)] pt-2.5">
          <strong className="block text-center text-[0.82rem] uppercase text-[rgba(3,54,223,0.72)]">
            Awakening Available
          </strong>
        </div>
      ) : null}

      {actionError ? <ErrorMessage message={actionError} /> : null}

      {actionLabel && onAction ? (
        <Button type="button" onClick={onAction} disabled={actionDisabled}>
          {actionLabel}
        </Button>
      ) : null}
    </aside>
  );
}

function ItemEffectList({ abilities, label }: { abilities: ItemMetadata["abilities"]; label: string }) {
  return (
    <div className={effectListClassName}>
      <StatLabel>{label}</StatLabel>
      {abilities.map((ability) => (
        <strong key={`${ability.parameter}-${ability.add}-${ability.rate}`}>{formatAbility(ability)}</strong>
      ))}
    </div>
  );
}
