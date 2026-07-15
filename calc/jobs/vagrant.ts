import { Mover } from "../mover.js";
import { Utils } from "../utils.js";
import Moverutils from "../moverutils.js";
import type { ArmorSet, Item, JobConstants, NumericInput } from "../types.js";

export class Vagrant extends Mover {
  constructor(
    str: NumericInput = 15,
    sta: NumericInput = 15,
    int: NumericInput = 15,
    dex: NumericInput = 15,
    level: NumericInput = 1,
    constants: JobConstants | null = null,
    img: string | null = null,
    mainhand: Item | null = null,
    offhand: Item | null = null,
    armor: ArmorSet | null = null,
    jobId: number | null = null
  ) {
    super();
    this.jobId = jobId ?? 9686;
    this.weapon_img = img || "woodensword.png";
    this.armor = armor || null;
    this.armorUpgrade = 0;
    this.armorUpgradeBonus = null;
    this.mainhandUpgrade = 0;
    this.mainhandUpgradeBonus = null;
    this.mainhandElement = Moverutils.Elements.none;
    this.mainhandElementUpgrade = 0;
    this.offhandUpgrade = 0;
    this.offhandUpgradeBonus = null;
    this.mainhand = mainhand || Utils.getItemByName("Wooden Sword");
    this.offhand = offhand || null;
    this.earringR = null;
    this.earringL = null;
    this.ringR = null;
    this.ringL = null;
    this.necklace = null;
    this.suitPiercing = null;
    this.shield = null;
    this.assistBuffs = false;
    this.selfBuffs = false;
    this.premiumItems = false;
    this.constants = constants || {
      skills: [
        Utils.getSkillByName("Clean Hit"),
        Utils.getSkillByName("Flurry"),
        Utils.getSkillByName("Over Cutter")
      ],
      buffs: [],
      attackSpeed: 72.0,
      hps: 4, // TODO: change these to frames instead and calculate hits/sec using them for more accuracy
      HP: 0.9,
      MP: 0.3,
      FP: 0.3,
      Def: 0.9,
      MDefSta: 0.3,
      MDefInt: 1.2,
      block: 0.2,
      critical: 1.0,
      sword: 4.5,
      axe: 5.5,
      staff: 0.8,
      stick: 3.0,
      knuckle: 5.0,
      wand: 6.0,
      yoyo: 4.2
    };
    this.skillsRawDamage = {};

    this.str = Number.parseInt(String(str), 10);
    this.sta = Number.parseInt(String(sta), 10);
    this.int = Number.parseInt(String(int), 10);
    this.dex = Number.parseInt(String(dex), 10);

    this.addedStr = 0;
    this.addedSta = 0;
    this.addedInt = 0;
    this.addedDex = 0;

    this.level = Number.parseInt(String(level), 10);

    this.activeAssistBuffs = [];
    this.activeSelfBuffs = [];
    this.activeBuffs = [];
    this.activePremiumItems = [];
    this.assistInt = 300; // How much int the assist buffing you has

    this.monsters = [];

    this.dps = {
      aa: 0,
      0: 0, // Skill 1
      1: 0, // Skill 2
      2: 0 // Skill 3
    };

    this.aspd = 0;
    this.criticalChance = 0;
    this.DCT = 1;
    this.attack = 0;
    this.criticalDamage = 0;
    this.hitrate = 1;
    this.meleeBlock = 0;
    this.rangedBlock = 0;

    this.focusSkill = -1;

    this.forceUpdate = false;
  }

  get health() {
    let health = Math.floor(150 + this.level * 18 + this.sta * this.level * 0.18);
    health *= 1 + this.getExtraParam("maxhp", true) / 100;
    health += this.getExtraParam("maxhp", false);
    return Math.floor(health);
  }

  get fp() {
    let fp = Math.floor(this.level * 0.6 + this.sta * 2.1);
    fp *= 1 + this.getExtraParam("maxfp", true) / 100;
    fp += this.getExtraParam("maxfp", false);
    return fp;
  }

  get mp() {
    let mp = Math.floor(22 + this.level * 0.6 + this.int * 2.7);
    mp *= 1 + this.getExtraParam("maxmp", true) / 100;
    mp += this.getExtraParam("maxmp", false);
    return mp;
  }
}
