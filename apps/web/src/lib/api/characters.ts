import { apiBaseUrl } from "@/lib/api/config";
import {
  type Character,
  type CharacterConsumableResource,
  type CharacterEquipmentSlot,
  type CharacterGender,
  type CharacterSkillLevels,
  type CharacterStats,
  type InventorySortOption
} from "@/lib/api/types";

export async function fetchCharacters(token: string): Promise<Character[]> {
  const response = await fetch(`${apiBaseUrl}/api/characters`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Unable to load characters");
  }

  const data = (await response.json()) as { characters: Character[] };
  return data.characters;
}

export async function createCharacter(
  token: string,
  slotIndex: number,
  name: string,
  gender: CharacterGender
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/characters`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ slotIndex, name, gender })
  });

  if (!response.ok) {
    throw new Error(
      response.status === 409 ? "That character slot is already occupied" : "Unable to create character"
    );
  }

  const data = (await response.json()) as { character: Character };
  return data.character;
}

export async function deleteCharacter(token: string, characterId: string, name: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/characters/${characterId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name })
  });

  if (!response.ok) {
    throw new Error(
      response.status === 400 ? "Character name confirmation does not match" : "Unable to delete character"
    );
  }
}

export async function updateCharacterProgression(
  token: string,
  characterId: string,
  progression: {
    exp?: number;
    level?: number;
    penya?: number;
    skillLevels?: CharacterSkillLevels;
    stats?: CharacterStats;
  }
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/characters/${characterId}/progression`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(progression)
  });

  if (!response.ok) {
    throw new Error("Unable to save character progression");
  }

  const data = (await response.json()) as { character: Character };
  return data.character;
}

async function refundCharacterPoints(
  token: string,
  characterId: string,
  refundType: "stats" | "skills"
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/admin/characters/${characterId}/refund-${refundType}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(response.status === 403 ? "Admin access is required" : "Unable to refund points");
  }

  const data = (await response.json()) as { character: Character };
  return data.character;
}

export function refundCharacterStats(token: string, characterId: string): Promise<Character> {
  return refundCharacterPoints(token, characterId, "stats");
}

export function refundCharacterSkills(token: string, characterId: string): Promise<Character> {
  return refundCharacterPoints(token, characterId, "skills");
}

export async function addCharacterInventoryItem(
  token: string,
  characterId: string,
  input: { itemId: string; quantity: number }
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/admin/characters/${characterId}/inventory`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(
      response.status === 403
        ? "Admin access is required"
        : response.status === 404
          ? "Item or character not found"
          : (data?.error ?? "Unable to add item")
    );
  }

  const data = (await response.json()) as { character: Character };
  return data.character;
}

export async function equipInventoryItem(
  token: string,
  characterId: string,
  slotIndex: number,
  equipmentSet = 0
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/characters/${characterId}/inventory/${slotIndex}/equip`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ equipmentSet })
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Unable to equip item");
  }

  const data = (await response.json()) as { character: Character };
  return data.character;
}

export async function equipConsumableItem(
  token: string,
  characterId: string,
  resource: CharacterConsumableResource,
  slotIndex: number | null
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/characters/${characterId}/consumables/${resource}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ slotIndex })
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Unable to equip consumable");
  }

  const data = (await response.json()) as { character: Character };
  return data.character;
}

export async function moveInventoryItem(
  token: string,
  characterId: string,
  fromSlotIndex: number,
  toSlotIndex: number
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/characters/${characterId}/inventory/move`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fromSlotIndex, toSlotIndex })
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Unable to move item");
  }

  const data = (await response.json()) as { character: Character };
  return data.character;
}

export async function consumeInventoryItem(
  token: string,
  characterId: string,
  slotIndex: number
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/characters/${characterId}/inventory/${slotIndex}/consume`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Unable to consume item");
  }

  const data = (await response.json()) as { character: Character };
  return data.character;
}

export async function consumeEquippedConsumableItem(
  token: string,
  characterId: string,
  resource: CharacterConsumableResource
): Promise<Character> {
  const response = await fetch(
    `${apiBaseUrl}/api/characters/${characterId}/consumables/${resource}/consume`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Unable to consume item");
  }

  const data = (await response.json()) as { character: Character };
  return data.character;
}

export async function lootInventoryItems(
  token: string,
  characterId: string,
  items: Array<{ itemId: string; quantity: number }>
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/characters/${characterId}/inventory/loot`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ items })
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Unable to loot items");
  }

  const data = (await response.json()) as { character: Character };
  return data.character;
}

export async function sortInventory(
  token: string,
  characterId: string,
  sortBy: InventorySortOption
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/characters/${characterId}/inventory/sort`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ sortBy })
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Unable to sort inventory");
  }

  const data = (await response.json()) as { character: Character };
  return data.character;
}

export async function unequipItem(
  token: string,
  characterId: string,
  equipmentSlot: CharacterEquipmentSlot,
  equipmentSet = 0
): Promise<Character> {
  const response = await fetch(
    `${apiBaseUrl}/api/characters/${characterId}/equipment/${equipmentSlot}/unequip`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ equipmentSet })
    }
  );

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Unable to unequip item");
  }

  const data = (await response.json()) as { character: Character };
  return data.character;
}
