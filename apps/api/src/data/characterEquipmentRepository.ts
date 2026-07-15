import { db } from "./database.js";
import type { Character, CharacterConsumableResource } from "../types.js";
import type { ItemMetadata } from "../data/generated/itemIconIndex.js";
import {
  consumableResources,
  equipmentSetIndexes,
  type EquipmentSetIndex
} from "./characterRepository.types.js";

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

export function parseSkillLevels(skillLevels: string) {
  try {
    const parsed = JSON.parse(skillLevels) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([skillId, level]) => typeof skillId === "string" && Number.isInteger(level) && level > 0
      )
    ) as Character["skillLevels"];
  } catch {
    return {};
  }
}

export function createEmptyConsumableLoadout(): Character["consumableLoadout"] {
  return {
    fp: null,
    hp: null,
    mp: null
  };
}

export function parseConsumableLoadout(consumableLoadout: string) {
  const fallback = createEmptyConsumableLoadout();

  try {
    const parsed = JSON.parse(consumableLoadout) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return fallback;
    }

    const input = parsed as Partial<Record<CharacterConsumableResource, unknown>>;

    return Object.fromEntries(
      consumableResources.map((resource) => {
        const value = input[resource];

        if (typeof value === "string") {
          return [resource, { itemId: value, quantity: 1 }];
        }

        if (
          value &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          typeof (value as { itemId?: unknown }).itemId === "string" &&
          Number.isInteger((value as { quantity?: unknown }).quantity) &&
          Number((value as { quantity: number }).quantity) > 0
        ) {
          return [
            resource,
            {
              itemId: (value as { itemId: string }).itemId,
              quantity: (value as { quantity: number }).quantity
            }
          ];
        }

        return [resource, null];
      })
    ) as Character["consumableLoadout"];
  } catch {
    return fallback;
  }
}

export function createEmptyEquipment(): Character["equipment"] {
  return {
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
}

export function persistConsumableLoadout(
  characterId: string,
  consumableLoadout: Character["consumableLoadout"],
  now: string
) {
  db.prepare("UPDATE characters SET consumable_loadout = ?, updated_at = ? WHERE id = ?").run(
    JSON.stringify(consumableLoadout),
    now,
    characterId
  );
}

export function isRecoveryCategory(item: ItemMetadata) {
  return (item.category ?? "").toLowerCase().startsWith("recovery");
}

export function getRecoveryAbility(item: ItemMetadata, resource: CharacterConsumableResource) {
  return item.abilities.find((ability) => ability.parameter.toLowerCase() === resource) ?? null;
}

export function normalizeEquipment(value: unknown, fallback: Character["equipment"]): Character["equipment"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  const input = value as Partial<Record<keyof Character["equipment"], unknown>>;
  const emptyEquipment = createEmptyEquipment();

  return Object.fromEntries(
    Object.keys(emptyEquipment).map((slot) => {
      const value = input[slot as keyof Character["equipment"]];

      return [slot, typeof value === "string" ? value : null];
    })
  ) as Character["equipment"];
}

export function createEquipmentSets(firstSet: Character["equipment"]) {
  return [firstSet, createEmptyEquipment(), createEmptyEquipment()];
}

export function parseEquipmentSets(equipmentSets: string, firstSet: Character["equipment"]) {
  try {
    const parsed = JSON.parse(equipmentSets) as unknown;

    if (!Array.isArray(parsed)) {
      return createEquipmentSets(firstSet);
    }

    return equipmentSetIndexes.map((setIndex) =>
      setIndex === 0 ? firstSet : normalizeEquipment(parsed[setIndex], createEmptyEquipment())
    );
  } catch {
    return createEquipmentSets(firstSet);
  }
}

export function getEquipmentForSet(character: Character, equipmentSet: EquipmentSetIndex) {
  return (
    character.equipmentSets[equipmentSet] ??
    (equipmentSet === 0 ? character.equipment : createEmptyEquipment())
  );
}

export function persistEquipmentSet(
  characterId: string,
  character: Character,
  equipmentSet: EquipmentSetIndex,
  equipment: Character["equipment"],
  now: string
) {
  const equipmentSets = equipmentSetIndexes.map((setIndex) =>
    setIndex === equipmentSet ? equipment : getEquipmentForSet(character, setIndex)
  );

  if (equipmentSet === 0) {
    db.prepare(
      `UPDATE characters
        SET equipment_sets = ?,
            helmet = ?,
            suit = ?,
            gloves = ?,
            boots = ?,
            flying = ?,
            cs_boots = ?,
            cs_gloves = ?,
            cs_suit = ?,
            cs_helm = ?,
            mask = ?,
            cloak = ?,
            ammo = ?,
            offhand = ?,
            mainhand = ?,
            ring_r = ?,
            earring_r = ?,
            necklace = ?,
            earring_l = ?,
            ring_l = ?,
            updated_at = ?
        WHERE id = ?`
    ).run(
      JSON.stringify(equipmentSets),
      equipment.helmet,
      equipment.suit,
      equipment.gloves,
      equipment.boots,
      equipment.flying,
      equipment.csBoots,
      equipment.csGloves,
      equipment.csSuit,
      equipment.csHelm,
      equipment.mask,
      equipment.cloak,
      equipment.ammo,
      equipment.offhand,
      equipment.mainhand,
      equipment.ringR,
      equipment.earringR,
      equipment.necklace,
      equipment.earringL,
      equipment.ringL,
      now,
      characterId
    );
    return;
  }

  db.prepare("UPDATE characters SET equipment_sets = ?, updated_at = ? WHERE id = ?").run(
    JSON.stringify(equipmentSets),
    now,
    characterId
  );
}

export function normalizeRequirement(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

export function getJobLineage(job: string) {
  const secondJob = thirdJobToSecondJob[job];
  const firstJob = secondJob ? secondJobToFirstJob[secondJob] : secondJobToFirstJob[job];

  return [job, secondJob, firstJob, "Vagrant"].filter((value): value is string => Boolean(value));
}

export function canEquipRequiredJob(character: Character, requiredJob: string | null) {
  if (!requiredJob) {
    return true;
  }

  const normalizedRequirement = normalizeRequirement(requiredJob);

  return getJobLineage(character.job).some((job) => normalizeRequirement(job) === normalizedRequirement);
}

export function getEquipmentRequirementError(character: Character, item: ItemMetadata) {
  const missingRequirements: string[] = [];

  if (item.level !== null && character.level < item.level) {
    missingRequirements.push(`Level: ${item.level}`);
  }

  if (item.sex && item.sex !== character.gender) {
    missingRequirements.push(`Gender: ${item.sex}`);
  }

  if (!canEquipRequiredJob(character, item.requiredJob)) {
    missingRequirements.push(`Job: ${item.requiredJob}`);
  }

  return missingRequirements.length > 0 ? `Missing requirements:\n${missingRequirements.join("\n")}` : null;
}
