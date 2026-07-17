import { findItemSetByPartId } from "@/lib/itemSets";

describe("itemSets", () => {
  it("indexes generated set metadata by each equipment part", () => {
    expect(findItemSetByPartId("3272")).toEqual(
      expect.objectContaining({
        id: 30,
        name: "Ales Set",
        parts: expect.arrayContaining([expect.objectContaining({ id: 3272, name: "Ales Helmet" })])
      })
    );
  });

  it("returns null for equipment that is not part of a set", () => {
    expect(findItemSetByPartId("not-a-set-part")).toBeNull();
  });
});
