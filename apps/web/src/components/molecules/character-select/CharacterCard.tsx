import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import { MutedText } from "@/components/atoms/MutedText";
import { Stack } from "@/components/atoms/Stack";
import { StatRow } from "@/components/atoms/StatRow";
import type { Character } from "@/lib/api";

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
      <article className="relative grid min-h-[248px] place-items-center overflow-hidden rounded-card border border-dashed border-border bg-[color-mix(in_srgb,var(--panel-muted)_58%,transparent)]">
        <button
          className="grid h-16 w-16 cursor-pointer place-items-center rounded-full border border-border bg-panel text-primary hover:border-primary hover:bg-panel-elevated"
          type="button"
          aria-label={`Create character in slot ${slotNumber}`}
          onClick={onCreate}
        >
          <Plus aria-hidden="true" size={28} strokeWidth={2.4} />
        </button>
      </article>
    );
  }

  return (
    <article className="relative min-h-[248px] overflow-hidden rounded-card border border-border bg-panel">
      <button
        className="absolute right-3 top-3 z-[1] grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-control border border-border bg-panel-muted text-text-muted hover:border-danger hover:bg-danger-panel hover:text-danger"
        aria-label={`Delete ${character.name}`}
        onClick={() => onDelete?.(character)}
        type="button"
      >
        <Trash2 aria-hidden="true" size={16} strokeWidth={2.25} />
      </button>
      <button
        className="grid min-h-[248px] w-full cursor-pointer gap-3.5 border-0 bg-transparent p-[18px] text-left text-inherit hover:bg-panel-elevated focus-visible:outline-[2px_solid_rgba(88,166,201,0.35)] focus-visible:outline-offset-[-2px] [&_h2]:m-0 [&_h2]:text-[1.15rem]"
        type="button"
        onClick={() => onSelect?.(character)}
        aria-label={`Select ${character.name}`}
      >
        <div className="grid min-h-[76px] place-items-center">
          <Image
            className="h-16 w-16 object-contain"
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
  );
}
