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
  level: number;
  exp: number;
  penya: number;
  stats: CharacterStats;
  equipment: CharacterEquipment;
  inventory: CharacterInventory;
};

export type CharacterGender = "male" | "female";

export type CharacterStats = {
  str: number;
  sta: number;
  dex: number;
  int: number;
};

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

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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
