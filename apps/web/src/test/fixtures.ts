import type {
  Character,
  CharacterEquipment,
  ItemMetadata,
  MapMonsterFamily,
  MonsterFamilyVariant
} from "@/lib/api";
import type { SkillDefinition, SkillTreeTab } from "@/lib/skillTrees";

export const emptyEquipment: CharacterEquipment = {
  ammo: null,
  boots: null,
  cloak: null,
  csBoots: null,
  csGloves: null,
  csHelm: null,
  csSuit: null,
  earringL: null,
  earringR: null,
  flying: null,
  gloves: null,
  helmet: null,
  mainhand: null,
  mask: null,
  necklace: null,
  offhand: null,
  ringL: null,
  ringR: null,
  suit: null
};

export function buildCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: "character-1",
    slotIndex: 0,
    name: "Test Hero",
    gender: "male",
    job: "Vagrant",
    progressionRank: "normal",
    location: "Flaris",
    level: 20,
    exp: 0,
    penya: 0,
    stats: { str: 15, sta: 15, dex: 15, int: 15 },
    skillLevels: {},
    ammoQuantity: 0,
    ammoQuantities: [0, 0, 0],
    equipment: { ...emptyEquipment },
    inventory: { size: 50, items: [] },
    ...overrides
  };
}

export function buildItem(overrides: Partial<ItemMetadata> = {}): ItemMetadata {
  return {
    id: "item-1",
    name: "Test Item",
    description: null,
    icon: null,
    category: "weapon",
    subcategory: "sword",
    rarity: "common",
    level: 1,
    sex: null,
    requiredJob: null,
    minAttack: 1,
    maxAttack: 2,
    attackSpeed: "normal",
    twoHanded: false,
    minDefense: null,
    maxDefense: null,
    abilities: [],
    ...overrides
  };
}

export function buildMonster(overrides: Partial<MonsterFamilyVariant> = {}): MonsterFamilyVariant {
  return {
    id: 1,
    name: "Aibatt",
    level: 20,
    rank: "normal",
    element: "wind",
    icon: null,
    hp: 1_000,
    minAttack: 50,
    maxAttack: 60,
    attackSpeed: 1,
    attackDelay: 3,
    defense: 20,
    magicDefense: 10,
    minDropGold: 0,
    maxDropGold: 0,
    drops: [],
    variantRank: "normal",
    ...overrides
  };
}

export function buildMonsterFamily(overrides: Partial<MapMonsterFamily> = {}): MapMonsterFamily {
  return {
    family: "aibatt",
    location: { region: "flaris", x: 10, y: 20 },
    name: "Aibatt",
    questDrops: [],
    variants: [buildMonster()],
    ...overrides
  };
}

export function buildSkill(overrides: Partial<SkillDefinition> = {}): SkillDefinition {
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

export function buildSkillTab(overrides: Partial<SkillTreeTab> = {}): SkillTreeTab {
  return {
    tier: "vagrant",
    label: "Vagrant",
    imageSrc: "/images/skills/Vagrant.png",
    imageWidth: 225,
    imageHeight: 135,
    skills: [buildSkill()],
    ...overrides
  };
}
