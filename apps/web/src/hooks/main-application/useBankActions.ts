import {
  fetchBank,
  transferAllBankItems,
  transferBankItem,
  transferBankPenya,
  type Character
} from "@/lib/api";

type BankDirection = "deposit" | "withdraw";

export function useBankActions({
  onAuthenticationRequired,
  selectedCharacter,
  updateCharacter
}: {
  onAuthenticationRequired: () => void;
  selectedCharacter: Character | null;
  updateCharacter: (character: Character) => void;
}) {
  function getCredentials() {
    const token = localStorage.getItem("flyffIdleToken");
    if (!token || !selectedCharacter) {
      onAuthenticationRequired();
      throw new Error("Authentication is required");
    }
    return { character: selectedCharacter, token };
  }

  async function applyUpdate(request: ReturnType<typeof transferBankItem>) {
    const update = await request;
    updateCharacter(update.character);
    return update.bank;
  }

  async function handleLoadBank() {
    const { character, token } = getCredentials();
    return (await fetchBank(token, character.id)).bank;
  }

  function handleTransferBankItem(direction: BankDirection, slotIndex: number) {
    const { character, token } = getCredentials();
    return applyUpdate(transferBankItem(token, character.id, direction, slotIndex));
  }

  function handleTransferAllBankItems(direction: BankDirection) {
    const { character, token } = getCredentials();
    return applyUpdate(transferAllBankItems(token, character.id, direction));
  }

  function handleTransferBankPenya(direction: BankDirection, amount: number | "all") {
    const { character, token } = getCredentials();
    return applyUpdate(transferBankPenya(token, character.id, direction, amount));
  }

  return {
    handleLoadBank,
    handleTransferAllBankItems,
    handleTransferBankItem,
    handleTransferBankPenya
  };
}
