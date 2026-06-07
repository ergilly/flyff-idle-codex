import { Actions } from "@/components/atoms/Actions";
import { Button } from "@/components/atoms/Button";
import { MutedText } from "@/components/atoms/MutedText";
import { Panel } from "@/components/atoms/Panel";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import { PointsSummary } from "@/components/molecules/main-application/ContentHeading";

type CharacterSkillsPanelProps = {
  availableSkillPoints: number;
  onApplySkills: () => void;
  onResetSkills: () => void;
  pendingSkillPoints: number;
};

export function CharacterSkillsPanel({
  availableSkillPoints,
  onApplySkills,
  onResetSkills,
  pendingSkillPoints
}: CharacterSkillsPanelProps) {
  return (
    <Panel as="section" style={{ maxWidth: 720 }}>
      <SectionHeading eyebrow="Skills" title="Character Skills" />
      <PointsSummary>
        <span>Available skill points</span>
        <strong>{availableSkillPoints}</strong>
      </PointsSummary>
      <MutedText>Skill trees and learned abilities will be added here later.</MutedText>
      <Actions gap={10}>
        <Button type="button" onClick={onApplySkills} disabled={pendingSkillPoints === 0}>
          Apply
        </Button>
        <Button variant="secondary" type="button" onClick={onResetSkills} disabled={pendingSkillPoints === 0}>
          Reset
        </Button>
      </Actions>
    </Panel>
  );
}
