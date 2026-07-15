import {
  Vagrant,
  Assist,
  Billposter,
  Ringmaster,
  Acrobat,
  Jester,
  Ranger,
  Magician,
  Psykeeper,
  Elementor,
  Mercenary,
  Blade,
  Knight
} from "./jobs.js";
import type { Mover } from "./mover.js";
import Moverutils from "./moverutils.js";
import type {
  ArmorSet,
  CharacterStats,
  DamageTarget,
  ImageModule,
  Item,
  JobDefinition,
  JobName,
  Monster,
  Skill,
  UpgradeBonus
} from "./types.js";
import { jobsjson } from "../assets/flyff/jobs.js";
import { setsjson } from "../assets/flyff/sets.js";
import { itemsjson } from "../assets/flyff/items.js";
import { skillsjson } from "../assets/flyff/skills.js";
import { monstersjson } from "../assets/flyff/monsters.js";
import { upgradesjson } from "../assets/flyff/upgradeBonus.js";

Math.lerp = function (start: number, end: number, amount: number): number {
  return (1 - amount) * start + amount * end;
};

export class Utils {
  static focus: DamageTarget = Moverutils.trainingDummy;

  static monsters = monstersjson;
  static skills = skillsjson;
  static items = itemsjson;
  static jobs = jobsjson;
  static sets = setsjson;
  static upgradeBonus = upgradesjson;

  static addedStr = 0;
  static addedSta = 0;
  static addedDex = 0;
  static addedInt = 0;

  static assistInt = 300;
  static classBuffs = false;

  static maxLevel = 140;

  // These parameters come in different names, so this object describes those. Used in getExtraParam() etc. in mover.js
  static globalParams: Record<string, string[]> = {
    attack: [
      // attack appears as
      "damage", // damage
      "attack" // attack
    ],
    str: ["str", "allstats"],
    sta: ["sta", "allstats"],
    dex: ["dex", "allstats"],
    int: ["int", "allstats"]
  };

  static assistBuffs = [
    this.getSkillByName("Cannon Ball"),
    this.getSkillByName("Beef Up"),
    this.getSkillByName("Heap Up"),
    this.getSkillByName("Mental Sign"),
    this.getSkillByName("Patience"),
    this.getSkillByName("Haste"),
    this.getSkillByName("Cat's Reflex"),
    this.getSkillByName("Accuracy"),
    this.getSkillByName("Protect"),
    this.getSkillByName("Spirit Fortune"),
    this.getSkillByName("Holyguard"),
    this.getSkillByName("Geburah Tiphreth")
  ];

  static premiumItems = [
    this.getItemByName("Grilled Eel"),
    this.getItemByName("Upcut Stone"), // Special case: uses SM_ATTACK_UP checked directly in the calculations
    this.getItemByName("Def-Upcut Stone"),
    this.getItemByName("Power Scroll"),
    this.getItemByName("Charged Power Scroll"),
    this.getItemByName("Super Charged Power Scroll"),
    this.getItemByName("Flask of the Tiger"),
    this.getItemByName("Flask of the Lion"),
    this.getItemByName("Flask of the Rabbit"),
    this.getItemByName("Flask of the Fox"),
    this.getItemByName("Flask of Stone"),
    this.getItemByName("Potion of Recklessness"),
    this.getItemByName("Potion of Swiftness"),
    this.getItemByName("Potion of Clarity"),
    this.getItemByName("Elixir of the Sorceror"),
    this.getItemByName("Elixir of Anti-Magic"),
    this.getItemByName("Elixir of Evasion"),
    this.getItemByName("Concoction of Profuse Bleeding"),
    this.getItemByName("Green Cotton Candy"),
    this.getItemByName("Purple Cotton Candy"),
    this.getItemByName("Orange Cotton Candy"),
    this.getItemByName("Yellow Cotton Candy"),
    this.getItemByName("Red Cotton Candy"),
    this.getItemByName("Gray Cotton Candy"),
    this.getItemByName("Blue Cotton Candy"),
    this.getItemByName("Pink Cotton Candy"),
    this.getItemByName("White Cotton Candy"),
    this.getItemByName("Sky-Blue Cotton Candy"),
    this.getItemByName("Yellow Balloons"),
    this.getItemByName("Pink Balloons"),
    this.getItemByName("Blue Balloons")
  ];

  static lerp(start: number, end: number, amt: number): number {
    return (1 - amt) * start + amt * end;
  }

  static getItemByName(name: string): Item {
    const item = this.items.find((candidate) => candidate.name.en.toLowerCase() == name.toLowerCase());
    if (!item) throw new Error(`Unknown item: ${name}`);
    return item;
  }
  static getItemById(id: number): Item {
    const item = this.items.find((candidate) => candidate.id == id);
    if (!item) throw new Error(`Unknown item id: ${id}`);
    return item;
  }
  static getArmorByName(name: string): ArmorSet {
    const armor = this.sets.find((set) => set.name.en.toLowerCase() == name.toLowerCase());
    if (!armor) throw new Error(`Unknown armor set: ${name}`);
    return armor;
  }
  static getSkillByName(name: string): Skill {
    const skill = this.skills.find((candidate) => candidate.name.en.toLowerCase() == name.toLowerCase());
    if (!skill) throw new Error(`Unknown skill: ${name}`);
    return skill;
  }
  static getSkillById(id: number): Skill {
    const skill = this.skills.find((candidate) => candidate.id == id);
    if (!skill) throw new Error(`Unknown skill id: ${id}`);
    return skill;
  }

  static getJobId(jobName: string): number {
    return this.jobs.find((job) => job.name.en == jobName)?.id ?? 9686;
  } // 9686 = vagrant
  static getParentJobId(jobId: number): number {
    return this.jobs.find((job) => job.id == jobId)?.parent ?? 9686;
  }
  static getJobName(jobId: number): string {
    return this.jobs.find((job) => job.id == jobId)?.name.en ?? "Vagrant";
  }

  static getJewelery(subcategory: string): Item[] {
    return this.items.filter((item) => item.category == "jewelry" && item.subcategory == subcategory);
  }
  static getPiercingCards(): Item[] {
    return this.items.filter((item) => item.subcategory == "piercingcard");
  }
  static getShields(): Item[] {
    return this.items.filter((item) => item.subcategory == "shield");
  }
  static getCloaks(): Item[] {
    return this.items.filter((item) => item.subcategory == "cloak" && item.abilities);
  }

  static getUpgradeBonus(upgradeLevel: number): UpgradeBonus | null {
    return this.upgradeBonus[upgradeLevel - 1] || null;
  }

  static getJobWeapons(jobId: number): Item[] {
    const jobs = [jobId, this.getParentJobId(jobId)];
    return this.items.filter((item) => item.category == "weapon" && jobs.includes(item.class));
  }
  static getJobArmors(jobId: number): ArmorSet[] {
    const jobs = [jobId, this.getParentJobId(jobId)];
    return this.sets.filter(
      (set) =>
        this.getItemById(set.parts[0]).sex == "male" && jobs.includes(this.getItemById(set.parts[0]).class)
    );
  }

  static getJobSkills(jobId: number): Skill[] {
    const jobs = [jobId, this.getParentJobId(jobId)];
    return this.skills.filter(
      (skill) => jobs.includes(skill.class) && skill.levels[0]?.minAttack != undefined
    );
  }

  static getWeaponSpeed(weapon: Item | null): number {
    if (!weapon) return 0;
    switch (weapon.subcategory) {
      case "knuckle":
        return 0.07;
      case "axe":
        return weapon.twoHanded ? 0.03 : 0.06;
      case "sword":
        return weapon.twoHanded ? 0.035 : 0.085;
      case "bow":
        return 0.07;
      case "yoyo":
        return 0.075;
      case "stick":
        return 0.05;
      case "staff":
        return 0.045;
      case "wand":
        return 0.025;
      default:
        return 0.075;
    }
  }

  static clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max);
  }

  static getJobFromId(jobId: number): Mover {
    return JobFactory.createJobFromId(jobId);
  }

  static sortByName(a: { name: JobDefinition["name"] }, b: { name: JobDefinition["name"] }): number {
    if (a.name.en < b.name.en) {
      return -1;
    }
    if (a.name.en > b.name.en) {
      return 1;
    }

    return 0;
  }

  static sortByLevel(a: { level: number }, b: { level: number }): number {
    if (a.level < b.level) {
      return -1;
    }
    if (a.level > b.level) {
      return 1;
    }

    return 0;
  }

  /**
   * Convert an API stat scale value (In-game tooltip) to a game calculation value. Assumes the skill is max level.
   * @param {*} scale The scale value from the API
   */
  static convertStatScale(scale: number, levelCount: number): number {
    let ret = scale * 50.0;
    ret -= levelCount + 1;
    ret /= 5.0;

    return ret;
  }

  static updateJob(character: Mover, job: JobName): Mover | false {
    const currentCharacterJobName = this.getJobName(character.jobId);
    if (currentCharacterJobName != job) {
      const stats = {
        str: character.str,
        sta: character.sta,
        dex: character.dex,
        int: character.int,
        level: character.level
      };
      return JobFactory.createJobFromName(job, stats);
    }

    return false;
  }

  static updateMonsters(character: Mover): Monster[] {
    const level = character.level;
    const ignoreRanks = ["super", "boss", "giant", "violet"];

    let index = Utils.monsters.findIndex((monster) => monster.level >= level + 1);

    // Could not find monsters that are higher level than you, use the highest level monster
    if (index === null || index < 0) {
      index = Utils.monsters.length - 1;
    }

    let res = Utils.monsters.slice(Math.max(index - 10, 0), Math.min(index + 20, Utils.monsters.length));
    res = res.filter(function (monster) {
      return (
        !ignoreRanks.includes(monster.rank) &&
        monster.experience > 0 &&
        !monster.name.en.includes("Criminal") &&
        monster.spawns != undefined &&
        monster.spawns.length > 0
      );
    });

    // Update the damage against each monster
    for (const monster of res) {
      character.getDamage(monster);
    }

    return res;
  }

  static getExpReward(monster: Monster, level: number): number {
    return monster.experienceTable[level - 1];
  }

  static newGuid(): string {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (character) =>
      (Number(character) ^ ((Math.random() * 16) >> (Number(character) / 4))).toString(16)
    );
  }

  static escapeRegex(string: string): string {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
  }

  static getGameIconUrl(img: string, path?: string): string {
    let address = "https://api.flyff.com/image/";
    switch (path) {
      case "skills":
        address += "skill/colored/";
        break;
      default:
        address += "item/";
        break;
    }

    address += img;
    return address;
  }

  static getImageUrl(img: string, path?: string): string {
    const rx = new RegExp(Utils.escapeRegex(img), "i");
    let store: Record<string, ImageModule>;
    switch (path) {
      case "skills":
        store = import.meta.glob<ImageModule>("@/assets/icons/Skills/*.png", { eager: true });
        break;
      default:
        store = import.meta.glob<ImageModule>("@/assets/*.png", { eager: true });
        break;
    }
    for (const i in store) {
      if (i.match(rx)) {
        const url = store[i].default;
        if (url.startsWith(".") || url.startsWith("/")) {
          return `./${url.replace(/^[./]+/, "")}`;
        }
        return url;
      }
    }
    return this.getImageUrl("woodensword", path);
  }
}

class JobFactory {
  static createJobFromName(job: JobName, stats: CharacterStats): Mover {
    switch (job) {
      case "Vagrant":
        return new Vagrant(stats.str, stats.sta, stats.int, stats.dex, stats.level);
      case "Assist":
        return new Assist(stats.str, stats.sta, stats.int, stats.dex, stats.level);
      case "Billposter":
        return new Billposter(stats.str, stats.sta, stats.int, stats.dex, stats.level);
      case "Ringmaster":
        return new Ringmaster(stats.str, stats.sta, stats.int, stats.dex, stats.level);
      case "Acrobat":
        return new Acrobat(stats.str, stats.sta, stats.int, stats.dex, stats.level);
      case "Jester":
        return new Jester(stats.str, stats.sta, stats.int, stats.dex, stats.level);
      case "Ranger":
        return new Ranger(stats.str, stats.sta, stats.int, stats.dex, stats.level);
      case "Magician":
        return new Magician(stats.str, stats.sta, stats.int, stats.dex, stats.level);
      case "Psykeeper":
        return new Psykeeper(stats.str, stats.sta, stats.int, stats.dex, stats.level);
      case "Elementor":
        return new Elementor(stats.str, stats.sta, stats.int, stats.dex, stats.level);
      case "Mercenary":
        return new Mercenary(stats.str, stats.sta, stats.int, stats.dex, stats.level);
      case "Blade":
        return new Blade(stats.str, stats.sta, stats.int, stats.dex, stats.level);
      case "Knight":
        return new Knight(stats.str, stats.sta, stats.int, stats.dex, stats.level);
      default:
        return new Vagrant(stats.str, stats.sta, stats.int, stats.dex, stats.level);
    }
  }

  static createJobFromId(jobId: number): Mover {
    switch (jobId) {
      case 9686:
        return new Vagrant();
      case 8962:
        return new Assist();
      case 7424:
        return new Billposter();
      case 9389:
        return new Ringmaster();
      case 9098:
        return new Acrobat();
      case 3545:
        return new Jester();
      case 9295:
        return new Ranger();
      case 9581:
        return new Magician();
      case 5709:
        return new Psykeeper();
      case 9150:
        return new Elementor();
      case 764:
        return new Mercenary();
      case 2246:
        return new Blade();
      case 5330:
        return new Knight();
      default:
        return new Vagrant();
    }
  }
}
