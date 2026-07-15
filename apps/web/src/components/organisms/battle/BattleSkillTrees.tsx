"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { MutedText } from "@/components/atoms/MutedText";
import { type Character } from "@/lib/api";
import { getSkillIconSrc, skillDragDataType } from "@/lib/battle/actionSlots";
import { cx } from "@/lib/classNames";
import { type SkillDefinition, type SkillTreeTab } from "@/lib/skillTrees";
import { getTestIdSegment } from "@/lib/testIds";

export function BattleSkillTrees({
  character,
  onAddSkillToActionSlot,
  skillTabs
}: {
  character: Character;
  onAddSkillToActionSlot: (skill: SkillDefinition) => void;
  skillTabs: SkillTreeTab[];
}) {
  const [activeTier, setActiveTier] = useState(skillTabs[skillTabs.length - 1]?.tier ?? "vagrant");
  const activeTab = skillTabs.find((tab) => tab.tier === activeTier) ?? skillTabs[skillTabs.length - 1];
  const activeSkills = activeTab?.skills ?? [];

  useEffect(() => {
    if (skillTabs.length > 0 && !skillTabs.some((tab) => tab.tier === activeTier)) {
      setActiveTier(skillTabs[skillTabs.length - 1]?.tier ?? "vagrant");
    }
  }, [activeTier, skillTabs]);

  if (!activeTab) {
    return <MutedText data-testid="battle_p_no_skill_trees">No skill trees are available yet.</MutedText>;
  }

  return (
    <div className="grid gap-2" data-testid="battle_div_skill_trees">
      <div className="relative pt-[34px]" data-testid="battle_div_skill_tree_shell">
        <div
          aria-label="Battle skill trees"
          className="absolute left-[3px] top-0 z-[2] flex flex-wrap justify-start"
          data-testid="battle_div_skill_tabs"
          role="tablist"
        >
          {skillTabs.map((tab) => (
            <button
              aria-controls={`battle-skill-tree-${tab.tier}`}
              aria-selected={activeTab.tier === tab.tier}
              data-testid={`battle_skills_button_tab_${getTestIdSegment(tab.tier)}`}
              className={cx(
                "min-h-[34px] w-[92px] rounded-t-control border-2 border-b-0 border-border bg-[linear-gradient(180deg,rgba(24,23,17,0.96),rgba(8,8,7,0.96))] px-2 py-1.5 text-xs font-extrabold text-text-muted shadow-[inset_0_0_0_1px_rgba(255,225,115,0.1)] hover:bg-panel-muted hover:text-foreground",
                activeTab.tier === tab.tier &&
                  "bg-[linear-gradient(180deg,rgba(255,225,115,0.2),rgba(29,26,18,0.98))] text-foreground"
              )}
              id={`battle-skill-tab-${tab.tier}`}
              key={tab.tier}
              onClick={() => setActiveTier(tab.tier)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          aria-labelledby={`battle-skill-tab-${activeTab.tier}`}
          className="relative z-[3] grid min-h-[168px] place-items-center rounded-card border-2 border-border bg-[radial-gradient(circle_at_50%_38%,rgba(255,230,119,0.08),transparent_34%),linear-gradient(180deg,rgba(14,14,11,0.94),rgba(0,0,0,0.98))] p-2 shadow-[inset_0_0_0_1px_rgba(255,225,115,0.12)]"
          data-testid={`battle_div_skill_tree_${getTestIdSegment(activeTab.tier)}`}
          id={`battle-skill-tree-${activeTab.tier}`}
          role="tabpanel"
        >
          <div
            className="relative w-full"
            data-testid={`battle_div_skill_tree_canvas_${getTestIdSegment(activeTab.tier)}`}
            style={{ aspectRatio: `${activeTab.imageWidth} / ${activeTab.imageHeight}` }}
          >
            <Image
              alt={`${activeTab.label} skill tree`}
              className="absolute inset-0 h-full w-full object-contain"
              height={activeTab.imageHeight}
              src={activeTab.imageSrc}
              unoptimized
              width={activeTab.imageWidth}
            />
            {activeSkills.map((skill) => {
              const level = character.skillLevels[skill.id] ?? 0;
              const canAddSkill = level > 0;

              return (
                <button
                  aria-label={`${canAddSkill ? "Add" : "Unavailable"} ${skill.name} to action bar`}
                  data-testid={`battle_skills_button_add_${getTestIdSegment(skill.id)}`}
                  className={cx(
                    "group absolute grid aspect-square w-[15%] min-w-[46px] max-w-[72px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[5px] border-2 border-[#12100c] bg-black/55 shadow-[0_2px_0_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.24)] transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffe173]",
                    !canAddSkill && "opacity-70"
                  )}
                  draggable={canAddSkill}
                  key={skill.id}
                  onClick={(event) => {
                    if (canAddSkill && event.detail > 0 && event.detail % 2 === 0) {
                      onAddSkillToActionSlot(skill);
                    }
                  }}
                  onDragStart={(event) => {
                    if (!canAddSkill) {
                      event.preventDefault();
                      return;
                    }

                    event.dataTransfer.effectAllowed = "copy";
                    event.dataTransfer.setData(skillDragDataType, skill.id);
                  }}
                  style={{ left: `${skill.x}%`, top: `${skill.y}%` }}
                  title={skill.name}
                  type="button"
                >
                  <Image
                    alt=""
                    aria-hidden="true"
                    className={cx("h-full w-full rounded-[3px] object-cover", !canAddSkill && "grayscale")}
                    draggable={false}
                    height={38}
                    src={getSkillIconSrc(skill)}
                    unoptimized
                    width={38}
                  />
                  {level > 0 && (
                    <span
                      className="absolute bottom-0 right-0.5 min-w-4 text-right text-[0.72rem] font-extrabold leading-3 text-white [text-shadow:-1px_-1px_0_#b72b2b,0_-1px_0_#b72b2b,1px_-1px_0_#b72b2b,-1px_0_0_#b72b2b,1px_0_0_#b72b2b,-1px_1px_0_#b72b2b,0_1px_0_#b72b2b,1px_1px_0_#b72b2b]"
                      data-testid={`battle_span_skill_level_${getTestIdSegment(skill.id)}`}
                    >
                      {level >= skill.maxLevel ? "MAX" : level}
                    </span>
                  )}
                  <span
                    className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-[50] hidden w-[190px] -translate-x-1/2 rounded-control border-2 border-border bg-[linear-gradient(180deg,rgba(31,29,22,0.98),rgba(9,9,7,0.98))] p-2 text-left text-xs text-foreground shadow-[0_10px_24px_rgba(0,0,0,0.5)] group-hover:block group-focus-visible:block"
                    data-testid={`battle_span_skill_tooltip_${getTestIdSegment(skill.id)}`}
                    role="tooltip"
                  >
                    <strong
                      className="block text-sm"
                      data-testid={`battle_strong_skill_tooltip_name_${getTestIdSegment(skill.id)}`}
                    >
                      {skill.name}
                    </strong>
                    <span
                      className="mt-0.5 block font-bold text-text-muted"
                      data-testid={`battle_span_skill_tooltip_level_${getTestIdSegment(skill.id)}`}
                    >
                      Level {level}/{skill.maxLevel}
                    </span>
                    {skill.description && (
                      <span
                        className="mt-1 block leading-4 text-text-muted"
                        data-testid={`battle_span_skill_tooltip_description_${getTestIdSegment(skill.id)}`}
                      >
                        {skill.description}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
