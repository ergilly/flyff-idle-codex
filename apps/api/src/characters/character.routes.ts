import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { characterRepository } from "../data/characterRepository.js";
import type { AuthTokenPayload } from "../types.js";

export const characterRouter = Router();

characterRouter.get("/", requireAuth, async (_request, response) => {
  const auth = response.locals.auth as AuthTokenPayload;
  const characters = (await characterRepository.listByPlayerId(auth.sub)).map(
    ({ playerId: _playerId, slotIndex: _slotIndex, ...character }) => character
  );

  response.json({ characters });
});
