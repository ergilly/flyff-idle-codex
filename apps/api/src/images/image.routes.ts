import fs from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import { config } from "../config.js";

export const imageRouter = Router();

const upstreamPaths = {
  item: "item",
  monster: "monster",
  skill: "skill/colored"
} as const;
const pendingImages = new Map<string, Promise<Buffer>>();
const imageCacheControl = "public, max-age=2592000, stale-while-revalidate=86400";
const maxImageBytes = 5 * 1024 * 1024;

imageRouter.get("/:category/:filename", async (request, response) => {
  const category = request.params.category;
  const filename = request.params.filename;

  if (!isImageCategory(category) || !isSafeFilename(filename)) {
    response.status(400).json({ error: "Invalid image path" });
    return;
  }

  try {
    const image = await getCachedImage(category, filename);

    response.set("Cache-Control", imageCacheControl);
    response.type(path.extname(filename)).send(image);
  } catch (error) {
    console.error("Unable to load cached image", error);
    response.status(502).json({ error: "Unable to load image" });
  }
});

function isImageCategory(category: string): category is keyof typeof upstreamPaths {
  return Object.hasOwn(upstreamPaths, category);
}

function isSafeFilename(filename: string) {
  return filename.length <= 160 && /^[a-zA-Z0-9._-]+$/.test(filename) && path.basename(filename) === filename;
}

function getCachedImage(category: keyof typeof upstreamPaths, filename: string) {
  const cacheKey = `${category}/${filename}`;
  const pendingImage = pendingImages.get(cacheKey);

  if (pendingImage) {
    return pendingImage;
  }

  const image = readOrFetchImage(category, filename).finally(() => pendingImages.delete(cacheKey));
  pendingImages.set(cacheKey, image);
  return image;
}

async function readOrFetchImage(category: keyof typeof upstreamPaths, filename: string) {
  const categoryDirectory = path.join(config.imageCacheDir, category);
  const cachePath = path.join(categoryDirectory, filename);

  try {
    return await fs.readFile(cachePath);
  } catch (error) {
    if (!isFileError(error, "ENOENT")) {
      throw error;
    }
  }

  const upstreamUrl = `https://api.flyff.com/image/${upstreamPaths[category]}/${encodeURIComponent(filename)}`;
  const upstreamResponse = await fetch(upstreamUrl);

  if (!upstreamResponse.ok || !upstreamResponse.headers.get("content-type")?.startsWith("image/")) {
    throw new Error(`Image upstream returned ${upstreamResponse.status}`);
  }

  const image = Buffer.from(await upstreamResponse.arrayBuffer());

  if (image.byteLength > maxImageBytes) {
    throw new Error("Image exceeds cache size limit");
  }

  await fs.mkdir(categoryDirectory, { recursive: true });
  await fs.writeFile(cachePath, image, { flag: "wx" }).catch((error: unknown) => {
    if (!isFileError(error, "EEXIST")) {
      throw error;
    }
  });

  return image;
}

function isFileError(error: unknown, code: string): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}
