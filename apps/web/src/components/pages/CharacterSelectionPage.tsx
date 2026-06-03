import { CharacterRoster } from "@/components/organisms/CharacterRoster";
import { PageHeader } from "@/components/molecules/PageHeader";
import { GameTemplate } from "@/components/templates/GameTemplate";

export function CharacterSelectionPage() {
  return (
    <GameTemplate>
      <PageHeader
        eyebrow="Character Select"
        title="Pick your adventurer"
        description="Your roster will later connect to persisted player data and progression systems."
      />
      <CharacterRoster />
    </GameTemplate>
  );
}
