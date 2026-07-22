import type { Response } from "express";
import type { Character } from "../types.js";

export function toPublicCharacter({ playerId: _playerId, ...character }: Character) {
  return character;
}

export function sendCharacter(response: Response, character: Character, status = 200) {
  response.status(status).json({ character: toPublicCharacter(character) });
}
