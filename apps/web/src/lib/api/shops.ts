import { apiBaseUrl } from "@/lib/api/config";
import { type Character } from "@/lib/api/types";
import { type TownShop } from "@/lib/townShops";

export async function fetchTownShop(townMapId: string, locationId: string): Promise<TownShop> {
  const response = await fetch(`${apiBaseUrl}/api/shops/${townMapId}/${locationId}`);

  if (!response.ok) {
    throw new Error(
      response.status === 404 ? "This merchant has no standard shop inventory" : "Unable to load shop"
    );
  }

  return ((await response.json()) as { shop: TownShop }).shop;
}

export async function purchaseTownShopItem(
  token: string,
  characterId: string,
  townMapId: string,
  locationId: string,
  itemId: string,
  quantity: number
): Promise<Character> {
  const response = await fetch(
    `${apiBaseUrl}/api/characters/${characterId}/shops/${townMapId}/${locationId}/purchases`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ itemId, quantity })
    }
  );

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Unable to purchase item");
  }

  return ((await response.json()) as { character: Character }).character;
}
