import type { CharacterEquipment, CharacterStats } from "../types.js";

export function createSeedEquipment(equipment: Partial<CharacterEquipment> = {}): CharacterEquipment {
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
    suit: null,
    ...equipment
  };
}

export function createSeedStats(stats: Partial<CharacterStats> = {}): CharacterStats {
  return {
    str: 15,
    sta: 15,
    dex: 15,
    int: 15,
    ...stats
  };
}

export function createSeedEquipmentSets(equipment: CharacterEquipment) {
  return [equipment, createSeedEquipment(), createSeedEquipment()];
}

const level120NormalStatPoints = 2 * (120 - 1);
const maxedLevel120Stat = 15 + level120NormalStatPoints;

export const secondJobLoadouts = {
  Blade: createSeedEquipment({
    helmet: "7039",
    suit: "8994",
    gloves: "6355",
    boots: "456",
    mainhand: "8767",
    offhand: "8767"
  }),
  Knight: createSeedEquipment({
    helmet: "1632",
    suit: "6944",
    gloves: "2944",
    boots: "5909",
    mainhand: "3674"
  }),
  Elementor: createSeedEquipment({
    helmet: "2067",
    suit: "9666",
    gloves: "279",
    boots: "2342",
    mainhand: "153"
  }),
  Psykeeper: createSeedEquipment({
    helmet: "8428",
    suit: "5264",
    gloves: "3966",
    boots: "9626",
    mainhand: "5980"
  }),
  Billposter: createSeedEquipment({
    helmet: "7937",
    suit: "831",
    gloves: "8800",
    boots: "4340",
    mainhand: "1626"
  }),
  Ringmaster: createSeedEquipment({
    helmet: "118",
    suit: "3032",
    gloves: "5727",
    boots: "1850",
    mainhand: "6315"
  }),
  Jester: createSeedEquipment({
    helmet: "8640",
    suit: "7022",
    gloves: "6786",
    boots: "7633",
    mainhand: "8901"
  }),
  Ranger: createSeedEquipment({
    helmet: "8430",
    suit: "7181",
    gloves: "4421",
    boots: "3514",
    mainhand: "3824"
  })
} satisfies Record<string, CharacterEquipment>;

export const secondJobStats = {
  Blade: createSeedStats({ str: maxedLevel120Stat }),
  Knight: createSeedStats({ sta: maxedLevel120Stat }),
  Elementor: createSeedStats({ int: maxedLevel120Stat }),
  Psykeeper: createSeedStats({ int: maxedLevel120Stat }),
  Billposter: createSeedStats({ str: maxedLevel120Stat }),
  Ringmaster: createSeedStats({ sta: maxedLevel120Stat }),
  Jester: createSeedStats({ str: maxedLevel120Stat }),
  Ranger: createSeedStats({ dex: maxedLevel120Stat })
} satisfies Record<string, CharacterStats>;
