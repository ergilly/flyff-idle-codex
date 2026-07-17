import "dotenv/config";
import path from "node:path";
import type { SignOptions } from "jsonwebtoken";

const tokenExpiresIn: SignOptions["expiresIn"] = "2h";
const jwtSecret = process.env.JWT_SECRET ?? "dev-secret-change-me";

if (process.env.NODE_ENV === "production" && jwtSecret === "dev-secret-change-me") {
  throw new Error("JWT_SECRET must be set to a non-default value in production");
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret,
  imageCacheDir:
    process.env.IMAGE_CACHE_DIR ??
    (process.env.NODE_ENV === "production"
      ? "/var/lib/flyff-idle/image-cache"
      : path.resolve(process.cwd(), "data/image-cache")),
  tokenExpiresIn
};
