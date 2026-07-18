import { act, renderHook } from "@testing-library/react";
import { fetchBank, transferAllBankItems, transferBankItem, transferBankPenya } from "@/lib/api";
import { useBankActions } from "@/hooks/main-application/useBankActions";
import { buildCharacter } from "@/test/fixtures";

jest.mock("@/lib/api", () => ({
  fetchBank: jest.fn(),
  transferAllBankItems: jest.fn(),
  transferBankItem: jest.fn(),
  transferBankPenya: jest.fn()
}));

describe("useBankActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("loads and updates the shared bank for the selected character", async () => {
    const character = buildCharacter();
    const updatedCharacter = buildCharacter({ penya: 75 });
    const bank = { size: 100, penya: 25, items: [] };
    const updateCharacter = jest.fn();
    jest.mocked(fetchBank).mockResolvedValue({ bank, character });
    jest.mocked(transferBankItem).mockResolvedValue({ bank, character: updatedCharacter });
    localStorage.setItem("flyffIdleToken", "token");
    const { result } = renderHook(() =>
      useBankActions({
        onAuthenticationRequired: jest.fn(),
        selectedCharacter: character,
        updateCharacter
      })
    );

    await expect(result.current.handleLoadBank()).resolves.toEqual(bank);
    await act(async () => {
      await result.current.handleTransferBankItem("withdraw", 3);
    });

    expect(fetchBank).toHaveBeenCalledWith("token", character.id);
    expect(transferBankItem).toHaveBeenCalledWith("token", character.id, "withdraw", 3);
    expect(updateCharacter).toHaveBeenCalledWith(updatedCharacter);
  });

  it("supports all-item and Penya transfers", async () => {
    const character = buildCharacter();
    const bank = { size: 100, penya: 0, items: [] };
    jest.mocked(transferAllBankItems).mockResolvedValue({ bank, character });
    jest.mocked(transferBankPenya).mockResolvedValue({ bank, character });
    localStorage.setItem("flyffIdleToken", "token");
    const { result } = renderHook(() =>
      useBankActions({
        onAuthenticationRequired: jest.fn(),
        selectedCharacter: character,
        updateCharacter: jest.fn()
      })
    );

    await act(async () => {
      await result.current.handleTransferAllBankItems("deposit");
      await result.current.handleTransferBankPenya("withdraw", "all");
    });
    expect(transferAllBankItems).toHaveBeenCalledWith("token", character.id, "deposit");
    expect(transferBankPenya).toHaveBeenCalledWith("token", character.id, "withdraw", "all");
  });

  it("requires authentication and a selected character", () => {
    const onAuthenticationRequired = jest.fn();
    const { result } = renderHook(() =>
      useBankActions({
        onAuthenticationRequired,
        selectedCharacter: null,
        updateCharacter: jest.fn()
      })
    );

    expect(() => result.current.handleTransferAllBankItems("deposit")).toThrow("Authentication is required");
    expect(onAuthenticationRequired).toHaveBeenCalled();
  });
});
