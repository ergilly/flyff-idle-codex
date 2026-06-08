export type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
};

export type Character = {
  id: string;
  slotIndex: number;
  name: string;
  gender: CharacterGender;
  job: string;
  progressionRank: CharacterProgressionRank;
  level: number;
  exp: number;
  penya: number;
  stats: CharacterStats;
  skillLevels: CharacterSkillLevels;
  equipment: CharacterEquipment;
  inventory: CharacterInventory;
};

export type CharacterGender = "male" | "female";
export type CharacterProgressionRank = "normal" | "master" | "hero";

export type CharacterStats = {
  str: number;
  sta: number;
  dex: number;
  int: number;
};

export type CharacterSkillLevels = Record<string, number>;

export type CharacterEquipment = {
  helmet: string | null;
  suit: string | null;
  gloves: string | null;
  boots: string | null;
  flying: string | null;
  csBoots: string | null;
  csGloves: string | null;
  csSuit: string | null;
  csHelm: string | null;
  mask: string | null;
  cloak: string | null;
  ammo: string | null;
  offhand: string | null;
  mainhand: string | null;
  ringR: string | null;
  earringR: string | null;
  necklace: string | null;
  earringL: string | null;
  ringL: string | null;
};

export type CharacterInventory = {
  size: number;
  items: CharacterInventoryItem[];
};

export type CharacterInventoryItem = {
  slotIndex: number;
  itemId: string;
  quantity: number;
};

export type ItemMetadata = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string | null;
  subcategory: string | null;
  rarity: string | null;
  level: number | null;
  sex: string | null;
  requiredJob: string | null;
  minAttack: number | null;
  maxAttack: number | null;
  attackSpeed: string | null;
  twoHanded: boolean | null;
  minDefense: number | null;
  maxDefense: number | null;
  abilities: Array<{
    parameter: string;
    add: number | null;
    rate: boolean;
  }>;
};

export type DataSetQueryResponse<T> = {
  dataSet: string;
  total: number;
  limit: number;
  offset: number;
  results: T[];
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const flyffItemImageBaseUrl = "https://api.flyff.com/image/item";

export function getItemIconUrl(icon: string) {
  return `${flyffItemImageBaseUrl}/${encodeURIComponent(icon)}`;
}

export async function fetchItems(token: string, itemIds: string[]): Promise<ItemMetadata[]> {
  const uniqueItemIds = Array.from(new Set(itemIds.filter(Boolean)));

  if (uniqueItemIds.length === 0) {
    return [];
  }

  const response = await fetch(`${apiBaseUrl}/api/items?ids=${uniqueItemIds.join(",")}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Unable to load item icons");
  }

  const data = (await response.json()) as { items: ItemMetadata[] };
  return data.items;
}

export async function fetchDataSet<T>(
  dataSet: string,
  query: Record<string, string | number | boolean | undefined> = {}
): Promise<T[]> {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  });

  const queryString = params.toString();
  const response = await fetch(`${apiBaseUrl}/api/data/${dataSet}${queryString ? `?${queryString}` : ""}`);

  if (!response.ok) {
    throw new Error(`Unable to load ${dataSet} data`);
  }

  const data = (await response.json()) as DataSetQueryResponse<T>;
  return data.results;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error("Invalid email or password");
  }

  return response.json() as Promise<AuthResponse>;
}

export async function register(displayName: string, email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ displayName, email, password })
  });

  if (!response.ok) {
    throw new Error(response.status === 409 ? "Email already registered" : "Unable to create profile");
  }

  return response.json() as Promise<AuthResponse>;
}

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
  progression: { skillLevels?: CharacterSkillLevels; stats?: CharacterStats }
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
