import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "./auth.service.js";

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const header = request.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    response.status(401).json({ error: "Missing bearer token" });
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    response.status(401).json({ error: "Invalid bearer token" });
    return;
  }

  response.locals.auth = payload;
  next();
}
