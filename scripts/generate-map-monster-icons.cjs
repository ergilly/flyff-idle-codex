const fs = require("node:fs/promises");
const https = require("node:https");
const path = require("node:path");
const sharp = require("sharp");

const repoRoot = path.resolve(__dirname, "..");
const mapMonstersPath = path.join(repoRoot, "docs", "json", "mapMonsters.json");
const outputDirectory = path.join(repoRoot, "apps", "web", "public", "images", "monster-icons");
const monsterImageBaseUrl = "https://api.flyff.com/image/monster";
const canvasSize = 96;
const iconFitSize = 74;

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getVariantSortRank(monster) {
  const rank = String(monster.rank ?? "").toLowerCase();

  return rank === "normal" ? 0 : rank === "small" ? 1 : rank === "captain" ? 2 : rank === "giant" ? 3 : 4;
}

async function downloadImage(icon) {
  const url = `${monsterImageBaseUrl}/${encodeURIComponent(icon)}`;

  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`Unable to download ${icon}: ${response.statusCode} ${response.statusMessage}`));
          return;
        }

        const chunks = [];

        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

async function normalizeIcon(sourceBuffer) {
  const trimmed = sharp(sourceBuffer).trim({ threshold: 1 });
  const metadata = await trimmed.metadata();
  const scale = Math.min(
    iconFitSize / (metadata.width ?? iconFitSize),
    iconFitSize / (metadata.height ?? iconFitSize),
    1
  );
  const width = Math.max(1, Math.round((metadata.width ?? iconFitSize) * scale));
  const height = Math.max(1, Math.round((metadata.height ?? iconFitSize) * scale));

  return sharp({
    create: {
      background: { alpha: 0, b: 0, g: 0, r: 0 },
      channels: 4,
      height: canvasSize,
      width: canvasSize
    }
  })
    .composite([
      {
        input: await trimmed.resize(width, height, { fit: "contain" }).png().toBuffer(),
        left: Math.floor((canvasSize - width) / 2),
        top: Math.floor((canvasSize - height) / 2)
      }
    ])
    .png()
    .toBuffer();
}

async function main() {
  const mapMonsters = JSON.parse(await fs.readFile(mapMonstersPath, "utf8"));
  const monstersByFamily = new Map();

  Object.values(mapMonsters).forEach((monster) => {
    if (!monster.family || !monster.icon) {
      return;
    }

    const familyMonsters = monstersByFamily.get(monster.family) ?? [];
    familyMonsters.push(monster);
    monstersByFamily.set(monster.family, familyMonsters);
  });

  await fs.mkdir(outputDirectory, { recursive: true });

  const iconSources = Array.from(monstersByFamily.entries())
    .map(([family, monsters]) => {
      const source = [...monsters].sort(
        (first, second) =>
          getVariantSortRank(first) - getVariantSortRank(second) || (first.level ?? 0) - (second.level ?? 0)
      )[0];

      return {
        family,
        icon: source.icon,
        name: source.name,
        outputPath: path.join(outputDirectory, `${slugify(family)}.png`)
      };
    })
    .sort((first, second) => first.family.localeCompare(second.family));

  const failures = [];

  for (const source of iconSources) {
    try {
      const sourceBuffer = await downloadImage(source.icon);
      const normalizedBuffer = await normalizeIcon(sourceBuffer);

      await fs.writeFile(source.outputPath, normalizedBuffer);
      console.log(
        `generated ${path.relative(repoRoot, source.outputPath)} from ${source.name} (${source.icon})`
      );
    } catch (error) {
      failures.push({ ...source, error: error instanceof Error ? error.message : String(error) });
      console.error(`failed ${source.family}: ${failures.at(-1).error}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Failed to generate ${failures.length} monster icons`);
  }

  console.log(`Generated ${iconSources.length} normalized monster icons.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
