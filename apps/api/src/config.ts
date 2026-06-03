import "dotenv/config";
import type { SignOptions } from "jsonwebtoken";

const tokenExpiresIn: SignOptions["expiresIn"] = "2h";

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  tokenExpiresIn
};
