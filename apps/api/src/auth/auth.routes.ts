import { Router } from "express";
import { isLoginFailure, login, loginSchema, register, registerSchema } from "./auth.service.js";

export const authRouter = Router();

authRouter.post("/login", async (request, response) => {
  const result = loginSchema.safeParse(request.body);

  if (!result.success) {
    response.status(400).json({ error: "Email and password are required" });
    return;
  }

  const loginResult = await login(result.data);

  if (isLoginFailure(loginResult)) {
    if (loginResult.error === "unknown_email") {
      response.status(404).json({ error: "No player account exists for that email." });
      return;
    }

    response.status(401).json({ error: "That password does not match this player account." });
    return;
  }

  response.json(loginResult);
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
