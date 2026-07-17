import { render, screen } from "@testing-library/react";
import { SkillRequirements } from "./SkillRequirements";
import { buildCharacter, buildSkill } from "@/test/fixtures";

describe("SkillRequirements", () => {
  it("distinguishes met and unmet character requirements", () => {
    const skill = buildSkill({
      id: "target",
      requiredLevel: 20,
      requirements: [{ skill: "parent", skillName: "Parent Skill", level: 3 }]
    });
    render(
      <SkillRequirements
        character={buildCharacter({ level: 19 })}
        skill={skill}
        skillLevels={{ parent: 3 }}
      />
    );

    expect(screen.getByText("Level 20")).toHaveClass("text-[#ff5a58]");
    expect(screen.getByText("Parent Skill Lv. 3")).toHaveClass("text-[#54d978]");
  });
});
