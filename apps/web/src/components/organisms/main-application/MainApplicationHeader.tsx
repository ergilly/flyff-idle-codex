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
    <header
      className="relative z-[1000] flex items-center justify-between gap-[18px] border-b-[3px] border-border bg-[linear-gradient(180deg,rgba(24,23,17,0.96),rgba(8,8,7,0.96)),var(--panel-shell)] px-[22px] py-[18px] shadow-[inset_0_-2px_0_rgba(255,225,115,0.14)] max-[560px]:grid max-[560px]:items-stretch max-[560px]:gap-3 max-[560px]:px-4 max-[560px]:py-3"
      data-testid="game_header"
    >
      <CharacterSummary>
        <div>
          <Eyebrow data-testid="game_header_p_eyebrow">Current character</Eyebrow>
          <h1 data-testid="game_header_h1_character_name">{character.name}</h1>
        </div>
        <HeaderStat testId="game_header_div_stat_class">
          <span data-testid="game_header_span_stat_class_label">Class</span>
          <strong data-testid="game_header_strong_stat_class_value">{character.job}</strong>
        </HeaderStat>
        <HeaderStat testId="game_header_div_stat_level">
          <span data-testid="game_header_span_stat_level_label">Level</span>
          <strong data-testid="game_header_strong_stat_level_value">{character.level}</strong>
        </HeaderStat>
        <HeaderStat testId="game_header_div_stat_penya">
          <span data-testid="game_header_span_stat_penya_label">Penya</span>
          <strong data-testid="game_header_strong_stat_penya_value">
            {character.penya.toLocaleString()}
          </strong>
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
    <div
      className="flex flex-wrap items-center gap-[18px] max-[560px]:grid max-[560px]:grid-cols-3 max-[560px]:items-start max-[560px]:gap-2 [&_h1]:m-0 [&_h1]:text-[1.65rem] [&_h1]:leading-tight max-[560px]:[&_h1]:text-[1.25rem] max-[560px]:[&_h1]:leading-none max-[560px]:[&>div:first-child]:col-span-3"
      data-testid="game_header_div_character_summary"
    >
      {children}
    </div>
  );
}

function HeaderStat({ children, testId }: { children: ReactNode; testId: string }) {
  return (
    <div
      className="grid min-w-[88px] gap-[3px] border-l-2 border-border pl-[18px] max-[560px]:min-w-0 max-[560px]:rounded-control max-[560px]:border-2 max-[560px]:border-border max-[560px]:bg-panel-muted max-[560px]:p-2 [&_span]:text-[0.78rem] [&_span]:font-extrabold [&_span]:uppercase [&_span]:text-text-muted max-[560px]:[&_span]:text-[0.68rem] [&_strong]:text-[#fff1ba] max-[560px]:[&_strong]:text-sm"
      data-testid={testId}
    >
      {children}
    </div>
  );
}
