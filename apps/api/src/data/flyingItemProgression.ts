const freeTravelDescriptionByItemId: Record<string, string> = {
  "8507": "Allows free travel up to Saint Morning and Rhisis.",
  "7182": "Allows free travel up to Saint Morning and Rhisis.",
  "2128": "Allows free travel up to Darkon 1, 2, and Darkon 3.",
  "4482": "Allows free travel up to Darkon 1, 2, and Darkon 3.",
  "3258": "Allows free travel up to Shaduwar and the Valley of the Risen.",
  "6333": "Allows free travel up to Shaduwar and the Valley of the Risen.",
  "7336": "Allows free travel up to Eillun and Bahara.",
  "4715": "Allows free travel up to Eillun and Bahara."
};

const flyingItemTierById: Record<string, number> = {
  "8507": 1,
  "7182": 1,
  "2128": 2,
  "4482": 2,
  "3258": 3,
  "6333": 3,
  "7336": 4,
  "4715": 4
};

export function getFlyingItemTier(itemId: string | null) {
  return itemId ? (flyingItemTierById[itemId] ?? 0) : 0;
}

export function addFlyingItemProgressionDescription(itemId: string, description: string | null) {
  const freeTravelDescription = freeTravelDescriptionByItemId[itemId];

  if (!freeTravelDescription) {
    return description;
  }

  return description ? `${description} ${freeTravelDescription}` : freeTravelDescription;
}
