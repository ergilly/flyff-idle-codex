import { useEffect, useState } from "react";
import type { Bank } from "@/lib/api/types";

type BankDirection = "deposit" | "withdraw";

export function useBankState({
  onLoad,
  onTransferAllItems,
  onTransferItem,
  onTransferPenya
}: {
  onLoad: () => Promise<Bank>;
  onTransferAllItems: (direction: BankDirection) => Promise<Bank>;
  onTransferItem: (direction: BankDirection, slotIndex: number) => Promise<Bank>;
  onTransferPenya: (direction: BankDirection, amount: number | "all") => Promise<Bank>;
}) {
  const [loadBank] = useState(() => onLoad);
  const [bank, setBank] = useState<Bank | null>(null);
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [penyaAmount, setPenyaAmount] = useState(1);
  const [selectedBankSlot, setSelectedBankSlot] = useState<number | null>(null);
  const [selectedCharacterSlot, setSelectedCharacterSlot] = useState<number | null>(null);

  useEffect(() => {
    let current = true;
    setIsPending(true);
    loadBank()
      .then((loadedBank) => {
        if (current) setBank(loadedBank);
      })
      .catch((reason: unknown) => {
        if (current) setError(reason instanceof Error ? reason.message : "Unable to load bank");
      })
      .finally(() => {
        if (current) setIsPending(false);
      });
    return () => {
      current = false;
    };
  }, [loadBank]);

  async function run(action: () => Promise<Bank>) {
    setError("");
    setIsPending(true);
    try {
      setBank(await action());
      setSelectedBankSlot(null);
      setSelectedCharacterSlot(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update bank");
    } finally {
      setIsPending(false);
    }
  }

  return {
    bank,
    error,
    isPending,
    penyaAmount,
    selectedBankSlot,
    selectedCharacterSlot,
    setPenyaAmount,
    setSelectedBankSlot,
    setSelectedCharacterSlot,
    transferAllItems: (direction: BankDirection) => run(() => onTransferAllItems(direction)),
    transferItem: (direction: BankDirection, slotIndex: number) =>
      run(() => onTransferItem(direction, slotIndex)),
    transferPenya: (direction: BankDirection, amount: number | "all") =>
      run(() => onTransferPenya(direction, amount))
  };
}
