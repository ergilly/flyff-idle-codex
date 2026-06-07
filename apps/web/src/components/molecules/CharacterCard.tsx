import Image from "next/image";
import { Trash2 } from "lucide-react";
import { MutedText } from "@/components/atoms/MutedText";
import { Stack } from "@/components/atoms/Stack";
import { StatRow } from "@/components/atoms/StatRow";
import type { Character } from "@/lib/api";
import { borders, colors, outlines, radii, spacing } from "@/styles/tokens";

type CharacterCardProps = {
  character?: Character;
  onCreate?: () => void;
  onDelete?: (character: Character) => void;
  onSelect?: (character: Character) => void;
  slotNumber?: number;
};

const classIconByJob: Record<string, string> = {
  Acrobat: "acrobat.png",
  Arcanist: "arcanist.png",
  Assist: "assist.png",
  Billposter: "billposter.png",
  Blade: "blade.png",
  Crackshooter: "crackshooter.png",
  Elementor: "elementor.png",
  Forcemaster: "forcemaster.png",
  Harlequin: "harlequin.png",
  Jester: "jester.png",
  Knight: "knight.png",
  Magician: "magician.png",
  Mentalist: "mentalist.png",
  Mercenary: "mercenary.png",
  Psykeeper: "psychikeeper.png",
  Ranger: "ranger.png",
  Ringmaster: "ringmaster.png",
  Seraph: "seraph.png",
  Slayer: "slayer.png",
  Templar: "templar.png",
  Vagrant: "vagrant.png"
};

function getClassImageUrl(job: string) {
  const icon = classIconByJob[job] ?? "vagrant.png";

  return `/images/classes/${icon}`;
}

export function CharacterCard({ character, onCreate, onDelete, onSelect, slotNumber }: CharacterCardProps) {
  if (!character) {
    return (
      <>
        <article className="character-card empty-character-card">
          <button
            className="empty-character-button"
            type="button"
            aria-label={`Create character in slot ${slotNumber}`}
            onClick={onCreate}
          >
            <span className="plus-icon" aria-hidden="true" />
          </button>
        </article>
        <CharacterCardStyles />
      </>
    );
  }

  return (
    <>
      <article className="character-card">
        <button
          aria-label={`Delete ${character.name}`}
          className="delete-character-button"
          onClick={() => onDelete?.(character)}
          type="button"
        >
          <Trash2 aria-hidden="true" size={16} strokeWidth={2.25} />
        </button>
        <button
          className="character-select-button"
          type="button"
          onClick={() => onSelect?.(character)}
          aria-label={`Select ${character.name}`}
        >
          <div className="class-logo-wrap">
            <Image
              className="class-logo"
              src={getClassImageUrl(character.job)}
              alt={`${character.job} class logo`}
              width={64}
              height={64}
            />
          </div>
          <div>
            <h2>{character.name}</h2>
            <MutedText>{character.job}</MutedText>
          </div>
          <Stack>
            <StatRow label="Level" value={character.level} />
            <StatRow label="EXP" value={character.exp} />
          </Stack>
        </button>
      </article>
      <CharacterCardStyles />
    </>
  );
}

function CharacterCardStyles() {
  return (
    <style>{`
      .character-card {
        position: relative;
        min-height: 248px;
        border: ${borders.default};
        border-radius: ${radii.md};
        background: ${colors.panel};
        overflow: hidden;
      }

      .character-select-button {
        display: grid;
        width: 100%;
        min-height: 248px;
        gap: ${spacing.xl};
        border: 0;
        padding: ${spacing["3xl"]};
        background: ${colors.transparent};
        color: inherit;
        cursor: pointer;
        text-align: left;
      }

      .character-select-button:hover {
        background: ${colors.panelElevated};
      }

      .character-select-button:focus-visible {
        outline: ${outlines.focusPrimaryStrong};
        outline-offset: -2px;
      }

      .delete-character-button {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 1;
        display: grid;
        width: 34px;
        height: 34px;
        place-items: center;
        border: ${borders.default};
        border-radius: ${radii.sm};
        background: ${colors.panelMuted};
        color: ${colors.textMuted};
        cursor: pointer;
      }

      .delete-character-button:hover {
        border-color: ${colors.danger};
        background: ${colors.dangerPanel};
        color: ${colors.danger};
      }

      .class-logo-wrap {
        display: grid;
        min-height: 76px;
        place-items: center;
      }

      .class-logo {
        width: 64px;
        height: 64px;
        object-fit: contain;
      }

      .empty-character-card {
        display: grid;
        place-items: center;
        border-style: dashed;
        background: color-mix(in srgb, ${colors.panelMuted} 58%, transparent);
      }

      .empty-character-button {
        display: grid;
        width: 64px;
        height: 64px;
        place-items: center;
        border: ${borders.default};
        border-radius: ${radii.round};
        background: ${colors.panel};
        color: ${colors.primary};
        cursor: pointer;
      }

      .empty-character-button:hover {
        border-color: ${colors.primary};
        background: ${colors.panelElevated};
      }

      .plus-icon {
        position: relative;
        width: 26px;
        height: 26px;
      }

      .plus-icon::before,
      .plus-icon::after {
        position: absolute;
        content: "";
        background: currentColor;
        border-radius: 2px;
        inset: 50% auto auto 50%;
        transform: translate(-50%, -50%);
      }

      .plus-icon::before {
        width: 26px;
        height: 4px;
      }

      .plus-icon::after {
        width: 4px;
        height: 26px;
      }
    `}</style>
  );
}
