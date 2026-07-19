import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { BattlePage } from "./BattlePage";
import type { Character, ItemMetadata, MapMonsterFamily } from "@/lib/api";
import { applyDeathExpPenalty, getExpRequiredForNextLevel } from "@/lib/characterProgression";
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

const trainingBow: ItemMetadata = {
  ...woodenSword,
  id: "bow-1",
  name: "Training Bow",
  subcategory: "bow",
  twoHanded: true
};

const trainingArrows: ItemMetadata = {
  ...woodenSword,
  id: "arrows-1",
  name: "Training Arrows",
  category: "arrow",
  subcategory: null,
  minAttack: null,
  maxAttack: null,
  twoHanded: null
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

const chickenStick: ItemMetadata = {
  ...starCandy,
  id: "9010",
  name: "Chicken Stick",
  category: "recovery",
  cooldown: 2,
  subcategory: "food",
  abilities: [{ parameter: "hp", add: 970, rate: false }]
};

const grayPill: ItemMetadata = {
  ...chickenStick,
  id: "9014",
  name: "Gray Pill",
  subcategory: "pill",
  abilities: [{ parameter: "hp", add: 1200, rate: false }]
};

const fifthRefresher: ItemMetadata = {
  ...starCandy,
  id: "9011",
  name: "Fifth Refresher",
  category: "recovery",
  subcategory: "refresher",
  abilities: [{ parameter: "mp", add: 375, rate: false }]
};

const vitalDrink: ItemMetadata = {
  ...starCandy,
  id: "9012",
  name: "Vital Drink",
  category: "recovery",
  subcategory: "drink",
  abilities: [{ parameter: "fp", add: 230, rate: false }]
};

const maxHpCloak: ItemMetadata = {
  ...starCandy,
  id: "9013",
  name: "Max HP Cloak",
  category: "fashion",
  subcategory: "cloak",
  abilities: [{ parameter: "hp", add: 100, rate: false }]
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
      experience: 1500,
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

function getStatusCurrentValue(testId: string) {
  const text = screen.getByTestId(testId).textContent ?? "";
  const [currentValue] = text.split("/").map((value) => Number(value.replace(/,/g, "").trim()));

  return currentValue;
}

describe("BattlePage", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

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
    expect(statsPanel.queryByText("Effective Hit Rate")).not.toBeInTheDocument();
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

  it("blocks bow combat until arrows are equipped in the ammo slot", () => {
    const bowCharacter = {
      ...character,
      equipment: { ...character.equipment, mainhand: trainingBow.id }
    };

    render(
      <BattlePage
        character={bowCharacter}
        itemsById={{ [trainingBow.id]: trainingBow }}
        selectedMonsterFamily={monsterFamily}
        skillTabs={skillTabs}
      />
    );

    expect(screen.getByRole("button", { name: "Start combat" })).toBeDisabled();
    expect(screen.getByText("Equip arrows in the Ammo slot to attack with a bow.")).toBeInTheDocument();
  });

  it("consumes an equipped arrow for every attempted bow attack", async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0.9999);
    const bowCharacter = {
      ...character,
      ammoQuantity: 2,
      ammoQuantities: [2, 0, 0],
      equipment: { ...character.equipment, ammo: trainingArrows.id, mainhand: trainingBow.id }
    };
    const items = { [trainingBow.id]: trainingBow, [trainingArrows.id]: trainingArrows };
    const onConsumeEquippedArrow = jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(0);
    const durableMonsterFamily: MapMonsterFamily = {
      ...monsterFamily,
      variants: [{ ...monsterFamily.variants[0], hp: 10000 }]
    };

    const { rerender } = render(
      <BattlePage
        character={bowCharacter}
        itemsById={items}
        onConsumeEquippedArrow={onConsumeEquippedArrow}
        selectedMonsterFamily={durableMonsterFamily}
        skillTabs={skillTabs}
      />
    );
    const timing = getAutoAttackTiming(bowCharacter, getCombatStats(bowCharacter, items), items);

    fireEvent.click(screen.getByRole("button", { name: "Start combat" }));
    await act(async () => jest.advanceTimersByTime(Math.ceil(timing.secondsPerAttack * 1000)));

    expect(onConsumeEquippedArrow).toHaveBeenCalledTimes(1);
    expect(onConsumeEquippedArrow).toHaveBeenCalledWith(0);
    expect(screen.getByTestId("battle_list_combat_log")).toHaveTextContent("misses");

    await act(async () => jest.advanceTimersByTime(Math.ceil(timing.secondsPerAttack * 1000)));
    expect(onConsumeEquippedArrow).toHaveBeenCalledTimes(2);

    rerender(
      <BattlePage
        character={{
          ...bowCharacter,
          ammoQuantity: 0,
          ammoQuantities: [0, 0, 0],
          equipment: { ...bowCharacter.equipment, ammo: null }
        }}
        itemsById={items}
        onConsumeEquippedArrow={onConsumeEquippedArrow}
        selectedMonsterFamily={durableMonsterFamily}
        skillTabs={skillTabs}
      />
    );
    expect(screen.getByTestId("battle_div_timeline_fill_player_attack")).toHaveStyle({
      transform: "scaleX(0)"
    });
    expect(screen.getByTestId("battle_div_timeline_fill_monster_attack")).not.toHaveStyle({
      transform: "scaleX(0)"
    });
    expect(screen.getByRole("button", { name: "Run away" })).toBeInTheDocument();
  });

  it("applies monster attacks when its attack-delay bar completes", () => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0);
    const delayedMonsterFamily: MapMonsterFamily = {
      ...monsterFamily,
      variants: [
        {
          ...monsterFamily.variants[0],
          attackSpeed: 1,
          attackDelay: 6,
          hp: 10000,
          minAttack: 100,
          maxAttack: 100
        }
      ]
    };

    render(
      <BattlePage
        character={character}
        itemsById={{}}
        selectedMonsterFamily={delayedMonsterFamily}
        skillTabs={skillTabs}
      />
    );

    const hpTestId = "battle_character_header_hp_span_status_value";
    const fullHp = getStatusCurrentValue(hpTestId);
    fireEvent.click(screen.getByRole("button", { name: "Start combat" }));

    act(() => jest.advanceTimersByTime(999));
    expect(getStatusCurrentValue(hpTestId)).toBe(fullHp);

    act(() => jest.advanceTimersByTime(1));
    const hpAfterFirstAttack = getStatusCurrentValue(hpTestId);
    expect(hpAfterFirstAttack).toBeLessThan(fullHp);

    act(() => jest.advanceTimersByTime(6999));
    expect(getStatusCurrentValue(hpTestId)).toBe(hpAfterFirstAttack);

    act(() => jest.advanceTimersByTime(1));
    expect(getStatusCurrentValue(hpTestId)).toBeLessThan(hpAfterFirstAttack);
    expect(screen.getByTestId("battle_div_timeline_speed_monster_attack")).toHaveTextContent(
      "Attack 1.0s · Delay 6.0s"
    );
  });

  it("waits for respawn confirmation before applying the death penalty", async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0);
    const doomedCharacter = { ...character, exp: 10000 };
    const lethalMonsterFamily: MapMonsterFamily = {
      ...monsterFamily,
      location: { ...monsterFamily.location, region: "flaris" },
      variants: [
        {
          ...monsterFamily.variants[0],
          attackSpeed: 1,
          hp: 10000,
          minAttack: 1000000,
          maxAttack: 1000000
        }
      ]
    };
    const onUpdateCharacterProgression = jest.fn();
    const onRespawnAtTown = jest.fn();
    const onCharacterResourcesChange = jest.fn();

    render(
      <BattlePage
        character={doomedCharacter}
        itemsById={{}}
        onCharacterResourcesChange={onCharacterResourcesChange}
        onRespawnAtTown={onRespawnAtTown}
        onUpdateCharacterProgression={onUpdateCharacterProgression}
        selectedMonsterFamily={lethalMonsterFamily}
        skillTabs={skillTabs}
      />
    );

    const maxHp = getStatusCurrentValue("battle_character_header_hp_span_status_value");
    fireEvent.click(screen.getByRole("button", { name: "Start combat" }));
    act(() => jest.advanceTimersByTime(1000));

    expect(screen.getByRole("dialog", { name: "You died" })).toBeInTheDocument();
    expect(onUpdateCharacterProgression).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Respawn at town" }));
    const penalty = applyDeathExpPenalty(doomedCharacter);
    await waitFor(() =>
      expect(onUpdateCharacterProgression).toHaveBeenCalledWith({
        exp: penalty.exp,
        level: penalty.level
      })
    );
    expect(onRespawnAtTown).toHaveBeenCalledWith({
      regionId: "flaris",
      townMapId: "flarine-town",
      townName: "Flarine"
    });
    expect(onCharacterResourcesChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ hp: Math.ceil(maxHp * 0.5) })
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

  it("renders preserved HP, MP, and FP resource values", () => {
    render(
      <BattlePage
        character={character}
        initialCharacterResources={{ hp: 10, mp: 20, fp: 30 }}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    expect(screen.getByTestId("battle_character_header_hp_span_status_value")).toHaveTextContent("10 /");
    expect(screen.getByTestId("battle_character_header_mp_span_status_value")).toHaveTextContent("20 /");
    expect(screen.getByTestId("battle_character_header_fp_span_status_value")).toHaveTextContent("30 /");
  });

  it("does not restore character resources when starting combat", () => {
    render(
      <BattlePage
        character={character}
        initialCharacterResources={{ hp: 10, mp: 20, fp: 30 }}
        itemsById={{}}
        selectedMonsterFamily={monsterFamily}
        skillTabs={skillTabs}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Start combat" }));

    expect(screen.getByTestId("battle_character_header_hp_span_status_value")).toHaveTextContent("10 /");
    expect(screen.getByTestId("battle_character_header_mp_span_status_value")).toHaveTextContent("20 /");
    expect(screen.getByTestId("battle_character_header_fp_span_status_value")).toHaveTextContent("30 /");
  });

  it("renders capped persisted combat log entries and clears them", () => {
    const persistedLog = Array.from({ length: 55 }, (_entry, index) => ({
      id: index + 1,
      message: `Persisted log ${index + 1}`,
      tone: "muted" as const
    }));

    render(
      <BattlePage
        character={character}
        initialBattleState={{ droppedItems: [], log: persistedLog }}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    expect(screen.getByTestId("battle_list_combat_log").children).toHaveLength(50);
    expect(screen.getByTestId("battle_list_combat_log")).toHaveTextContent("Persisted log 1");
    expect(screen.getByTestId("battle_list_combat_log")).not.toHaveTextContent("Persisted log 55");

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.queryByTestId("battle_list_combat_log")).not.toBeInTheDocument();
    expect(screen.getByTestId("battle_p_monster_loot_box_empty")).toHaveTextContent("No combat actions yet.");
  });

  it("shows inventory recovery consumables in HP, MP, and FP food dropdowns", () => {
    const handleEquipConsumableItem = jest.fn();

    render(
      <BattlePage
        character={{
          ...character,
          consumableLoadout: {
            fp: { itemId: vitalDrink.id, quantity: 3 },
            hp: { itemId: grayPill.id, quantity: 2 },
            mp: { itemId: fifthRefresher.id, quantity: 5 }
          },
          inventory: {
            size: 50,
            items: [
              { slotIndex: 0, itemId: chickenStick.id, quantity: 8 },
              { slotIndex: 1, itemId: fifthRefresher.id, quantity: 5 },
              { slotIndex: 2, itemId: vitalDrink.id, quantity: 3 },
              { slotIndex: 3, itemId: maxHpCloak.id, quantity: 1 }
            ]
          }
        }}
        itemsById={{
          [chickenStick.id]: chickenStick,
          [fifthRefresher.id]: fifthRefresher,
          [grayPill.id]: grayPill,
          [maxHpCloak.id]: maxHpCloak,
          [vitalDrink.id]: vitalDrink
        }}
        onEquipConsumableItem={handleEquipConsumableItem}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    expect(screen.getByTestId("battle_div_food_control_hp")).toHaveClass("border-[#ff6464]/78");
    expect(screen.getByTestId("battle_div_food_control_mp")).toHaveClass("border-[#5fb3ff]/78");
    expect(screen.getByTestId("battle_div_food_control_fp")).toHaveClass("border-[#64d875]/78");
    expect(screen.getByTestId("battle_span_food_quantity_hp")).toHaveTextContent("x2");
    expect(screen.getByTestId("battle_span_food_recovery_hp")).toHaveTextContent("+1,200");
    expect(screen.getByTestId("battle_span_food_quantity_mp")).toHaveTextContent("x5");
    expect(screen.getByTestId("battle_span_food_recovery_mp")).toHaveTextContent("+375");
    expect(screen.getByTestId("battle_span_food_quantity_fp")).toHaveTextContent("x3");
    expect(screen.getByTestId("battle_span_food_recovery_fp")).toHaveTextContent("+230");

    fireEvent.click(screen.getByRole("button", { name: "Food recovery item" }));
    expect(screen.getAllByRole("menuitem").map((option) => option.textContent)).toEqual([
      "NoneUnequip",
      "Chicken Stickx8 / +970"
    ]);
    expect(screen.getByTestId("battle_div_food_menu_hp")).toHaveTextContent("Chicken Stick");
    expect(screen.getByTestId("battle_div_food_menu_hp")).toHaveTextContent("None");
    expect(screen.getByTestId("battle_div_food_menu_hp")).toHaveTextContent("x8 / +970");
    expect(
      screen.getByTestId("battle_button_food_option_hp_chicken_stick").querySelector("img")
    ).toBeTruthy();
    expect(screen.getByTestId("battle_div_food_menu_hp")).not.toHaveTextContent("Fifth Refresher");
    expect(screen.getByTestId("battle_div_food_menu_hp")).not.toHaveTextContent("Max HP Cloak");

    fireEvent.click(screen.getByTestId("battle_button_food_option_hp_chicken_stick"));
    expect(handleEquipConsumableItem).toHaveBeenCalledWith("hp", 0);
    fireEvent.click(screen.getByRole("button", { name: "Food recovery item" }));
    fireEvent.click(screen.getByTestId("battle_button_food_option_hp_none"));
    expect(handleEquipConsumableItem).toHaveBeenCalledWith("hp", null);
    fireEvent.click(screen.getByRole("button", { name: "MP recovery item" }));
    expect(screen.getByTestId("battle_div_food_menu_mp")).toHaveTextContent("Fifth Refresher");
    expect(screen.getByTestId("battle_div_food_menu_mp")).toHaveTextContent("x5 / +375");
    expect(screen.getByTestId("battle_div_food_menu_mp")).not.toHaveTextContent("Vital Drink");

    fireEvent.click(screen.getByRole("button", { name: "FP recovery item" }));
    expect(screen.getByTestId("battle_div_food_menu_fp")).toHaveTextContent("Vital Drink");
    expect(screen.getByTestId("battle_div_food_menu_fp")).toHaveTextContent("x3 / +230");
    expect(screen.getByTestId("battle_div_food_menu_fp")).not.toHaveTextContent("Chicken Stick");
  });

  it("opens an equipped consumable dropdown with none when there are no inventory options", () => {
    const handleEquipConsumableItem = jest.fn();

    render(
      <BattlePage
        character={{
          ...character,
          consumableLoadout: {
            fp: null,
            hp: { itemId: grayPill.id, quantity: 2 },
            mp: null
          },
          inventory: {
            size: 50,
            items: [{ slotIndex: 3, itemId: maxHpCloak.id, quantity: 1 }]
          }
        }}
        itemsById={{
          [grayPill.id]: grayPill,
          [maxHpCloak.id]: maxHpCloak
        }}
        onEquipConsumableItem={handleEquipConsumableItem}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Food recovery item" }));

    expect(screen.getByTestId("battle_div_food_menu_hp")).toHaveTextContent("None");
    expect(screen.getAllByRole("menuitem").map((option) => option.textContent)).toEqual(["NoneUnequip"]);

    fireEvent.click(screen.getByTestId("battle_button_food_option_hp_none"));

    expect(handleEquipConsumableItem).toHaveBeenCalledWith("hp", null);
  });

  it("recovers character HP when clicking the selected food consumable", async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0);

    const attackingMonsterFamily: MapMonsterFamily = {
      ...monsterFamily,
      variants: [
        {
          ...monsterFamily.variants[0],
          hp: 10000,
          minAttack: 100,
          maxAttack: 100
        }
      ]
    };
    const handleConsumeInventoryItem = jest.fn();

    render(
      <BattlePage
        character={{
          ...character,
          consumableLoadout: {
            fp: null,
            hp: { itemId: chickenStick.id, quantity: 8 },
            mp: null
          }
        }}
        itemsById={{ [chickenStick.id]: chickenStick }}
        onConsumeInventoryItem={handleConsumeInventoryItem}
        selectedMonsterFamily={attackingMonsterFamily}
        skillTabs={skillTabs}
      />
    );

    const fullHpText = screen.getByTestId("battle_character_header_hp_span_status_value").textContent;

    fireEvent.click(screen.getByRole("button", { name: "Start combat" }));

    act(() => {
      jest.advanceTimersByTime(2400);
    });

    expect(screen.getByTestId("battle_character_header_hp_span_status_value")).not.toHaveTextContent(
      fullHpText ?? ""
    );

    fireEvent.click(screen.getByRole("button", { name: "Use Food recovery item" }));

    await waitFor(() =>
      expect(screen.getByTestId("battle_character_header_hp_span_status_value")).toHaveTextContent(
        fullHpText ?? ""
      )
    );
    expect(handleConsumeInventoryItem).toHaveBeenCalledWith("hp");
    expect(screen.getByTestId("battle_list_combat_log")).toHaveTextContent("Chicken Stick restores");
  });

  it("puts used consumables on their item cooldown before they can be used again", async () => {
    jest.useFakeTimers();
    const handleConsumeInventoryItem = jest.fn();

    render(
      <BattlePage
        character={{
          ...character,
          consumableLoadout: {
            fp: null,
            hp: { itemId: chickenStick.id, quantity: 8 },
            mp: null
          }
        }}
        initialCharacterResources={{ hp: 1, mp: 1, fp: 1 }}
        itemsById={{ [chickenStick.id]: chickenStick }}
        onConsumeInventoryItem={handleConsumeInventoryItem}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    const foodButton = screen.getByRole("button", { name: "Use Food recovery item" });

    fireEvent.click(foodButton);

    await waitFor(() => expect(handleConsumeInventoryItem).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(foodButton).toBeDisabled());
    expect(screen.getByTestId("battle_span_food_cooldown_clock_hp")).toHaveStyle({
      background: expect.stringContaining("conic-gradient")
    });
    expect(screen.getByTestId("battle_span_food_cooldown_hp")).toHaveTextContent("2s");

    fireEvent.click(foodButton);
    expect(handleConsumeInventoryItem).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1999);
    });

    expect(foodButton).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => expect(foodButton).not.toBeDisabled());

    fireEvent.click(foodButton);

    await waitFor(() => expect(handleConsumeInventoryItem).toHaveBeenCalledTimes(2));
  });

  it("passively regenerates five percent HP every five seconds while out of combat", () => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0);

    const attackingMonsterFamily: MapMonsterFamily = {
      ...monsterFamily,
      variants: [
        {
          ...monsterFamily.variants[0],
          hp: 10000,
          minAttack: 100,
          maxAttack: 100
        }
      ]
    };

    render(
      <BattlePage
        character={character}
        itemsById={{}}
        selectedMonsterFamily={attackingMonsterFamily}
        skillTabs={skillTabs}
      />
    );

    const hpStatusTestId = "battle_character_header_hp_span_status_value";

    fireEvent.click(screen.getByRole("button", { name: "Start combat" }));

    act(() => {
      jest.advanceTimersByTime(2400);
    });

    const damagedHp = getStatusCurrentValue(hpStatusTestId);

    fireEvent.click(screen.getByRole("button", { name: "Run away" }));

    act(() => {
      jest.advanceTimersByTime(4999);
    });

    expect(getStatusCurrentValue(hpStatusTestId)).toBe(damagedHp);

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(getStatusCurrentValue(hpStatusTestId)).toBeGreaterThan(damagedHp);
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

    const itemsById = {
      [questStone.id]: questStone,
      [rareGem.id]: rareGem,
      [starCandy.id]: starCandy,
      [woodenSword.id]: woodenSword
    };
    const timing = getAutoAttackTiming(character, getCombatStats(character, itemsById), itemsById);

    expect(screen.getByTestId("battle_div_timeline_fill_player_attack")).toHaveStyle({
      transform: "scaleX(0)"
    });

    fireEvent.click(screen.getByRole("button", { name: "Start combat" }));

    expect(screen.getByTestId("battle_div_timeline_fill_player_attack")).toHaveStyle({
      animation: `battle-attack-fill ${Math.max(0.1, timing.secondsPerAttack)}s linear infinite`
    });
    expect(screen.getByTestId("battle_div_timeline_fill_monster_attack")).toHaveStyle({
      animation: "battle-attack-fill 1s linear forwards"
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
    expect(screen.getByTestId("battle_strong_info_value_exp")).toHaveTextContent("1,500");
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
    const characterStatsPanel = within(screen.getByTestId("battle_div_character_stats"));

    expect(characterStatsPanel.getByText("Hit Rate")).toBeInTheDocument();
    expect(screen.getByTestId("battle_strong_info_value_hit_rate")).toHaveTextContent("96%");
    expect(characterStatsPanel.queryByText("Effective Hit Rate")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start combat" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View monster drops" })).toBeInTheDocument();
    expect(screen.getByTestId("battle_heading_monster_loot_box")).toHaveTextContent("Combat Log");
    expect(screen.getByTestId("battle_div_monster_loot_box_inventory")).toHaveClass("overflow-y-auto");
    expect(screen.getByTestId("battle_p_monster_loot_box_empty")).toHaveTextContent("No combat actions yet.");
    expect(screen.getByTestId("battle_div_character_stats_column")).toContainElement(
      screen.getByTestId("battle_panel_monster_loot_box")
    );
    expect(screen.getByTestId("battle_panel_monster")).toContainElement(
      screen.getByTestId("battle_panel_monster_dropped_items")
    );
    expect(screen.getByTestId("battle_heading_monster_dropped_items")).toHaveTextContent("Drops");
    expect(screen.getByTestId("battle_p_monster_dropped_items_empty")).toHaveTextContent(
      "No items have dropped yet."
    );
    expect(screen.getByRole("button", { name: "Loot" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Loot all" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete remaining dropped items" })).toBeDisabled();
  });

  it("resolves a player auto attack when the attack bar fills", () => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0);

    render(
      <BattlePage
        character={{
          ...character,
          equipment: {
            ...character.equipment,
            mainhand: woodenSword.id
          }
        }}
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

    const timing = getAutoAttackTiming(
      {
        ...character,
        equipment: {
          ...character.equipment,
          mainhand: woodenSword.id
        }
      },
      getCombatStats(
        {
          ...character,
          equipment: {
            ...character.equipment,
            mainhand: woodenSword.id
          }
        },
        { [woodenSword.id]: woodenSword }
      ),
      { [woodenSword.id]: woodenSword }
    );

    fireEvent.click(screen.getByRole("button", { name: "Start combat" }));

    act(() => {
      jest.advanceTimersByTime(Math.ceil(timing.secondsPerAttack * 1000));
    });

    expect(screen.getByTestId("battle_list_combat_log")).toHaveTextContent("critically hits");
    expect(screen.getByTestId("battle_monster_header_hp_span_status_value")).not.toHaveTextContent(
      "120 / 120"
    );
  });

  it("pauses attacks after a monster dies and respawns a full hp monster after two seconds", () => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0);

    const lowHpMonsterFamily: MapMonsterFamily = {
      ...monsterFamily,
      variants: [
        {
          ...monsterFamily.variants[0],
          hp: 1,
          minAttack: 100,
          maxAttack: 100
        }
      ]
    };
    const equippedCharacter = {
      ...character,
      equipment: {
        ...character.equipment,
        mainhand: woodenSword.id
      }
    };

    render(
      <BattlePage
        character={equippedCharacter}
        itemsById={{ [woodenSword.id]: woodenSword }}
        selectedMonsterFamily={lowHpMonsterFamily}
        skillTabs={skillTabs}
      />
    );

    const timing = getAutoAttackTiming(
      equippedCharacter,
      getCombatStats(equippedCharacter, { [woodenSword.id]: woodenSword }),
      { [woodenSword.id]: woodenSword }
    );

    expect(screen.getByTestId("battle_monster_header_hp_span_status_value")).toHaveTextContent("1 / 1");

    fireEvent.click(screen.getByRole("button", { name: "Start combat" }));

    act(() => {
      jest.advanceTimersByTime(Math.ceil(timing.secondsPerAttack * 1000));
    });

    expect(screen.getByTestId("battle_list_combat_log")).toHaveTextContent("is defeated");
    expect(screen.getByTestId("battle_div_timeline_fill_player_attack")).toHaveStyle({
      transform: "scaleX(0)"
    });
    expect(screen.getByTestId("battle_div_timeline_fill_monster_attack")).toHaveStyle({
      transform: "scaleX(0)"
    });

    act(() => {
      jest.advanceTimersByTime(1999);
    });

    expect(screen.getByTestId("battle_list_combat_log")).not.toHaveTextContent("spawned");
    expect(screen.getByTestId("battle_div_timeline_fill_player_attack")).toHaveStyle({
      transform: "scaleX(0)"
    });

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.getByTestId("battle_list_combat_log")).toHaveTextContent("spawned");
    expect(screen.getByTestId("battle_monster_header_hp_span_status_value")).toHaveTextContent("1 / 1");
    expect(screen.getByTestId("battle_div_timeline_fill_player_attack")).toHaveStyle({
      animation: `battle-attack-fill ${Math.max(0.1, timing.secondsPerAttack)}s linear infinite`
    });
  });

  it("pauses combat after the current monster dies and loads the next monster without attacking", () => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0);

    const lowHpMonsterFamily: MapMonsterFamily = {
      ...monsterFamily,
      variants: [
        {
          ...monsterFamily.variants[0],
          hp: 1,
          minAttack: 100,
          maxAttack: 100
        }
      ]
    };
    const equippedCharacter = {
      ...character,
      equipment: {
        ...character.equipment,
        mainhand: woodenSword.id
      }
    };

    render(
      <BattlePage
        character={equippedCharacter}
        itemsById={{ [woodenSword.id]: woodenSword }}
        selectedMonsterFamily={lowHpMonsterFamily}
        skillTabs={skillTabs}
      />
    );

    const timing = getAutoAttackTiming(
      equippedCharacter,
      getCombatStats(equippedCharacter, { [woodenSword.id]: woodenSword }),
      { [woodenSword.id]: woodenSword }
    );

    fireEvent.click(screen.getByRole("button", { name: "Start combat" }));
    fireEvent.click(screen.getByRole("button", { name: "Pause combat" }));

    expect(screen.getByRole("button", { name: "Pausing..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Run away" })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(Math.ceil(timing.secondsPerAttack * 1000));
    });

    expect(screen.getByTestId("battle_list_combat_log")).toHaveTextContent(
      "Combat will pause after this monster is defeated."
    );
    expect(screen.getByTestId("battle_list_combat_log")).toHaveTextContent("is defeated");
    expect(screen.getByTestId("battle_div_timeline_fill_player_attack")).toHaveStyle({
      transform: "scaleX(0)"
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId("battle_list_combat_log")).toHaveTextContent("spawned. Combat paused.");
    expect(screen.getByTestId("battle_monster_header_hp_span_status_value")).toHaveTextContent("1 / 1");
    expect(screen.getByRole("button", { name: "Start combat" })).toBeInTheDocument();
    expect(screen.getByTestId("battle_div_timeline_fill_player_attack")).toHaveStyle({
      transform: "scaleX(0)"
    });
    expect(screen.getByTestId("battle_div_timeline_fill_monster_attack")).toHaveStyle({
      transform: "scaleX(0)"
    });
  });

  it("awards monster experience from the flat monster EXP value", async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0);

    const equippedCharacter = {
      ...character,
      equipment: {
        ...character.equipment,
        mainhand: woodenSword.id
      }
    };
    const lowHpMonsterFamily: MapMonsterFamily = {
      ...monsterFamily,
      variants: [
        {
          ...monsterFamily.variants[0],
          experience: 1500,
          hp: 1,
          level: equippedCharacter.level,
          minAttack: 1,
          maxAttack: 1
        }
      ]
    };
    const handleUpdateCharacterProgression = jest.fn();

    render(
      <BattlePage
        character={equippedCharacter}
        itemsById={{ [woodenSword.id]: woodenSword }}
        onUpdateCharacterProgression={handleUpdateCharacterProgression}
        selectedMonsterFamily={lowHpMonsterFamily}
        skillTabs={skillTabs}
      />
    );

    const timing = getAutoAttackTiming(
      equippedCharacter,
      getCombatStats(equippedCharacter, { [woodenSword.id]: woodenSword }),
      { [woodenSword.id]: woodenSword }
    );

    fireEvent.click(screen.getByRole("button", { name: "Start combat" }));

    act(() => {
      jest.advanceTimersByTime(Math.ceil(timing.secondsPerAttack * 1000));
    });

    await waitFor(() =>
      expect(handleUpdateCharacterProgression).toHaveBeenCalledWith({
        exp: 1500,
        level: 65,
        penya: 123457
      })
    );
    expect(screen.getByTestId("battle_list_combat_log")).toHaveTextContent("gains 1,500 EXP");
    expect(screen.getByTestId("battle_list_combat_log")).toHaveTextContent("gains 1 Penya");
  });

  it("fully restores character resources when monster experience levels the character up", async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0);

    const nextLevelExp = getExpRequiredForNextLevel(character);
    const nearlyLeveledCharacter = {
      ...character,
      exp: nextLevelExp ? nextLevelExp - 1 : character.exp,
      equipment: {
        ...character.equipment,
        mainhand: woodenSword.id
      }
    };
    const lowHpMonsterFamily: MapMonsterFamily = {
      ...monsterFamily,
      variants: [
        {
          ...monsterFamily.variants[0],
          experience: 1,
          hp: 1,
          level: nearlyLeveledCharacter.level,
          minAttack: 1,
          maxAttack: 1
        }
      ]
    };
    const expectedResources = getCombatStats(
      { ...nearlyLeveledCharacter, level: nearlyLeveledCharacter.level + 1 },
      { [woodenSword.id]: woodenSword }
    );
    const getExpectedResource = (label: string) =>
      Number(expectedResources.find((stat) => stat.label === label)?.value.replace(/,/g, ""));
    const handleCharacterResourcesChange = jest.fn();
    const handleUpdateCharacterProgression = jest.fn();

    const { rerender } = render(
      <BattlePage
        character={nearlyLeveledCharacter}
        initialCharacterResources={{ fp: 1, hp: 1, mp: 1 }}
        itemsById={{ [woodenSword.id]: woodenSword }}
        onCharacterResourcesChange={handleCharacterResourcesChange}
        onUpdateCharacterProgression={handleUpdateCharacterProgression}
        selectedMonsterFamily={lowHpMonsterFamily}
        skillTabs={skillTabs}
      />
    );

    const timing = getAutoAttackTiming(
      nearlyLeveledCharacter,
      getCombatStats(nearlyLeveledCharacter, { [woodenSword.id]: woodenSword }),
      { [woodenSword.id]: woodenSword }
    );

    fireEvent.click(screen.getByRole("button", { name: "Start combat" }));

    act(() => {
      jest.advanceTimersByTime(Math.ceil(timing.secondsPerAttack * 1000));
    });

    await waitFor(() =>
      expect(handleUpdateCharacterProgression).toHaveBeenCalledWith({
        exp: 0,
        level: nearlyLeveledCharacter.level + 1,
        penya: 123457
      })
    );

    rerender(
      <BattlePage
        character={{ ...nearlyLeveledCharacter, exp: 0, level: nearlyLeveledCharacter.level + 1 }}
        initialCharacterResources={{ fp: 1, hp: 1, mp: 1 }}
        itemsById={{ [woodenSword.id]: woodenSword }}
        onCharacterResourcesChange={handleCharacterResourcesChange}
        onUpdateCharacterProgression={handleUpdateCharacterProgression}
        selectedMonsterFamily={lowHpMonsterFamily}
        skillTabs={skillTabs}
      />
    );

    await waitFor(() =>
      expect(handleCharacterResourcesChange).toHaveBeenLastCalledWith({
        fp: getExpectedResource("Max FP"),
        hp: getExpectedResource("Max HP"),
        mp: getExpectedResource("Max MP")
      })
    );
    expect(screen.getByTestId("battle_list_combat_log")).toHaveTextContent(
      `reaches level ${nearlyLeveledCharacter.level + 1}`
    );
  });

  it("always awards Penya from the monster gold range when a monster dies", async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0.5).mockReturnValue(0.5);

    const highDamageSword: ItemMetadata = {
      ...woodenSword,
      maxAttack: 10000,
      minAttack: 10000
    };
    const equippedCharacter = {
      ...character,
      equipment: {
        ...character.equipment,
        mainhand: woodenSword.id
      }
    };
    const penyaMonsterFamily: MapMonsterFamily = {
      ...monsterFamily,
      variants: [
        {
          ...monsterFamily.variants[0],
          drops: [],
          hp: 1,
          level: equippedCharacter.level,
          maxDropGold: 7,
          minAttack: 1,
          minDropGold: 5,
          maxAttack: 1
        }
      ]
    };
    const handleUpdateCharacterProgression = jest.fn();

    render(
      <BattlePage
        character={equippedCharacter}
        itemsById={{ [woodenSword.id]: highDamageSword }}
        onUpdateCharacterProgression={handleUpdateCharacterProgression}
        selectedMonsterFamily={penyaMonsterFamily}
        skillTabs={skillTabs}
      />
    );

    const timing = getAutoAttackTiming(
      equippedCharacter,
      getCombatStats(equippedCharacter, { [woodenSword.id]: highDamageSword }),
      { [woodenSword.id]: highDamageSword }
    );

    fireEvent.click(screen.getByRole("button", { name: "Start combat" }));

    act(() => {
      jest.advanceTimersByTime(Math.ceil(timing.secondsPerAttack * 1000));
    });

    await waitFor(() =>
      expect(handleUpdateCharacterProgression).toHaveBeenCalledWith({
        exp: 1500,
        level: 65,
        penya: 123462
      })
    );
    expect(screen.getByTestId("battle_list_combat_log")).toHaveTextContent("gains 6 Penya");
  });

  it("adds rolled monster drops to the dropped items section after a monster dies", async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0);

    const equippedCharacter = {
      ...character,
      equipment: {
        ...character.equipment,
        mainhand: woodenSword.id
      }
    };
    const lowHpMonsterFamily: MapMonsterFamily = {
      ...monsterFamily,
      variants: [
        {
          ...monsterFamily.variants[0],
          hp: 1,
          level: equippedCharacter.level,
          minAttack: 1,
          maxAttack: 1
        }
      ]
    };

    render(
      <BattlePage
        character={equippedCharacter}
        itemsById={{
          [questStone.id]: questStone,
          [rareGem.id]: rareGem,
          [starCandy.id]: starCandy,
          [woodenSword.id]: woodenSword
        }}
        selectedMonsterFamily={lowHpMonsterFamily}
        skillTabs={skillTabs}
      />
    );

    const timing = getAutoAttackTiming(
      equippedCharacter,
      getCombatStats(equippedCharacter, { [woodenSword.id]: woodenSword }),
      { [woodenSword.id]: woodenSword }
    );

    fireEvent.click(screen.getByRole("button", { name: "Start combat" }));

    act(() => {
      jest.advanceTimersByTime(Math.ceil(timing.secondsPerAttack * 1000));
    });

    await waitFor(() => expect(screen.getByTestId("battle_list_monster_dropped_items")).toBeInTheDocument());
    expect(screen.getByTestId("battle_li_monster_dropped_item_quest_stone")).toHaveTextContent("Quest Stone");
    expect(screen.getByTestId("battle_li_monster_dropped_item_rare_gem")).toHaveTextContent("Rare Gem");
    expect(screen.getByTestId("battle_li_monster_dropped_item_star_candy")).toHaveTextContent("Star Candy");
    expect(screen.getByTestId("battle_span_monster_dropped_item_quantity_rare_gem")).toHaveTextContent("x1");
    expect(screen.getByTestId("battle_list_combat_log")).toHaveTextContent(
      "Aibatt dropped Quest Stone, Rare Gem, Star Candy."
    );
  });

  it("loots selected, double-clicked, and all dropped items into inventory", async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0);

    const equippedCharacter = {
      ...character,
      equipment: {
        ...character.equipment,
        mainhand: woodenSword.id
      }
    };
    const lowHpMonsterFamily: MapMonsterFamily = {
      ...monsterFamily,
      variants: [
        {
          ...monsterFamily.variants[0],
          hp: 1,
          level: equippedCharacter.level,
          minAttack: 1,
          maxAttack: 1
        }
      ]
    };
    const handleLootInventoryItems = jest.fn().mockResolvedValue(undefined);

    render(
      <BattlePage
        character={equippedCharacter}
        itemsById={{
          [questStone.id]: questStone,
          [rareGem.id]: rareGem,
          [starCandy.id]: starCandy,
          [woodenSword.id]: woodenSword
        }}
        onLootInventoryItems={handleLootInventoryItems}
        selectedMonsterFamily={lowHpMonsterFamily}
        skillTabs={skillTabs}
      />
    );

    const timing = getAutoAttackTiming(
      equippedCharacter,
      getCombatStats(equippedCharacter, { [woodenSword.id]: woodenSword }),
      { [woodenSword.id]: woodenSword }
    );

    fireEvent.click(screen.getByRole("button", { name: "Start combat" }));

    act(() => {
      jest.advanceTimersByTime(Math.ceil(timing.secondsPerAttack * 1000));
    });

    await screen.findByTestId("battle_button_monster_dropped_item_rare_gem");

    fireEvent.click(screen.getByTestId("battle_button_monster_dropped_item_rare_gem"));
    fireEvent.click(screen.getByRole("button", { name: "Loot" }));

    await waitFor(() =>
      expect(handleLootInventoryItems).toHaveBeenCalledWith([{ itemId: rareGem.id, quantity: 1 }])
    );
    await waitFor(() =>
      expect(screen.queryByTestId("battle_button_monster_dropped_item_rare_gem")).not.toBeInTheDocument()
    );

    fireEvent.doubleClick(screen.getByTestId("battle_button_monster_dropped_item_star_candy"));

    await waitFor(() =>
      expect(handleLootInventoryItems).toHaveBeenCalledWith([{ itemId: starCandy.id, quantity: 1 }])
    );
    await waitFor(() =>
      expect(screen.queryByTestId("battle_button_monster_dropped_item_star_candy")).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: "Loot all" }));

    await waitFor(() =>
      expect(handleLootInventoryItems).toHaveBeenCalledWith([{ itemId: questStone.id, quantity: 1 }])
    );
    await waitFor(() =>
      expect(screen.getByTestId("battle_p_monster_dropped_items_empty")).toHaveTextContent(
        "No items have dropped yet."
      )
    );
  });

  it("deletes remaining dropped items from the drops section", async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0);

    const equippedCharacter = {
      ...character,
      equipment: {
        ...character.equipment,
        mainhand: woodenSword.id
      }
    };
    const lowHpMonsterFamily: MapMonsterFamily = {
      ...monsterFamily,
      variants: [
        {
          ...monsterFamily.variants[0],
          hp: 1,
          level: equippedCharacter.level,
          minAttack: 1,
          maxAttack: 1
        }
      ]
    };

    render(
      <BattlePage
        character={equippedCharacter}
        itemsById={{
          [questStone.id]: questStone,
          [rareGem.id]: rareGem,
          [starCandy.id]: starCandy,
          [woodenSword.id]: woodenSword
        }}
        selectedMonsterFamily={lowHpMonsterFamily}
        skillTabs={skillTabs}
      />
    );

    const timing = getAutoAttackTiming(
      equippedCharacter,
      getCombatStats(equippedCharacter, { [woodenSword.id]: woodenSword }),
      { [woodenSword.id]: woodenSword }
    );

    fireEvent.click(screen.getByRole("button", { name: "Start combat" }));

    act(() => {
      jest.advanceTimersByTime(Math.ceil(timing.secondsPerAttack * 1000));
    });

    await screen.findByTestId("battle_list_monster_dropped_items");
    fireEvent.click(screen.getByRole("button", { name: "Delete remaining dropped items" }));

    expect(screen.queryByTestId("battle_list_monster_dropped_items")).not.toBeInTheDocument();
    expect(screen.getByTestId("battle_p_monster_dropped_items_empty")).toHaveTextContent(
      "No items have dropped yet."
    );
    expect(screen.getByTestId("battle_list_combat_log")).toHaveTextContent(
      "Deleted remaining dropped items."
    );
  });

  it("does not add monster drops when the drop chance roll fails", async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(1).mockReturnValue(0.99);

    const highDamageSword: ItemMetadata = {
      ...woodenSword,
      maxAttack: 10000,
      minAttack: 10000
    };
    const equippedCharacter = {
      ...character,
      equipment: {
        ...character.equipment,
        mainhand: woodenSword.id
      }
    };
    const lowHpMonsterFamily: MapMonsterFamily = {
      ...monsterFamily,
      variants: [
        {
          ...monsterFamily.variants[0],
          hp: 1,
          level: equippedCharacter.level,
          minAttack: 1,
          maxAttack: 1
        }
      ]
    };

    render(
      <BattlePage
        character={equippedCharacter}
        itemsById={{
          [questStone.id]: questStone,
          [rareGem.id]: rareGem,
          [starCandy.id]: starCandy,
          [woodenSword.id]: highDamageSword
        }}
        selectedMonsterFamily={lowHpMonsterFamily}
        skillTabs={skillTabs}
      />
    );

    const timing = getAutoAttackTiming(
      equippedCharacter,
      getCombatStats(equippedCharacter, { [woodenSword.id]: highDamageSword }),
      { [woodenSword.id]: highDamageSword }
    );

    fireEvent.click(screen.getByRole("button", { name: "Start combat" }));

    act(() => {
      jest.advanceTimersByTime(Math.ceil(timing.secondsPerAttack * 1000));
    });

    await waitFor(() =>
      expect(screen.getByTestId("battle_list_combat_log")).toHaveTextContent("Aibatt dropped no items.")
    );
    expect(screen.queryByTestId("battle_list_monster_dropped_items")).not.toBeInTheDocument();
    expect(screen.getByTestId("battle_p_monster_dropped_items_empty")).toHaveTextContent(
      "No items have dropped yet."
    );
  });

  it("does not award EXP for monsters more than fifteen levels higher", async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0);

    const equippedCharacter = {
      ...character,
      equipment: {
        ...character.equipment,
        mainhand: woodenSword.id
      }
    };
    const highLevelMonsterFamily: MapMonsterFamily = {
      ...monsterFamily,
      variants: [
        {
          ...monsterFamily.variants[0],
          experience: 1500,
          hp: 1,
          level: equippedCharacter.level + 16,
          minAttack: 1,
          maxAttack: 1
        }
      ]
    };
    const highDamageSword: ItemMetadata = {
      ...woodenSword,
      maxAttack: 10000,
      minAttack: 10000
    };
    const handleUpdateCharacterProgression = jest.fn();

    render(
      <BattlePage
        character={equippedCharacter}
        itemsById={{ [woodenSword.id]: highDamageSword }}
        onUpdateCharacterProgression={handleUpdateCharacterProgression}
        selectedMonsterFamily={highLevelMonsterFamily}
        skillTabs={skillTabs}
      />
    );

    expect(screen.getByTestId("battle_strong_info_value_exp")).toHaveTextContent("1,500");

    const timing = getAutoAttackTiming(
      equippedCharacter,
      getCombatStats(equippedCharacter, { [woodenSword.id]: highDamageSword }),
      { [woodenSword.id]: highDamageSword }
    );

    fireEvent.click(screen.getByRole("button", { name: "Start combat" }));

    act(() => {
      jest.advanceTimersByTime(Math.ceil(timing.secondsPerAttack * 1000));
    });

    await waitFor(() =>
      expect(screen.getByTestId("battle_list_combat_log")).toHaveTextContent("gains no EXP")
    );
    expect(handleUpdateCharacterProgression).toHaveBeenCalledWith({ penya: 123457 });
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

  it("keeps the battle log when combat is stopped and the monster target is cleared", () => {
    const { rerender } = render(
      <BattlePage
        character={character}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={monsterFamily}
        skillTabs={skillTabs}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Start combat" }));

    expect(screen.getByTestId("battle_list_combat_log")).toHaveTextContent("Combat started with Aibatt.");

    rerender(
      <BattlePage
        character={character}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    expect(screen.getByTestId("battle_list_combat_log")).toHaveTextContent("Combat started with Aibatt.");
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
