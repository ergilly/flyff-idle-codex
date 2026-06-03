import { Router } from "express";
import { login, loginSchema, register, registerSchema } from "./auth.service.js";

export const authRouter = Router();

authRouter.post("/login", async (request, response) => {
  const result = loginSchema.safeParse(request.body);

  if (!result.success) {
    response.status(400).json({ error: "Email and password are required" });
    return;
  }

  const session = await login(result.data);

  if (!session) {
    response.status(401).json({ error: "Invalid credentials" });
    return;
  }

  response.json(session);
});

authRouter.post("/register", async (request, response) => {
  const result = registerSchema.safeParse(request.body);

  if (!result.success) {
    response.status(400).json({ error: "Display name, email, and password are required" });
    return;
  }

  const session = await register(result.data);

  if (!session) {
    response.status(409).json({ error: "A player already exists for that email" });
    return;
  }

  response.status(201).json(session);
});
