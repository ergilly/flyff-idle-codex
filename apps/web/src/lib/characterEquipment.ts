import { fetchItems, type Character, type CharacterEquipmentSlot } from "@/lib/api";

const emptyEquipment: Character["equipment"] = {
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

export function getEquippedItemIds(character: Character) {
  const equipmentSets = character.equipmentSets?.length ? character.equipmentSets : [character.equipment];

  return equipmentSets.flatMap((equipment) =>
    Object.values(equipment).filter((itemId): itemId is string => Boolean(itemId))
  );
}

export function getEquipmentItems(token: string, character: Character) {
  return fetchItems(token, getEquippedItemIds(character));
}

export function getCharacterEquipmentSet(character: Character, equipmentSet: number) {
  return (
    character.equipmentSets?.[equipmentSet] ?? (equipmentSet === 0 ? character.equipment : emptyEquipment)
  );
}

export function getChangedEquipmentSlot(
  previousCharacter: Character,
  nextCharacter: Character,
  equipmentSet: number
) {
  const previousEquipment = getCharacterEquipmentSet(previousCharacter, equipmentSet);
  const nextEquipment = getCharacterEquipmentSet(nextCharacter, equipmentSet);
  const changedSlot = (Object.keys(nextEquipment) as CharacterEquipmentSlot[]).find(
    (slot) => previousEquipment[slot] !== nextEquipment[slot]
  );

  return changedSlot ?? null;
}
