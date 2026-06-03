import Image from "next/image";
import type { Character } from "@/lib/api";

type CharacterCardProps = {
  character?: Character;
  onCreate?: () => void;
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

export function CharacterCard({ character, onCreate, slotNumber }: CharacterCardProps) {
  if (!character) {
    return (
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
    );
  }

  return (
    <article className="character-card">
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
        <p className="muted">{character.job}</p>
      </div>
      <div className="stack">
        <div className="stat-row">
          <span className="stat-label">Level</span>
          <strong>{character.level}</strong>
        </div>
        <div className="stat-row">
          <span className="stat-label">EXP</span>
          <strong>{character.exp}</strong>
        </div>
      </div>
    </article>
  );
}
