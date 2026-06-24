import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config.js";
import { userRepository } from "../data/userRepository.js";
import type { AuthTokenPayload, PublicUser, User } from "../types.js";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const registerSchema = loginSchema.extend({
  displayName: z.string().trim().min(2).max(32)
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

type AuthSession = { token: string; user: PublicUser };

function createSession(user: User): AuthSession {
  const payload: AuthTokenPayload = {
    sub: user.id,
    email: user.email
  };

  const token = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.tokenExpiresIn
  });

  const { passwordHash: _passwordHash, ...publicUser } = user;

  return {
    token,
    user: publicUser
  };
}

export async function login(input: LoginInput): Promise<AuthSession | null> {
  const user = await userRepository.findByEmail(input.email);

  if (!user) {
    return null;
  }

  const validPassword = await bcrypt.compare(input.password, user.passwordHash);

  if (!validPassword) {
    return null;
  }

  return createSession(user);
}

export async function register(input: RegisterInput): Promise<AuthSession | null> {
  const existingUser = await userRepository.findByEmail(input.email);

  if (existingUser) {
    return null;
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await userRepository.create({
    email: input.email,
    displayName: input.displayName.trim(),
    passwordHash
  });

  return createSession(user);
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret);

    if (typeof payload === "string" || typeof payload.sub !== "string" || typeof payload.email !== "string") {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email
    };
  } catch {
    return null;
  }
}
