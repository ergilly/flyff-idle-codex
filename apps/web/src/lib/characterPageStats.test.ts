import { buildCharacter } from "@/test/fixtures";
import { getCharacterDetailStats } from "./characterPageStats";

test("returns the character combat snapshot stats", () => {
  expect(getCharacterDetailStats(buildCharacter(), {}, 0)).toEqual(
    expect.arrayContaining([expect.objectContaining({ label: "ATK" })])
  );
});
