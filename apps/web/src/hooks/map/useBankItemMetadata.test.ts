import { renderHook, waitFor } from "@testing-library/react";
import { fetchItems } from "@/lib/api";
import { useBankItemMetadata } from "@/hooks/map/useBankItemMetadata";
import { buildItem } from "@/test/fixtures";

jest.mock("@/lib/api", () => ({
  fetchItems: jest.fn()
}));

describe("useBankItemMetadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("loads metadata for an item that only exists in the shared bank", async () => {
    const storedItem = buildItem({ id: "600", name: "Banked Item" });
    jest.mocked(fetchItems).mockResolvedValue([storedItem]);
    localStorage.setItem("flyffIdleToken", "token");
    const { result } = renderHook(() =>
      useBankItemMetadata(
        { size: 100, penya: 0, items: [{ slotIndex: 4, itemId: storedItem.id, quantity: 2 }] },
        {}
      )
    );

    await waitFor(() => expect(result.current.itemsById[storedItem.id]).toEqual(storedItem));
    expect(fetchItems).toHaveBeenCalledWith("token", [storedItem.id]);
  });

  it("reuses supplied metadata without making another request", () => {
    const storedItem = buildItem({ id: "700" });
    const { result } = renderHook(() =>
      useBankItemMetadata(
        { size: 100, penya: 0, items: [{ slotIndex: 0, itemId: storedItem.id, quantity: 1 }] },
        { [storedItem.id]: storedItem }
      )
    );

    expect(result.current.itemsById[storedItem.id]).toEqual(storedItem);
    expect(fetchItems).not.toHaveBeenCalled();
  });
});
