import type { Character } from "../types.js";

export function toPublicCharacter({ playerId: _playerId, ...character }: Character) {
  return character;
}
