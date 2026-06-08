import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { findItemsByIds } from "./itemIconRepository.js";

export const itemRouter = Router();

const itemIdsSchema = z
  .string()
  .transform((ids) =>
    ids
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  )
  .pipe(z.array(z.string().regex(/^\d+$/)).max(50));

itemRouter.get("/", requireAuth, (request, response) => {
  const result = itemIdsSchema.safeParse(request.query.ids);

  if (!result.success) {
    response.status(400).json({ error: "Item ids are required" });
    return;
  }

  response.json({ items: findItemsByIds(result.data) });
});
