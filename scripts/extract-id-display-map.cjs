#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const vm = require("vm");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseNumber(text) {
  const n = Number(text);
  if (!Number.isFinite(n)) {
    fail(`Could not parse number: ${text}`);
  }
  return n;
}

function findFunctionBlock(source, fnName) {
  const signature = `function ${fnName}(`;
  const start = source.indexOf(signature);
  if (start === -1) return null;

  const openBrace = source.indexOf("{", start);
  if (openBrace === -1) return null;

  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let escaped = false;

  for (let i = openBrace; i < source.length; i += 1) {
    const ch = source[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      continue;
    }

    if (!inDouble && !inTemplate && ch === "'") {
      inSingle = !inSingle;
      continue;
    }
    if (!inSingle && !inTemplate && ch === '"') {
      inDouble = !inDouble;
      continue;
    }
    if (!inSingle && !inDouble && ch === "`") {
      inTemplate = !inTemplate;
      continue;
    }

    if (inSingle || inDouble || inTemplate) continue;

    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }

  return null;
}

function extractArrayLiteralFromFunction(fnBlock) {
  // Matches: const _0xabc = [ ... ];
  const m = fnBlock.match(/const\s+_0x[\da-f]+\s*=\s*(\[[\s\S]*?\]);/i);
  if (!m) return null;
  return m[1];
}

function decodeToken(token, lookupName, stringTable, offset) {
  const value = token.trim();

  // Quoted literal string.
  if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
    try {
      return vm.runInNewContext(value, Object.create(null));
    } catch {
      return null;
    }
  }

  // Direct numeric literal, return as string for id normalization.
  if (/^(0x[\da-f]+|\d+)$/i.test(value)) {
    return String(parseNumber(value));
  }

  // Obfuscated lookup call, e.g. _0x17a327(0x618d)
  const lookupRe = new RegExp(`^${lookupName}\\((0x[\\da-f]+|\\d+)\\)$`, "i");
  const call = value.match(lookupRe);
  if (call) {
    const idx = parseNumber(call[1]) - offset;
    if (idx < 0 || idx >= stringTable.length) return null;
    return stringTable[idx];
  }

  return null;
}

function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3] || path.resolve(process.cwd(), "id-display-map.json");

  if (!inputPath) {
    fail("Usage: node scripts/extract-id-display-map.cjs <path-to-viewer.js> [output-json-path]");
  }

  if (!fs.existsSync(inputPath)) {
    fail(`Input file does not exist: ${inputPath}`);
  }

  const source = fs.readFileSync(inputPath, "utf8");

  if (!source.trim()) {
    fail(
      `Input file is empty: ${path.resolve(inputPath)}. Save viewer.js from the editor first, then rerun.`
    );
  }

  // Extract decoder function details.
  const decoderMatch = source.match(
    /function\s+(_0x[\da-f]+)\s*\(\s*(_0x[\da-f]+)\s*,\s*(_0x[\da-f]+)\s*\)\s*\{[\s\S]*?\2\s*=\s*\2\s*-\s*(0x[\da-f]+|\d+);[\s\S]*?const\s+_0x[\da-f]+\s*=\s*(_0x[\da-f]+)\(\);/i
  );

  if (!decoderMatch) {
    fail(
      "Could not find obfuscation decoder function. Ensure this is the bundled/obfuscated viewer.js file and not an empty or different file variant."
    );
  }

  const lookupName = decoderMatch[1];
  const offset = parseNumber(decoderMatch[4]);
  const arrayFnName = decoderMatch[5];

  const arrayFnBlock = findFunctionBlock(source, arrayFnName);
  if (!arrayFnBlock) {
    fail(`Could not find string table function: ${arrayFnName}`);
  }

  const arrayLiteral = extractArrayLiteralFromFunction(arrayFnBlock);
  if (!arrayLiteral) {
    fail("Could not extract string table array literal.");
  }

  let stringTable;
  try {
    stringTable = vm.runInNewContext(arrayLiteral, Object.create(null));
  } catch (err) {
    fail(`Failed to evaluate string table: ${err.message}`);
  }

  if (!Array.isArray(stringTable)) {
    fail("Evaluated string table is not an array.");
  }

  // Extract item records with id + displayName.
  const recordRe =
    /\{\s*'id':\s*([^,]+),\s*'modelName':\s*([^,]+),\s*'displayName':\s*([^,]+),\s*'ignorePart':\s*([^,]+),\s*'sex':\s*([^}\n]+)\s*\}/g;

  const pairs = [];
  const idToName = Object.create(null);
  let m;

  while ((m = recordRe.exec(source)) !== null) {
    const rawId = m[1];
    const rawDisplayName = m[3];

    const idVal = decodeToken(rawId, lookupName, stringTable, offset);
    const nameVal = decodeToken(rawDisplayName, lookupName, stringTable, offset);

    if (typeof idVal !== "string" || typeof nameVal !== "string") continue;

    if (!/^\d+$/.test(idVal)) continue;

    if (!(idVal in idToName)) {
      idToName[idVal] = nameVal;
      pairs.push({ id: idVal, displayName: nameVal });
    }
  }

  const output = {
    source: path.resolve(inputPath),
    total: pairs.length,
    pairs,
    idToName
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(`Extracted ${pairs.length} id->displayName mappings.`);
  console.log(`Wrote: ${path.resolve(outputPath)}`);
}

main();
