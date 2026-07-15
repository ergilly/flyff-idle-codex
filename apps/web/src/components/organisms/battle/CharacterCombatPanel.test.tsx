import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { buildCharacter, buildSkill, buildSkillTab } from "@/test/fixtures";
import { CharacterCombatPanel } from "./CharacterCombatPanel";

function buildProps(
  overrides: Partial<ComponentProps<typeof CharacterCombatPanel>> = {}
): ComponentProps<typeof CharacterCombatPanel> {
  const skill = buildSkill();
  return {
    actionSlots: [null, null, null, null, null, null],
    activeEquipmentSet: 0,
    activeTab: "equipment",
    battleLog: [],
    character: buildCharacter(),
    characterAttackTiming: { attacksPerSecond: 0.5, secondsPerAttack: 2 },
    characterFp: 30,
    characterMaxFp: 40,
    characterHp: 80,
    characterMaxHp: 100,
    characterMp: 20,
    characterMaxMp: 50,
    combatStats: [{ label: "STR", value: "15" }],
    cooldownRemainingByResource: { hp: 0, mp: 0, fp: 0 },
    isCombatInProgress: false,
    itemsById: {},
    onAddSkillToActionSlot: jest.fn(),
    onClearBattleLog: jest.fn(),
    onEquipConsumableItem: jest.fn(),
    onInsertSkillAtActionSlot: jest.fn(),
    onMoveActionSlot: jest.fn(),
    onRemoveActionSlot: jest.fn(),
    onSelectActionSlot: jest.fn(),
    onSelectEquipmentSlot: jest.fn(),
    onSelectEquipmentSet: jest.fn(),
    onTabChange: jest.fn(),
    onUseRecoveryItem: jest.fn(),
    recoveryItemsByResource: { hp: [], mp: [], fp: [] },
    selectedActionSlotIndex: 0,
    selectedEquipmentSlot: null,
    skillTabs: [buildSkillTab({ skills: [skill] })],
    skills: [skill],
    ...overrides
  };
}

it("composes resources, equipment, stats, recovery, and log panels", () => {
  const props = buildProps();
  render(<CharacterCombatPanel {...props} />);
  expect(screen.getByTestId("battle_character_header_hp_span_status_value")).toHaveTextContent("80 / 100");
  expect(screen.getByTestId("battle_panel_food")).toBeInTheDocument();
  expect(screen.getByTestId("equipment_div_layout")).toBeInTheDocument();
  expect(screen.getByTestId("battle_panel_character_stats")).toHaveTextContent("STR");
  expect(screen.getByTestId("battle_panel_monster_loot_box")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Skills" }));
  expect(props.onTabChange).toHaveBeenCalledWith("skills");
});

it("renders the skill tree and action wheel for the skills tab", () => {
  render(<CharacterCombatPanel {...buildProps({ activeTab: "skills" })} />);
  expect(screen.getByTestId("battle_div_skill_trees")).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Action wheel" })).toBeInTheDocument();
});
