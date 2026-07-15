import type { Character, CharacterEquipment, CharacterEquipmentSlot, ItemMetadata } from "@/lib/api";

const secondJobToFirstJob: Record<string, string> = {
  Blade: "Mercenary",
  Knight: "Mercenary",
  Elementor: "Magician",
  Psykeeper: "Magician",
  Billposter: "Assist",
  Ringmaster: "Assist",
  Jester: "Acrobat",
  Ranger: "Acrobat"
};

const thirdJobToSecondJob: Record<string, string> = {
  Slayer: "Blade",
  Templar: "Knight",
  Arcanist: "Elementor",
  Mentalist: "Psykeeper",
  Forcemaster: "Billposter",
  Seraph: "Ringmaster",
  Harlequin: "Jester",
  Crackshooter: "Ranger"
};

const dualWieldJobs = new Set(["Blade", "Slayer"]);

function normalizeRequirement(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function getJobLineage(job: string) {
  const secondJob = thirdJobToSecondJob[job];
  const firstJob = secondJob ? secondJobToFirstJob[secondJob] : secondJobToFirstJob[job];

  return [job, secondJob, firstJob, "Vagrant"].filter((value): value is string => Boolean(value));
}

export function meetsRequiredJob(character: Character, requiredJob: string) {
  const normalizedRequirement = normalizeRequirement(requiredJob);

  return getJobLineage(character.job).some((job) => normalizeRequirement(job) === normalizedRequirement);
}

export function isItemRequirementUnmet(label: string, item: ItemMetadata, character?: Character) {
  if (!character) {
    return false;
  }

  if (label === "Gender" && item.sex) {
    return item.sex !== character.gender;
  }

  if (label === "Req Job" && item.requiredJob) {
    return !meetsRequiredJob(character, item.requiredJob);
  }

  if (label === "Level" && item.level !== null) {
    return character.level < item.level;
  }

  return false;
}

function isOneHandedWeapon(item: ItemMetadata | undefined | null) {
  return item?.category === "weapon" && item.twoHanded === false;
}

function canDualWieldOneHandedWeapons(character: Character) {
  return dualWieldJobs.has(character.job);
}

function getFirstOpenPairSlot(
  equipment: CharacterEquipment,
  leftSlot: "earringL" | "ringL",
  rightSlot: "earringR" | "ringR"
) {
  return equipment[leftSlot] ? rightSlot : leftSlot;
}

export function getEquipmentSlotForItem(
  character: Character,
  item: ItemMetadata,
  equipment: CharacterEquipment,
  itemsById: Record<string, ItemMetadata>
): CharacterEquipmentSlot | null {
  if (item.category === "weapon") {
    const mainhandItem = equipment.mainhand ? itemsById[equipment.mainhand] : null;

    if (
      canDualWieldOneHandedWeapons(character) &&
      isOneHandedWeapon(item) &&
      isOneHandedWeapon(mainhandItem)
    ) {
      return "offhand";
    }

    return "mainhand";
  }

  if (item.category === "flying") {
    return "flying";
  }

  if (item.category === "arrow") {
    return "ammo";
  }

  if (item.category === "jewelry") {
    if (item.subcategory === "necklace") {
      return "necklace";
    }

    if (item.subcategory === "earring") {
      return getFirstOpenPairSlot(equipment, "earringL", "earringR");
    }

    if (item.subcategory === "ring") {
      return getFirstOpenPairSlot(equipment, "ringL", "ringR");
    }
  }

  if (item.category === "armor") {
    if (item.subcategory === "helmet") {
      return "helmet";
    }

    if (item.subcategory === "suit") {
      return "suit";
    }

    if (item.subcategory === "gauntlet" || item.subcategory === "gloves") {
      return "gloves";
    }

    if (item.subcategory === "boots") {
      return "boots";
    }

    if (item.subcategory === "shield") {
      return "offhand";
    }
  }

  if (item.category === "fashion") {
    if (item.subcategory === "hat") {
      return "csHelm";
    }

    if (item.subcategory === "cloth") {
      return "csSuit";
    }

    if (item.subcategory === "glove") {
      return "csGloves";
    }

    if (item.subcategory === "shoes") {
      return "csBoots";
    }

    if (item.subcategory === "mask") {
      return "mask";
    }

    if (item.subcategory === "cloak" || item.subcategory === "visualcloak") {
      return "cloak";
    }
  }

  return null;
}

export function canEquipItem(
  character: Character,
  item: ItemMetadata,
  equipment: CharacterEquipment,
  itemsById: Record<string, ItemMetadata>
) {
  if (
    isItemRequirementUnmet("Gender", item, character) ||
    isItemRequirementUnmet("Req Job", item, character) ||
    isItemRequirementUnmet("Level", item, character)
  ) {
    return false;
  }

  const equipmentSlot = getEquipmentSlotForItem(character, item, equipment, itemsById);

  if (!equipmentSlot) {
    return false;
  }

  if (equipmentSlot === "offhand" && equipment.mainhand) {
    const mainhandItem = itemsById[equipment.mainhand];

    if (mainhandItem?.twoHanded) {
      return false;
    }
  }

  return true;
}
