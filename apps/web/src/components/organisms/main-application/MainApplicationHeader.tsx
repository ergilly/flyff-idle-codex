import type { ReactNode } from "react";
import { Eyebrow } from "@/components/atoms/main-application/Eyebrow";
import { ProfileActionsMenu } from "@/components/molecules/main-application/ProfileActionsMenu";
import type { Character } from "@/lib/api";

type MainApplicationHeaderProps = {
  character: Character;
  isProfileMenuOpen: boolean;
  onChangeCharacter: () => void;
  onLogout: () => void;
  onProfileMenuToggle: () => void;
};

export function MainApplicationHeader({
  character,
  isProfileMenuOpen,
  onChangeCharacter,
  onLogout,
  onProfileMenuToggle
}: MainApplicationHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-[18px] border-b border-border bg-panel-shell px-[22px] py-[18px] max-[560px]:grid max-[560px]:items-stretch max-[560px]:gap-3 max-[560px]:px-4 max-[560px]:py-3">
      <CharacterSummary>
        <div>
          <Eyebrow>Current character</Eyebrow>
          <h1>{character.name}</h1>
        </div>
        <HeaderStat>
          <span>Class</span>
          <strong>{character.job}</strong>
        </HeaderStat>
        <HeaderStat>
          <span>Level</span>
          <strong>{character.level}</strong>
        </HeaderStat>
        <HeaderStat>
          <span>Penya</span>
          <strong>{character.penya.toLocaleString()}</strong>
        </HeaderStat>
      </CharacterSummary>

      <ProfileActionsMenu
        characterName={character.name}
        isOpen={isProfileMenuOpen}
        onChangeCharacter={onChangeCharacter}
        onLogout={onLogout}
        onToggle={onProfileMenuToggle}
      />
    </header>
  );
}

function CharacterSummary({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-[18px] max-[560px]:grid max-[560px]:grid-cols-3 max-[560px]:items-start max-[560px]:gap-2 [&_h1]:m-0 [&_h1]:text-[1.65rem] [&_h1]:leading-tight max-[560px]:[&_h1]:text-[1.25rem] max-[560px]:[&_h1]:leading-none max-[560px]:[&>div:first-child]:col-span-3">
      {children}
    </div>
  );
}

function HeaderStat({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-w-[88px] gap-[3px] border-l border-border pl-[18px] max-[560px]:min-w-0 max-[560px]:rounded-control max-[560px]:border max-[560px]:border-border max-[560px]:bg-panel-muted max-[560px]:p-2 [&_span]:text-[0.78rem] [&_span]:font-extrabold [&_span]:uppercase [&_span]:text-text-muted max-[560px]:[&_span]:text-[0.68rem] max-[560px]:[&_strong]:text-sm">
      {children}
    </div>
  );
}
