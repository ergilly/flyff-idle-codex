import { renderHook, waitFor } from "@testing-library/react";
import { fetchItems } from "@/lib/api";
import { buildItem, buildMonsterFamily } from "@/test/fixtures";
import { useMapQuestItemMetadata } from "./useMapQuestItemMetadata";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  fetchItems: jest.fn()
}));

const mockedFetchItems = jest.mocked(fetchItems);

beforeEach(() => {
  localStorage.setItem("flyffIdleToken", "token");
  mockedFetchItems.mockReset();
});

it("loads missing map quest items through the authoritative item endpoint", async () => {
  const item = buildItem({ id: "100", icon: "authoritative.png", name: "Twinkle Stone" });
  const family = buildMonsterFamily({
    questDrops: [{ id: 100, icon: "map-fallback.png", name: "Twinkle Stone" }]
  });
  mockedFetchItems.mockResolvedValue([item]);

  const { result } = renderHook(() => useMapQuestItemMetadata([family], {}));

  await waitFor(() => expect(result.current["100"]).toEqual(item));
  expect(mockedFetchItems).toHaveBeenCalledWith("token", ["100"]);
});

it("keeps supplied metadata without fetching it again", () => {
  const item = buildItem({ id: "100" });
  const family = buildMonsterFamily({
    questDrops: [{ id: 100, icon: "map-fallback.png", name: "Twinkle Stone" }]
  });

  const { result } = renderHook(() => useMapQuestItemMetadata([family], { "100": item }));

  expect(result.current["100"]).toEqual(item);
  expect(mockedFetchItems).not.toHaveBeenCalled();
});
