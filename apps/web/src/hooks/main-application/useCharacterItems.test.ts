import { act, renderHook, waitFor } from "@testing-library/react";
import { equipInventoryItem, fetchItems, moveInventoryItem } from "@/lib/api";
import { useCharacterItems } from "@/hooks/main-application/useCharacterItems";
import { buildCharacter, buildItem, buildMonster, buildMonsterFamily, emptyEquipment } from "@/test/fixtures";

jest.mock("@/lib/api", () => ({
  equipConsumableItem: jest.fn(),
  equipInventoryItem: jest.fn(),
  fetchItems: jest.fn(),
  moveInventoryItem: jest.fn(),
  sortInventory: jest.fn(),
  unequipItem: jest.fn()
}));

const mockedFetchItems = fetchItems as jest.MockedFunction<typeof fetchItems>;
const mockedEquipInventoryItem = equipInventoryItem as jest.MockedFunction<typeof equipInventoryItem>;
const mockedMoveInventoryItem = moveInventoryItem as jest.MockedFunction<typeof moveInventoryItem>;

function options(selectedCharacter = buildCharacter()) {
  return {
    onAuthenticationRequired: jest.fn(),
    selectedCharacter,
    selectedMonsterFamily: null,
    updateCharacter: jest.fn()
  };
}

describe("useCharacterItems", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("loads metadata for equipped, inventory, and selected-monster items", async () => {
    localStorage.setItem("flyffIdleToken", "token");
    const selectedCharacter = buildCharacter({
      equipment: { ...buildCharacter().equipment, mainhand: "100" },
      inventory: { size: 50, items: [{ slotIndex: 0, itemId: "200", quantity: 1 }] }
    });
    const selectedMonsterFamily = buildMonsterFamily({
      variants: [buildMonster({ drops: [{ item: 300 }, { item: 200 }] })]
    });
    mockedFetchItems.mockResolvedValue([
      buildItem({ id: "100" }),
      buildItem({ id: "200" }),
      buildItem({ id: "300" })
    ]);

    const { result } = renderHook(() =>
      useCharacterItems({
        ...options(selectedCharacter),
        selectedMonsterFamily
      })
    );

    await waitFor(() => expect(Object.keys(result.current.itemsById)).toEqual(["100", "200", "300"]));
    expect(mockedFetchItems).toHaveBeenCalledWith("token", ["100", "200", "300", "200"]);
  });

  it("ignores stale metadata after the selected character changes", async () => {
    localStorage.setItem("flyffIdleToken", "token");
    let resolveFirstRequest!: (items: ReturnType<typeof buildItem>[]) => void;
    mockedFetchItems
      .mockReturnValueOnce(new Promise((resolve) => (resolveFirstRequest = resolve)))
      .mockResolvedValueOnce([buildItem({ id: "new", name: "New Item" })]);
    const firstCharacter = buildCharacter({
      id: "first",
      inventory: { size: 50, items: [{ slotIndex: 0, itemId: "1", quantity: 1 }] }
    });
    const secondCharacter = buildCharacter({
      id: "second",
      inventory: { size: 50, items: [{ slotIndex: 0, itemId: "2", quantity: 1 }] }
    });
    const initialProps = options(firstCharacter);
    const { result, rerender } = renderHook(
      ({ selectedCharacter }) => useCharacterItems({ ...initialProps, selectedCharacter }),
      { initialProps: { selectedCharacter: firstCharacter } }
    );

    rerender({ selectedCharacter: secondCharacter });
    await waitFor(() => expect(result.current.itemsById.new?.name).toBe("New Item"));

    await act(async () => resolveFirstRequest([buildItem({ id: "old", name: "Stale Item" })]));
    expect(result.current.itemsById).toEqual({ new: expect.objectContaining({ name: "New Item" }) });
  });

  it("requires authentication before mutating inventory", async () => {
    const hookOptions = options();
    const { result } = renderHook(() => useCharacterItems(hookOptions));

    await act(async () => {
      await result.current.handleEquipInventorySlot(0, 0);
      await result.current.handleEquipConsumableItem("hp", 0);
      await result.current.handleMoveInventoryItem(0, 1);
      await result.current.handleSortInventory("name");
      await result.current.handleUnequipEquipmentSlot("helmet", 0);
    });

    expect(hookOptions.onAuthenticationRequired).toHaveBeenCalledTimes(5);
    expect(hookOptions.updateCharacter).not.toHaveBeenCalled();
  });

  it("updates the active equipment set after equipping and exposes mutation errors", async () => {
    localStorage.setItem("flyffIdleToken", "token");
    const hookOptions = options();
    const equippedCharacter = buildCharacter({
      equipmentSets: [{ ...emptyEquipment }, { ...emptyEquipment }, { ...emptyEquipment, helmet: "100" }]
    });
    mockedEquipInventoryItem.mockResolvedValue(equippedCharacter);
    const { result } = renderHook(() => useCharacterItems(hookOptions));

    await act(async () => result.current.handleEquipInventorySlot(0, 2));
    expect(hookOptions.updateCharacter).toHaveBeenCalledWith(equippedCharacter);
    expect(result.current.activeEquipmentSet).toBe(2);
    expect(result.current.isItemActionPending).toBe(false);

    mockedMoveInventoryItem.mockRejectedValue(new Error("Destination is locked"));
    await act(async () => result.current.handleMoveInventoryItem(0, 3));
    expect(result.current.itemActionError).toBe("Destination is locked");
    expect(result.current.isItemActionPending).toBe(false);
  });

  it("clears selections when their items disappear", async () => {
    localStorage.setItem("flyffIdleToken", "token");
    mockedFetchItems.mockResolvedValue([]);
    const selectedCharacter = buildCharacter({
      equipment: { ...buildCharacter().equipment, helmet: "100" },
      inventory: { size: 50, items: [{ slotIndex: 4, itemId: "200", quantity: 1 }] }
    });
    const hookOptions = options(selectedCharacter);
    const { result, rerender } = renderHook(
      ({ character }) => useCharacterItems({ ...hookOptions, selectedCharacter: character }),
      { initialProps: { character: selectedCharacter } }
    );

    act(() => {
      result.current.handleSelectEquipmentSlot("helmet");
      result.current.handleSelectInventorySlot(4);
    });
    rerender({ character: buildCharacter({ id: selectedCharacter.id }) });

    await waitFor(() => {
      expect(result.current.selectedEquipmentSlot).toBeNull();
      expect(result.current.selectedInventorySlotIndex).toBeNull();
    });
  });
});
