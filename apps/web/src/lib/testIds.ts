function normalizeTestIdSegment(value: string | number) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function getTestIdSegment(value: string | number, fallback: string | number = "value") {
  return normalizeTestIdSegment(value) || normalizeTestIdSegment(fallback) || "value";
}
