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
  const confirmationName = encodeURIComponent(name);
  const response = await fetch(
    `${apiBaseUrl}/api/characters/${characterId}?confirmationName=${confirmationName}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      response.status === 400 ? "Character name confirmation does not match" : "Unable to delete character"
    );
  }
}

export async function travelCharacter(
  token: string,
  characterId: string,
  destination: import("@/lib/mapMonsterMarkers").MapRegionId,
  method: "flying" | "blinkwing",
  equipmentSet = 0
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/characters/${characterId}/travel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ destination, method, equipmentSet })
  });

  const data = (await response.json().catch(() => null)) as { character?: Character; error?: string } | null;

  if (!response.ok || !data?.character) {
    throw new Error(data?.error ?? "Unable to travel");
  }

  return data.character;
}

export async function persistCharacterBattleState(
  token: string,
  characterId: string,
  progression: { exp: number; level: number; penya: number }
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/characters/${characterId}/progression/battle-state`, {
    method: "PUT",
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

async function allocateCharacterProgression(
  token: string,
  characterId: string,
  allocationType: "skill" | "stat",
  allocations: CharacterSkillLevels | Record<keyof CharacterStats, number>
): Promise<Character> {
  const response = await fetch(
    `${apiBaseUrl}/api/characters/${characterId}/progression/${allocationType}-allocations`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ allocations })
    }
  );

  const data = (await response.json().catch(() => null)) as { character?: Character; error?: string } | null;
  if (!response.ok || !data?.character) throw new Error(data?.error ?? "Unable to allocate points");
  return data.character;
}

export function allocateCharacterStats(
  token: string,
  characterId: string,
  allocations: Record<keyof CharacterStats, number>
) {
  return allocateCharacterProgression(token, characterId, "stat", allocations);
}

export function allocateCharacterSkills(
  token: string,
  characterId: string,
  allocations: CharacterSkillLevels
) {
  return allocateCharacterProgression(token, characterId, "skill", allocations);
}

export async function sellCharacterInventoryItem(
  token: string,
  characterId: string,
  slotIndex: number,
  quantity: number
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/characters/${characterId}/shops/sales`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ slotIndex, quantity })
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Unable to sell item");
  }
  return ((await response.json()) as { character: Character }).character;
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

export async function addCharacterPenya(
  token: string,
  characterId: string,
  amount: number
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/admin/characters/${characterId}/penya`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ amount })
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(
      response.status === 403 ? "Admin access is required" : (data?.error ?? "Unable to add Penya")
    );
  }

  return ((await response.json()) as { character: Character }).character;
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

export async function consumeEquippedArrow(
  token: string,
  characterId: string,
  equipmentSet = 0
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/characters/${characterId}/equipment/ammo/consume`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ equipmentSet })
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Unable to consume equipped arrow");
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
