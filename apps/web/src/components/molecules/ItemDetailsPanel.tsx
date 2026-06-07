import { MutedText } from "@/components/atoms/MutedText";
import { StatLabel } from "@/components/atoms/StatRow";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { getItemIconUrl, type ItemMetadata } from "@/lib/api";
import {
  colors,
  equipmentColors,
  overlayColors,
  radii,
  rarityColors,
  spacing,
  typography
} from "@/styles/tokens";

type ItemDetailsPanelProps = {
  awakeningStats?: ItemMetadata["abilities"];
  item?: ItemMetadata | null;
  slotLabel?: string | null;
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
  return rarity ? `rarity-${rarity.toLowerCase()}` : "rarity-common";
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

export function ItemDetailsPanel({ awakeningStats = [], item, slotLabel }: ItemDetailsPanelProps) {
  if (!item) {
    return (
      <aside className="item-details-panel empty" aria-label="Item details">
        <SectionHeading title="No item selected" />
        <MutedText>Select an equipped item to inspect its stats.</MutedText>
        <ItemDetailsPanelStyles />
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
  ].filter((row): row is [string, string] => Boolean(row));
  const hasAwakeningStats = awakeningStats.length > 0;

  return (
    <aside
      className="item-details-panel"
      aria-label={`${item.name} details`}
      data-slot={slotLabel ?? undefined}
    >
      <div className="item-details-header">
        <div className="item-details-icon-frame">
          {iconUrl ? <img src={iconUrl} alt="" aria-hidden="true" loading="lazy" /> : null}
        </div>
        <div>
          <h3 className={`item-name ${getRarityClass(item.rarity)}`}>{item.name}</h3>
        </div>
      </div>

      {metadataRows.length > 0 ? (
        <dl className="item-details-list">
          {metadataRows.map(([label, value]) => (
            <div className={label ? undefined : "item-details-full-row"} key={`${label}-${value}`}>
              {label ? <dt>{label}</dt> : null}
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {item.description ? <p className="item-description">{item.description}</p> : null}

      {item.abilities.length > 0 ? (
        <div className="item-ability-list">
          <StatLabel>Effects</StatLabel>
          {item.abilities.map((ability) => (
            <strong key={`${ability.parameter}-${ability.add}-${ability.rate}`}>
              {formatAbility(ability)}
            </strong>
          ))}
        </div>
      ) : null}

      {hasAwakeningStats ? (
        <div className="item-awakening-section">
          <StatLabel>Awakening</StatLabel>
          {awakeningStats.map((ability) => (
            <strong key={`${ability.parameter}-${ability.add}-${ability.rate}`}>
              {formatAbility(ability)}
            </strong>
          ))}
        </div>
      ) : null}

      {canItemTypeAwaken(item) && !hasAwakeningStats ? (
        <div className="item-awakening-available">
          <strong>Awakening Available</strong>
        </div>
      ) : null}
      <ItemDetailsPanelStyles />
    </aside>
  );
}

function ItemDetailsPanelStyles() {
  return (
    <style>{`
      .item-details-panel {
        display: grid;
        align-content: start;
        gap: ${spacing.xl};
        min-height: 260px;
        border: 1px solid ${equipmentColors.goldBorderMuted};
        border-radius: ${radii.md};
        background: linear-gradient(180deg, ${overlayColors.darkPanelStart}, ${overlayColors.darkPanelEnd}), ${colors.panel};
        box-shadow: inset 0 0 0 1px ${equipmentColors.goldShellGlow};
        padding: ${spacing["2xl"]};
      }

      .item-details-panel.empty {
        border-style: dashed;
      }

      .item-details-header {
        display: grid;
        grid-template-columns: 54px minmax(0, 1fr);
        gap: ${spacing.lg};
        align-items: center;
      }

      .item-details-header h3 {
        font-size: 1.35rem;
        line-height: 1.2;
      }

      .item-name.rarity-common {
        color: ${rarityColors.common};
      }

      .item-name.rarity-uncommon {
        color: ${rarityColors.uncommon};
      }

      .item-name.rarity-rare {
        color: ${rarityColors.rare};
      }

      .item-name.rarity-veryrare {
        color: ${rarityColors.veryRare};
      }

      .item-name.rarity-unique {
        color: ${rarityColors.unique};
      }

      .item-details-icon-frame {
        display: grid;
        width: 54px;
        height: 54px;
        place-items: center;
        border: 1px solid ${equipmentColors.goldBorderStrong};
        border-radius: ${radii.sm};
        background: ${equipmentColors.darkGlass};
        box-shadow: inset 0 0 14px ${equipmentColors.goldGlow};
      }

      .item-details-icon-frame img {
        width: 88%;
        height: 88%;
        object-fit: contain;
      }

      .item-details-list {
        display: grid;
        gap: ${spacing.sm};
        margin: 0;
      }

      .item-details-list div {
        display: flex;
        justify-content: space-between;
        gap: ${spacing.lg};
        border-bottom: 1px solid ${equipmentColors.goldBorderFaint};
        padding-bottom: 7px;
      }

      .item-details-list div:last-child {
        border-bottom: 0;
        padding-bottom: 0;
      }

      .item-details-list dt {
        color: ${colors.textMuted};
        font-size: 0.78rem;
        font-weight: ${typography.weightHeavy};
        text-transform: uppercase;
      }

      .item-details-list dd {
        margin: 0;
        color: ${colors.foreground};
        font-weight: ${typography.weightHeavy};
        text-align: right;
      }

      .item-details-list .item-details-full-row {
        justify-content: flex-start;
      }

      .item-details-list .item-details-full-row dd {
        color: ${colors.textMuted};
        text-align: left;
        text-transform: uppercase;
      }

      .item-description {
        color: ${equipmentColors.itemDescription};
        font-size: 0.92rem;
        line-height: 1.5;
      }

      .item-ability-list {
        display: grid;
        gap: ${spacing.sm};
      }

      .item-ability-list strong,
      .item-awakening-section strong {
        border: 1px solid ${overlayColors.primaryBorderSoft};
        border-radius: ${radii.sm};
        background: ${overlayColors.primaryPanelSoft};
        padding: ${spacing.sm} ${spacing.md};
        color: ${colors.primaryStrong};
        font-size: 0.9rem;
      }

      .item-awakening-section {
        display: grid;
        gap: ${spacing.sm};
      }

      .item-awakening-available {
        border-top: 1px solid ${equipmentColors.goldBorderSoft};
        margin-top: 2px;
        padding-top: 10px;
      }

      .item-awakening-available strong {
        display: block;
        color: ${equipmentColors.awakeningAvailable};
        font-size: 0.82rem;
        text-align: center;
        text-transform: uppercase;
      }
    `}</style>
  );
}
