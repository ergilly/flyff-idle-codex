import { act, renderHook } from "@testing-library/react";
import {
  addCharacterInventoryItem,
  addCharacterPenya,
  refundCharacterSkills,
  refundCharacterStats
} from "@/lib/api";
import { useAdminActions } from "@/hooks/main-application/useAdminActions";
import { buildCharacter } from "@/test/fixtures";

jest.mock("@/lib/api", () => ({
  addCharacterInventoryItem: jest.fn(),
  addCharacterPenya: jest.fn(),
  refundCharacterSkills: jest.fn(),
  refundCharacterStats: jest.fn()
}));

function options() {
  return {
    handleResetSkills: jest.fn(),
    handleSelectInventorySlot: jest.fn(),
    onAuthenticationRequired: jest.fn(),
    resetProgressionForms: jest.fn(),
    selectedCharacter: buildCharacter({
      inventory: { size: 50, items: [{ slotIndex: 0, itemId: "100", quantity: 1 }] }
    }),
    updateCharacter: jest.fn()
  };
}

describe("useAdminActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("requires a session before any privileged mutation", async () => {
    const hookOptions = options();
    const { result } = renderHook(() => useAdminActions(hookOptions));

    await act(async () => {
      await result.current.handleRefundStats();
      await result.current.handleRefundSkills();
      await result.current.handleAddInventoryItem("200", 1);
      await result.current.handleAddPenya(1_000);
    });

    expect(hookOptions.onAuthenticationRequired).toHaveBeenCalledTimes(4);
    expect(hookOptions.updateCharacter).not.toHaveBeenCalled();
  });

  it("resets the appropriate forms after successful refunds", async () => {
    localStorage.setItem("flyffIdleToken", "token");
    const hookOptions = options();
    const updatedCharacter = buildCharacter();
    (refundCharacterStats as jest.MockedFunction<typeof refundCharacterStats>).mockResolvedValue(
      updatedCharacter
    );
    (refundCharacterSkills as jest.MockedFunction<typeof refundCharacterSkills>).mockResolvedValue(
      updatedCharacter
    );
    const { result } = renderHook(() => useAdminActions(hookOptions));

    await act(async () => result.current.handleRefundStats());
    expect(hookOptions.resetProgressionForms).toHaveBeenCalledTimes(1);
    expect(result.current.refundingAdminAction).toBeNull();

    await act(async () => result.current.handleRefundSkills());
    expect(hookOptions.handleResetSkills).toHaveBeenCalledTimes(1);
    expect(hookOptions.updateCharacter).toHaveBeenCalledTimes(2);
  });

  it("selects the changed stack or new slot after adding an item", async () => {
    localStorage.setItem("flyffIdleToken", "token");
    const hookOptions = options();
    (addCharacterInventoryItem as jest.MockedFunction<typeof addCharacterInventoryItem>).mockResolvedValue(
      buildCharacter({
        inventory: {
          size: 50,
          items: [
            { slotIndex: 0, itemId: "100", quantity: 1 },
            { slotIndex: 4, itemId: "200", quantity: 2 }
          ]
        }
      })
    );
    const { result } = renderHook(() => useAdminActions(hookOptions));

    await act(async () => result.current.handleAddInventoryItem("200", 2));

    expect(hookOptions.handleSelectInventorySlot).toHaveBeenCalledWith(4);
    expect(result.current.isAddingInventoryItem).toBe(false);
  });

  it("adds Penya and updates the current character", async () => {
    localStorage.setItem("flyffIdleToken", "token");
    const hookOptions = options();
    const updatedCharacter = buildCharacter({ penya: 5_000 });
    (addCharacterPenya as jest.MockedFunction<typeof addCharacterPenya>).mockResolvedValue(updatedCharacter);
    const { result } = renderHook(() => useAdminActions(hookOptions));

    await act(async () => result.current.handleAddPenya(2_500));

    expect(addCharacterPenya).toHaveBeenCalledWith("token", updatedCharacter.id, 2_500);
    expect(hookOptions.updateCharacter).toHaveBeenCalledWith(updatedCharacter);
    expect(result.current.isAddingPenya).toBe(false);
  });

  it("surfaces server errors and always clears pending state", async () => {
    localStorage.setItem("flyffIdleToken", "token");
    const hookOptions = options();
    (refundCharacterStats as jest.MockedFunction<typeof refundCharacterStats>).mockRejectedValue(
      new Error("Admin access is required")
    );
    const { result } = renderHook(() => useAdminActions(hookOptions));

    await act(async () => result.current.handleRefundStats());

    expect(result.current.adminError).toBe("Admin access is required");
    expect(result.current.refundingAdminAction).toBeNull();
    expect(hookOptions.updateCharacter).not.toHaveBeenCalled();
  });
});
