import { isQuestDropItem } from "@/lib/itemClassification";
import { buildItem } from "@/test/fixtures";

it("classifies booty and quest-labelled item metadata as quest drops", () => {
  expect(isQuestDropItem(buildItem({ category: "booty" }))).toBe(true);
  expect(isQuestDropItem(buildItem({ category: "quest item" }))).toBe(true);
  expect(isQuestDropItem(buildItem({ category: null, subcategory: "quest reward" }))).toBe(true);
  expect(isQuestDropItem(buildItem({ category: "armor" }))).toBe(false);
  expect(isQuestDropItem(undefined)).toBe(false);
});
