import type {
  ArmorSet,
  DamagePerSecondSummary,
  ElementValue,
  Item,
  JobConstants,
  Monster,
  Skill,
  UpgradeBonus
} from "./types.js";

export abstract class MoverState {
  declare jobId: number;
  declare weapon_img: string;
  declare armor: ArmorSet | null;
  declare armorUpgrade: number;
  declare armorUpgradeBonus: UpgradeBonus | null;
  declare mainhandUpgrade: number;
  declare mainhandUpgradeBonus: UpgradeBonus | null;
  declare mainhandElement: ElementValue;
  declare mainhandElementUpgrade: number;
  declare offhandUpgrade: number;
  declare offhandUpgradeBonus: UpgradeBonus | null;
  declare mainhand: Item;
  declare offhand: Item | null;
  declare earringR: Item | null;
  declare earringL: Item | null;
  declare ringR: Item | null;
  declare ringL: Item | null;
  declare necklace: Item | null;
  declare cloak: Item | null;
  declare suitPiercing: Item | null;
  declare shield: Item | null;
  declare assistBuffs: boolean;
  declare selfBuffs: boolean;
  declare premiumItems: boolean;
  declare constants: JobConstants;
  declare skillsRawDamage: Record<string, number>;
  declare str: number;
  declare sta: number;
  declare int: number;
  declare dex: number;
  declare addedStr: number;
  declare addedSta: number;
  declare addedInt: number;
  declare addedDex: number;
  declare level: number;
  declare activeAssistBuffs: Skill[];
  declare activeSelfBuffs: Skill[];
  declare activeBuffs: Skill[];
  declare activePremiumItems: Item[];
  declare assistInt: number;
  declare monsters: Monster[];
  declare dps: DamagePerSecondSummary;
  declare aspd: number;
  declare criticalChance: number;
  declare DCT: number;
  declare attack: number;
  declare criticalDamage: number;
  declare hitrate: number;
  declare meleeBlock: number;
  declare rangedBlock: number;
  declare focusSkill: Skill | -1;
  declare forceUpdate: boolean;

  abstract get health(): number;
  abstract get fp(): number;
  abstract get mp(): number;
}
