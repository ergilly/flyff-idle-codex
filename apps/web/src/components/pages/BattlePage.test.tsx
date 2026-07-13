import { fireEvent, render, screen, within } from "@testing-library/react";
import { BattlePage } from "./BattlePage";
import type { Character, ItemMetadata, MapMonsterFamily } from "@/lib/api";
import { getAutoAttackTiming, getCombatStats } from "@/lib/combatStats";
import type { SkillDefinition, SkillTreeTab } from "@/lib/skillTrees";

const character: Character = {
  id: "char-1",
  slotIndex: 0,
  name: "Saint Morning",
  gender: "female",
  job: "Mercenary",
  progressionRank: "normal",
  level: 65,
  exp: 0,
  penya: 123456,
  stats: { str: 20, sta: 18, dex: 17, int: 15 },
  skillLevels: { clean: 1, empower: 1, splmash: 1 },
  equipment: {
    helmet: null,
    suit: null,
    gloves: null,
    boots: null,
    flying: null,
    csBoots: null,
    csGloves: null,
    csSuit: null,
    csHelm: null,
    mask: null,
    cloak: null,
    ammo: null,
    offhand: null,
    mainhand: null,
    ringR: null,
    earringR: null,
    necklace: null,
    earringL: null,
    ringL: null
  },
  inventory: { size: 50, items: [] }
};

function skill(overrides: Partial<SkillDefinition>): SkillDefinition {
  return {
    classId: 1,
    className: "Vagrant",
    costPerLevel: 1,
    description: "Hit cleanly.",
    icon: "clean.png",
    id: "clean",
    maxLevel: 3,
    name: "Clean Hit",
    requiredLevel: 1,
    requirements: [],
    tier: "vagrant",
    x: 30,
    y: 35,
    ...overrides
  };
}

const cleanHit = skill({});
const empowered = skill({
  classId: 2,
  className: "Mercenary",
  description: "Empower your weapon.",
  icon: "empower.png",
  id: "empower",
  name: "Empower Weapon",
  requiredLevel: 15,
  tier: "first",
  x: 50,
  y: 50
});
const splmash = skill({
  classId: 2,
  className: "Mercenary",
  icon: "splmash.png",
  id: "splmash",
  name: "Splmash",
  requiredLevel: 15,
  tier: "first",
  x: 70,
  y: 50
});
const stepSkill = skill({
  combo: "step",
  icon: "step.png",
  id: "step",
  name: "Step Strike",
  x: 20,
  y: 65
});
const circularSkill = skill({
  combo: "circular",
  icon: "circular.png",
  id: "circular",
  name: "Circle Slash",
  x: 40,
  y: 65
});
const finishSkill = skill({
  combo: "finish",
  icon: "finish.png",
  id: "finish",
  name: "Final Blow",
  x: 60,
  y: 65
});
const generalSkill = skill({
  combo: "general",
  icon: "general.png",
  id: "general",
  name: "Recovery",
  x: 80,
  y: 65
});

const skillTabs: SkillTreeTab[] = [
  {
    tier: "vagrant",
    label: "Vagrant",
    imageSrc: "/images/skills/Vagrant.png",
    imageWidth: 225,
    imageHeight: 135,
    skills: [cleanHit]
  },
  {
    tier: "first",
    label: "Mercenary",
    imageSrc: "/images/skills/1st-job/Back_Me.png",
    imageWidth: 225,
    imageHeight: 135,
    skills: [empowered, splmash, stepSkill, circularSkill, finishSkill, generalSkill]
  }
];

const woodenSword: ItemMetadata = {
  id: "3497",
  name: "Wooden Sword",
  description: "A basic Wooden Sword.",
  icon: "weaswowooden.png",
  category: "weapon",
  subcategory: "sword",
  rarity: "common",
  level: 1,
  sex: null,
  requiredJob: null,
  minAttack: 5,
  maxAttack: 7,
  attackSpeed: "fast",
  twoHanded: false,
  minDefense: null,
  maxDefense: null,
  abilities: [
    { parameter: "criticalchance", add: 10, rate: true },
    { parameter: "criticaldamage", add: 20, rate: true }
  ]
};

const rareGem: ItemMetadata = {
  ...woodenSword,
  id: "9001",
  name: "Rare Gem",
  description: "A rare monster drop.",
  icon: "rare_gem.png",
  category: "material",
  subcategory: "upgrade",
  rarity: "rare",
  abilities: []
};

const starCandy: ItemMetadata = {
  ...woodenSword,
  id: "9002",
  name: "Star Candy",
  description: "A healing consumable.",
  icon: "star_candy.png",
  category: "recoveryitem",
  subcategory: null,
  consumable: true,
  rarity: "common",
  abilities: []
};

const questStone: ItemMetadata = {
  ...woodenSword,
  id: "9003",
  name: "Quest Stone",
  description: "A quest drop.",
  icon: "quest_stone.png",
  category: "booty",
  subcategory: null,
  rarity: "common",
  abilities: []
};

const monsterFamily: MapMonsterFamily = {
  family: "Aibatt",
  location: { region: "Flaris", x: 100, y: 200 },
  name: "Aibatt",
  questDrops: [],
  variants: [
    {
      id: 1,
      name: "Aibatt",
      level: 1,
      rank: "normal",
      element: "none",
      icon: "mvr_aibatt.png",
      hp: 120,
      minAttack: 3,
      maxAttack: 5,
      defense: 2,
      magicDefense: 1,
      minDropGold: 1,
      maxDropGold: 3,
      drops: [
        { item: 9003, probabilityRange: "1% - 2%" },
        { item: 9001, probabilityRange: "4% - 5%" },
        { item: 9002, probabilityRange: "8% - 10%" }
      ],
      variantRank: "normal"
    }
  ]
};

const comboCharacter = {
  ...character,
  skillLevels: {
    ...character.skillLevels,
    step: 1,
    circular: 1,
    finish: 1,
    general: 1
  }
};

function createDataTransfer() {
  const data = new Map<string, string>();
  const dataTransfer = {
    dropEffect: "none",
    effectAllowed: "all",
    types: [] as string[],
    getData(type: string) {
      return data.get(type) ?? "";
    },
    setData(type: string, value: string) {
      data.set(type, value);

      if (!this.types.includes(type)) {
        this.types.push(type);
      }
    }
  };

  return dataTransfer;
}

function doubleClickAddSkill(name: string) {
  const button = screen.getByRole("button", { name });

  fireEvent.click(button, { detail: 1 });
  fireEvent.click(button, { detail: 2 });
}

function rapidClickAddSkill(name: string, doubleClicks: number) {
  const button = screen.getByRole("button", { name });

  for (let clickCount = 1; clickCount <= doubleClicks * 2; clickCount += 1) {
    fireEvent.click(button, { detail: clickCount });
  }
}

function doubleClickActionSlot(name: string) {
  const button = screen.getByRole("button", { name });

  fireEvent.click(button, { detail: 1 });
  fireEvent.click(button, { detail: 2 });
}

describe("BattlePage", () => {
  it("renders expanded combat-only character stats", () => {
    render(
      <BattlePage
        character={{
          ...character,
          equipment: {
            ...character.equipment,
            mainhand: woodenSword.id
          }
        }}
        itemsById={{ [woodenSword.id]: woodenSword }}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    const statsPanel = within(screen.getByTestId("battle_div_character_stats"));

    expect(statsPanel.getByText("Attack")).toBeInTheDocument();
    expect(screen.getByTestId("battle_span_info_label_defense")).toBeInTheDocument();
    expect(statsPanel.getByText("Attack Speed")).toBeInTheDocument();
    expect(statsPanel.getByText("Critical Chance")).toBeInTheDocument();
    expect(statsPanel.getByText("Critical Damage")).toBeInTheDocument();
    expect(statsPanel.getByText("DCT")).toBeInTheDocument();
    expect(statsPanel.getByText("Hit Rate")).toBeInTheDocument();
    expect(statsPanel.getByText("Melee Block")).toBeInTheDocument();
    expect(statsPanel.getByText("Ranged Block")).toBeInTheDocument();
    expect(statsPanel.queryByText("Level")).not.toBeInTheDocument();
    expect(statsPanel.queryByText("Job")).not.toBeInTheDocument();
    expect(statsPanel.queryByText("Penya")).not.toBeInTheDocument();
  });

  it("groups character combat stats into compact stat boxes", () => {
    render(
      <BattlePage
        character={character}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    expect(
      within(screen.getByTestId("battle_div_character_stats_group_attributes")).getByText("STR")
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("battle_div_character_stats_group_resources")).getByText("Max HP")
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("battle_div_character_stats_group_offense")).getByText("Attack")
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("battle_div_character_stats_group_speed_accuracy")).getByText("Attack Speed")
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("battle_div_character_stats_group_defense")).getByText("Melee Block")
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("battle_div_character_stats_group_recovery")).getByText(
        "HP Recovery After Kill"
      )
    ).toBeInTheDocument();
  });

  it("calculates the player attack bar timing from auto attack speed", () => {
    render(
      <BattlePage
        character={character}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    const timing = getAutoAttackTiming(character, getCombatStats(character, {}));

    expect(screen.getByTestId("battle_div_timeline_speed_player_attack")).toHaveTextContent(
      `Attack every ${timing.secondsPerAttack.toFixed(1)}s`
    );
  });

  it("keeps attack interval bars empty until combat is in progress", () => {
    render(
      <BattlePage
        character={character}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    expect(screen.getByTestId("battle_div_timeline_fill_player_attack")).toHaveStyle({
      transform: "scaleX(0)"
    });
    expect(screen.getByTestId("battle_div_timeline_fill_monster_attack")).toHaveStyle({
      transform: "scaleX(0)"
    });
  });

  it("hides combat options when no monster is selected", () => {
    render(
      <BattlePage
        character={character}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    expect(screen.queryByTestId("battle_div_monster_combat_options")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start combat" })).not.toBeInTheDocument();
  });

  it("does not show fake monster combat stats when no monster is selected", () => {
    render(
      <BattlePage
        character={character}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    expect(screen.getByTestId("battle_monster_header_no_target")).toHaveTextContent("No target");
    expect(screen.getByTestId("battle_p_no_monster_stats")).toHaveTextContent(
      "No monster stats are available yet."
    );
    expect(screen.queryByTestId("battle_div_monster_offensive_stats")).not.toBeInTheDocument();
    expect(screen.queryByTestId("battle_div_monster_defensive_stats")).not.toBeInTheDocument();
    expect(screen.queryByTestId("battle_div_monster_combat_options")).not.toBeInTheDocument();
    expect(screen.queryByTestId("battle_monster_header_hp_span_status_value")).not.toBeInTheDocument();
  });

  it("animates attack interval bars while combat is in progress", () => {
    render(
      <BattlePage
        character={character}
        itemsById={{
          [questStone.id]: questStone,
          [rareGem.id]: rareGem,
          [starCandy.id]: starCandy,
          [woodenSword.id]: woodenSword
        }}
        selectedMonsterFamily={monsterFamily}
        skillTabs={skillTabs}
      />
    );

    const timing = getAutoAttackTiming(character, getCombatStats(character, {}));

    expect(screen.getByTestId("battle_div_timeline_fill_player_attack")).toHaveStyle({
      transform: "scaleX(0)"
    });

    fireEvent.click(screen.getByRole("button", { name: "Start combat" }));

    expect(screen.getByTestId("battle_div_timeline_fill_player_attack")).toHaveStyle({
      animation: `battle-attack-fill ${Math.max(0.1, timing.secondsPerAttack)}s linear infinite`
    });
    expect(screen.getByTestId("battle_div_timeline_fill_monster_attack")).toHaveStyle({
      animation: "battle-attack-fill 2.4s linear infinite"
    });
  });

  it("splits monster stats into offensive, defensive, and combat option sections", () => {
    render(
      <BattlePage
        character={character}
        itemsById={{ [rareGem.id]: rareGem, [starCandy.id]: starCandy, [woodenSword.id]: woodenSword }}
        selectedMonsterFamily={monsterFamily}
        skillTabs={skillTabs}
      />
    );

    expect(screen.getByTestId("battle_heading_monster_offensive_stats")).toHaveTextContent("Offensive Stats");
    expect(screen.getByTestId("battle_heading_monster_defensive_stats")).toHaveTextContent("Defensive Stats");
    expect(screen.getByTestId("battle_heading_monster_combat_options")).toHaveTextContent("Combat Options");
    expect(screen.getByTestId("battle_div_monster_more_stats")).toHaveClass("min-[900px]:grid-cols-3");
    expect(screen.getByTestId("battle_div_monster_combat_buttons")).not.toHaveClass(
      "min-[560px]:grid-cols-2"
    );
    expect(
      within(screen.getByTestId("battle_div_monster_offensive_stats")).getByText("Damage")
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("battle_div_monster_offensive_stats")).getByText("Player Damage")
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("battle_div_monster_offensive_stats")).getByText("Player DPS")
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("battle_div_monster_offensive_stats")).getByText("Time To Kill")
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("battle_div_monster_defensive_stats")).getByText("Magic DEF")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start combat" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View monster drops" })).toBeInTheDocument();
    expect(screen.getByTestId("battle_heading_monster_loot_box")).toHaveTextContent("Loot Box");
    expect(screen.getByTestId("battle_p_monster_loot_box_empty")).toHaveTextContent("No loot collected yet.");
  });

  it("run away stops combat and clears the selected monster target", () => {
    const handleClearMonsterTarget = jest.fn();

    render(
      <BattlePage
        character={character}
        itemsById={{} as Record<string, ItemMetadata>}
        onClearMonsterTarget={handleClearMonsterTarget}
        selectedMonsterFamily={monsterFamily}
        skillTabs={skillTabs}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Start combat" }));
    fireEvent.click(screen.getByRole("button", { name: "Run away" }));

    expect(handleClearMonsterTarget).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("battle_div_timeline_fill_player_attack")).toHaveStyle({
      transform: "scaleX(0)"
    });
  });

  it("opens a monster drops overlay from combat options", () => {
    render(
      <BattlePage
        character={character}
        itemsById={{
          [questStone.id]: questStone,
          [rareGem.id]: rareGem,
          [starCandy.id]: starCandy,
          [woodenSword.id]: woodenSword
        }}
        selectedMonsterFamily={monsterFamily}
        skillTabs={skillTabs}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "View monster drops" }));

    expect(screen.getByRole("dialog", { name: /Aibatt/i })).toBeInTheDocument();
    expect(screen.getByTestId("battle_div_monster_drops_overlay")).toHaveTextContent("Quest Stone");
    expect(screen.getByTestId("battle_div_monster_drops_summary")).toHaveTextContent("Quest Item");
    expect(screen.getByTestId("battle_span_monster_quest_drop_image_quest_stone")).toHaveClass("h-9", "w-9");
    expect(screen.getByTestId("battle_span_monster_quest_drop_image_quest_stone")).not.toHaveClass("border");
    expect(screen.getByTestId("battle_strong_monster_quest_drop_name_0")).toHaveClass("!text-sm");
    expect(screen.getByTestId("battle_strong_monster_quest_drop_name_0")).not.toHaveClass("text-[#5fb3ff]");
    expect(screen.getByTestId("battle_strong_monster_quest_drop_name_0")).toHaveTextContent("Quest Stone");
    expect(screen.queryByTestId("battle_div_monster_quest_drops")).not.toBeInTheDocument();
    expect(screen.queryByTestId("battle_button_toggle_monster_quest_drops")).not.toBeInTheDocument();
    expect(screen.getByTestId("battle_heading_monster_drops_category_upgrade_materials")).toHaveTextContent(
      "Upgrade Materials"
    );
    expect(screen.getByTestId("battle_div_monster_drop_upgrade_materials_0")).toHaveTextContent("Rare Gem");
    expect(screen.getByTestId("battle_strong_monster_drop_name_upgrade_materials_0")).toHaveClass(
      "text-[#f5d451]"
    );
    expect(screen.getByTestId("battle_heading_monster_drops_category_upgrade_materials")).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByTestId("battle_heading_monster_drops_category_consumables")).toHaveTextContent(
      "Consumables"
    );
    expect(screen.getByTestId("battle_div_monster_drop_consumables_0")).toHaveTextContent("Star Candy");
    fireEvent.click(screen.getByTestId("battle_heading_monster_drops_category_upgrade_materials"));
    expect(screen.getByTestId("battle_heading_monster_drops_category_upgrade_materials")).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(screen.queryByTestId("battle_div_monster_drop_upgrade_materials_0")).not.toBeInTheDocument();
    expect(screen.getByTestId("battle_div_monster_drops_summary")).not.toHaveTextContent("Drops");
    expect(screen.getByTestId("battle_div_monster_drops_overlay")).not.toHaveTextContent("1% - 2%");
    expect(screen.getByTestId("battle_div_monster_drops_overlay")).not.toHaveTextContent("4% - 5%");

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByTestId("battle_div_monster_drops_overlay")).not.toBeInTheDocument();
  });

  it("renders skill trees and double-click adds skills to the first available action slots", () => {
    render(
      <BattlePage
        character={character}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Skills" }));
    expect(screen.getByRole("tab", { name: "Mercenary" })).toBeInTheDocument();

    doubleClickAddSkill("Add Empower Weapon to action bar");
    doubleClickAddSkill("Add Splmash to action bar");
    fireEvent.click(screen.getByRole("tab", { name: "Vagrant" }));
    doubleClickAddSkill("Add Clean Hit to action bar");

    expect(screen.getByRole("button", { name: "Action slot 4: Empower Weapon" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 3: Splmash" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 2: Clean Hit" })).toBeInTheDocument();
  });

  it("adds skills for every rapid double click without waiting for dblclick cooldown", () => {
    render(
      <BattlePage
        character={character}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Skills" }));
    rapidClickAddSkill("Add Empower Weapon to action bar", 2);

    expect(screen.getByRole("button", { name: "Action slot 4: Empower Weapon" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 3: Empower Weapon" })).toBeInTheDocument();
  });

  it("clears a packed action bar by rapidly double-clicking the first filled slot", () => {
    render(
      <BattlePage
        character={character}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Skills" }));
    rapidClickAddSkill("Add Empower Weapon to action bar", 6);

    const firstFilledSlot = screen.getByRole("button", { name: "Action slot 4: Empower Weapon" });

    for (let clickCount = 1; clickCount <= 12; clickCount += 1) {
      fireEvent.click(firstFilledSlot, { detail: clickCount });
    }

    expect(screen.getByRole("button", { name: "Action slot 4" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 6" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 5" })).toBeInTheDocument();
  });

  it("inserts dropped skills into filled action slots and pushes later skills forward", () => {
    render(
      <BattlePage
        character={character}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Skills" }));
    doubleClickAddSkill("Add Empower Weapon to action bar");
    doubleClickAddSkill("Add Splmash to action bar");
    fireEvent.click(screen.getByRole("tab", { name: "Vagrant" }));

    const insertDrag = createDataTransfer();
    fireEvent.dragStart(screen.getByRole("button", { name: "Add Clean Hit to action bar" }), {
      dataTransfer: insertDrag
    });
    fireEvent.drop(screen.getByRole("button", { name: "Action slot 3: Splmash" }), {
      dataTransfer: insertDrag
    });

    expect(screen.getByRole("button", { name: "Action slot 4: Empower Weapon" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 3: Clean Hit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 2: Splmash" })).toBeInTheDocument();

    const reorderDrag = createDataTransfer();
    fireEvent.dragStart(screen.getByRole("button", { name: "Action slot 2: Splmash" }), {
      dataTransfer: reorderDrag
    });
    fireEvent.drop(screen.getByRole("button", { name: "Action slot 4: Empower Weapon" }), {
      dataTransfer: reorderDrag
    });

    expect(screen.getByRole("button", { name: "Action slot 4: Splmash" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 3: Empower Weapon" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 2: Clean Hit" })).toBeInTheDocument();
  });

  it("adds combo skills only in a valid action sequence", () => {
    render(
      <BattlePage
        character={comboCharacter}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Skills" }));
    doubleClickAddSkill("Add Circle Slash to action bar");
    expect(screen.getByRole("button", { name: "Action slot 4" })).toBeInTheDocument();

    doubleClickAddSkill("Add Step Strike to action bar");
    doubleClickAddSkill("Add Recovery to action bar");
    expect(screen.queryByRole("button", { name: "Action slot 3: Recovery" })).not.toBeInTheDocument();

    doubleClickAddSkill("Add Circle Slash to action bar");
    doubleClickAddSkill("Add Final Blow to action bar");
    doubleClickAddSkill("Add Recovery to action bar");

    expect(screen.getByRole("button", { name: "Action slot 4: Step Strike" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 3: Circle Slash" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 2: Final Blow" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 1: Recovery" })).toBeInTheDocument();
  });

  it("removes and reorders action slots with double click and drag rules", () => {
    render(
      <BattlePage
        character={comboCharacter}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Skills" }));
    doubleClickAddSkill("Add Step Strike to action bar");
    doubleClickAddSkill("Add Circle Slash to action bar");
    doubleClickAddSkill("Add Final Blow to action bar");
    doubleClickAddSkill("Add Recovery to action bar");

    expect(
      screen.queryByRole("button", { name: "Remove selected action slot skill" })
    ).not.toBeInTheDocument();

    const invalidDrag = createDataTransfer();
    fireEvent.dragStart(screen.getByRole("button", { name: "Action slot 4: Step Strike" }), {
      dataTransfer: invalidDrag
    });
    fireEvent.drop(screen.getByRole("button", { name: "Action slot 3: Circle Slash" }), {
      dataTransfer: invalidDrag
    });

    expect(screen.getByRole("button", { name: "Action slot 4: Step Strike" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 3: Circle Slash" })).toBeInTheDocument();

    doubleClickActionSlot("Action slot 1: Recovery");
    expect(screen.getByRole("button", { name: "Action slot 1" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Vagrant" }));
    doubleClickAddSkill("Add Clean Hit to action bar");
    expect(screen.getByRole("button", { name: "Action slot 1: Clean Hit" })).toBeInTheDocument();

    const emptySlotDrag = createDataTransfer();
    fireEvent.dragStart(screen.getByRole("button", { name: "Action slot 1: Clean Hit" }), {
      dataTransfer: emptySlotDrag
    });
    fireEvent.drop(screen.getByRole("button", { name: "Action slot 6" }), {
      dataTransfer: emptySlotDrag
    });

    expect(screen.getByRole("button", { name: "Action slot 1: Clean Hit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 6" })).toBeInTheDocument();

    const removeDrag = createDataTransfer();
    fireEvent.dragStart(screen.getByRole("button", { name: "Action slot 1: Clean Hit" }), {
      dataTransfer: removeDrag
    });
    fireEvent.drop(screen.getByRole("group", { name: "Action wheel" }), { dataTransfer: removeDrag });

    expect(screen.getByRole("button", { name: "Action slot 1" })).toBeInTheDocument();
  });

  it("does not remove combo skills when the remaining sequence would be invalid", () => {
    render(
      <BattlePage
        character={comboCharacter}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Skills" }));
    doubleClickAddSkill("Add Step Strike to action bar");
    doubleClickAddSkill("Add Circle Slash to action bar");
    doubleClickAddSkill("Add Final Blow to action bar");

    doubleClickActionSlot("Action slot 4: Step Strike");
    expect(screen.getByRole("button", { name: "Action slot 4: Step Strike" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 3: Circle Slash" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 2: Final Blow" })).toBeInTheDocument();

    doubleClickActionSlot("Action slot 2: Final Blow");
    expect(screen.getByRole("button", { name: "Action slot 2" })).toBeInTheDocument();

    doubleClickActionSlot("Action slot 3: Circle Slash");
    expect(screen.getByRole("button", { name: "Action slot 3" })).toBeInTheDocument();

    doubleClickActionSlot("Action slot 4: Step Strike");
    expect(screen.getByRole("button", { name: "Action slot 4" })).toBeInTheDocument();
  });

  it("removes a slotted skill when it is dragged out without a valid drop target", () => {
    render(
      <BattlePage
        character={character}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Skills" }));
    doubleClickAddSkill("Add Empower Weapon to action bar");
    expect(screen.getByRole("button", { name: "Action slot 4: Empower Weapon" })).toBeInTheDocument();

    const removeDrag = createDataTransfer();
    const slottedSkill = screen.getByRole("button", { name: "Action slot 4: Empower Weapon" });

    fireEvent.dragStart(slottedSkill, { dataTransfer: removeDrag });
    fireEvent.dragEnd(slottedSkill, { dataTransfer: removeDrag });

    expect(screen.getByRole("button", { name: "Action slot 4" })).toBeInTheDocument();
  });
});
