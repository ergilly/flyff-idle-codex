import { getTestIdSegment } from "@/lib/testIds";

describe("getTestIdSegment", () => {
  it("splits camelCase boundaries before normalizing", () => {
    expect(getTestIdSegment("ringL")).toBe("ring_l");
    expect(getTestIdSegment("csBoots")).toBe("cs_boots");
  });

  it("normalizes whitespace and punctuation to single underscores", () => {
    expect(getTestIdSegment(" Heavy hit! ")).toBe("heavy_hit");
    expect(getTestIdSegment("Level: 75 / Job: Mercenary")).toBe("level_75_job_mercenary");
  });

  it("uses a non-empty fallback when the input has no alphanumeric characters", () => {
    expect(getTestIdSegment("!!!")).toBe("value");
    expect(getTestIdSegment("", "message")).toBe("message");
    expect(getTestIdSegment("___", "fallback label")).toBe("fallback_label");
  });
});
