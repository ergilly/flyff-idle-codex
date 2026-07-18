import { apiBaseUrl } from "@/lib/api/config";
import type { BankUpdate } from "@/lib/api/types";

async function bankRequest(
  token: string,
  characterId: string,
  path = "",
  body?: object
): Promise<BankUpdate> {
  const response = await fetch(`${apiBaseUrl}/api/characters/${characterId}/bank${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const data = (await response.json().catch(() => null)) as (Partial<BankUpdate> & { error?: string }) | null;

  if (!response.ok || !data?.bank || !data.character) {
    throw new Error(data?.error ?? "Unable to update bank");
  }
  return { bank: data.bank, character: data.character };
}

export function fetchBank(token: string, characterId: string) {
  return bankRequest(token, characterId);
}

export function transferBankItem(
  token: string,
  characterId: string,
  direction: "deposit" | "withdraw",
  slotIndex: number
) {
  return bankRequest(token, characterId, "/items", { direction, slotIndex });
}

export function transferAllBankItems(token: string, characterId: string, direction: "deposit" | "withdraw") {
  return bankRequest(token, characterId, "/items/all", { direction });
}

export function transferBankPenya(
  token: string,
  characterId: string,
  direction: "deposit" | "withdraw",
  amount: number | "all"
) {
  return bankRequest(token, characterId, "/penya", { direction, amount });
}
