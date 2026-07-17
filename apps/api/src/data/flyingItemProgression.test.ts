import { addFlyingItemProgressionDescription, getFlyingItemTier } from "./flyingItemProgression.js";

describe("flying item progression", () => {
  it("returns configured tiers and zero for other items", () => {
    expect(getFlyingItemTier("8507")).toBe(1);
    expect(getFlyingItemTier("4715")).toBe(4);
    expect(getFlyingItemTier("unknown")).toBe(0);
    expect(getFlyingItemTier(null)).toBe(0);
  });

  it("appends free-travel descriptions only to flying items", () => {
    expect(addFlyingItemProgressionDescription("8507", "A board.")).toBe(
      "A board. Allows free travel up to Saint Morning and Rhisis."
    );
    expect(addFlyingItemProgressionDescription("8507", null)).toBe(
      "Allows free travel up to Saint Morning and Rhisis."
    );
    expect(addFlyingItemProgressionDescription("other", "Untouched")).toBe("Untouched");
  });
});
