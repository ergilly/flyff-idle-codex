import { randomUUID } from "node:crypto";
import { db } from "../data/database.js";
import { characterCoreRepository } from "../data/characterCoreRepository.js";
import { addInventoryQuantity, getMaxStackSize } from "../data/characterInventoryRepository.js";
import type { Bank, Character } from "../types.js";

const defaultBankSize = 100;

type BankItemRow = Bank["items"][number];
type BankResult = { bank: Bank | null; character: Character | null; error: string | null };

function ensureBank(playerId: string, now = new Date().toISOString()) {
  db.prepare(
    `INSERT OR IGNORE INTO bank_accounts
      (player_id, penya, inventory_size, created_at, updated_at)
     VALUES (?, 0, ?, ?, ?)`
  ).run(playerId, defaultBankSize, now, now);
}

function findBank(playerId: string): Bank {
  ensureBank(playerId);
  const account = db
    .prepare("SELECT penya, inventory_size AS size FROM bank_accounts WHERE player_id = ?")
    .get(playerId) as { penya: number; size: number };
  const items = db
    .prepare(
      `SELECT slot_index AS slotIndex, item_id AS itemId, quantity
       FROM bank_inventory_items
       WHERE player_id = ?
       ORDER BY slot_index ASC`
    )
    .all(playerId) as BankItemRow[];

  return { ...account, items };
}

function getOwnedCharacter(characterId: string, playerId: string) {
  const character = characterCoreRepository.findById(characterId);
  return character?.playerId === playerId ? character : null;
}

function addBankQuantity(playerId: string, itemId: string, quantity: number, now: string) {
  const bank = findBank(playerId);
  const maxStackSize = getMaxStackSize(itemId);
  const matchingStacks = bank.items.filter((item) => item.itemId === itemId && item.quantity < maxStackSize);
  const openSlots = Array.from({ length: bank.size }, (_slot, index) => index).filter(
    (index) => !bank.items.some((item) => item.slotIndex === index)
  );
  const stackCapacity = matchingStacks.reduce((total, stack) => total + maxStackSize - stack.quantity, 0);

  if (stackCapacity + openSlots.length * maxStackSize < quantity) return false;

  let remaining = quantity;
  for (const stack of matchingStacks) {
    const added = Math.min(maxStackSize - stack.quantity, remaining);
    db.prepare(
      `UPDATE bank_inventory_items
       SET quantity = quantity + ?, updated_at = ?
       WHERE player_id = ? AND slot_index = ?`
    ).run(added, now, playerId, stack.slotIndex);
    remaining -= added;
    if (remaining === 0) return true;
  }

  const insert = db.prepare(
    `INSERT INTO bank_inventory_items
      (id, player_id, slot_index, item_id, quantity, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  for (const slotIndex of openSlots) {
    const stackQuantity = Math.min(maxStackSize, remaining);
    insert.run(randomUUID(), playerId, slotIndex, itemId, stackQuantity, now, now);
    remaining -= stackQuantity;
    if (remaining === 0) return true;
  }

  return false;
}

function result(characterId: string, playerId: string): BankResult {
  return {
    bank: findBank(playerId),
    character: characterCoreRepository.findById(characterId),
    error: null
  };
}

function runTransfer(
  characterId: string,
  playerId: string,
  operation: (character: Character, now: string) => void
): BankResult {
  try {
    db.exec("BEGIN");
    const character = getOwnedCharacter(characterId, playerId);
    if (!character) throw new Error("Character not found");
    ensureBank(playerId);
    operation(character, new Date().toISOString());
    db.exec("COMMIT");
    return result(characterId, playerId);
  } catch (error) {
    if (db.isTransaction) db.exec("ROLLBACK");
    return {
      bank: null,
      character: null,
      error: error instanceof Error ? error.message : "Unable to update bank"
    };
  }
}

export const bankRepository = {
  findForCharacter(playerId: string, characterId: string) {
    const character = getOwnedCharacter(characterId, playerId);
    return character ? { bank: findBank(playerId), character } : null;
  },

  transferItem(characterId: string, playerId: string, direction: "deposit" | "withdraw", slotIndex: number) {
    return runTransfer(characterId, playerId, (character, now) => {
      if (direction === "deposit") {
        const item = character.inventory.items.find((candidate) => candidate.slotIndex === slotIndex);
        if (!item) throw new Error("Character inventory item not found");
        if (!addBankQuantity(playerId, item.itemId, item.quantity, now)) {
          throw new Error("Not enough bank space");
        }
        db.prepare("DELETE FROM character_inventory_items WHERE character_id = ? AND slot_index = ?").run(
          characterId,
          slotIndex
        );
        return;
      }

      const item = findBank(playerId).items.find((candidate) => candidate.slotIndex === slotIndex);
      if (!item) throw new Error("Bank item not found");
      if (
        !addInventoryQuantity(characterId, character, item.itemId, item.quantity, now, {
          stackIntoEquippedConsumables: false
        })
      ) {
        throw new Error("Not enough character inventory space");
      }
      db.prepare("DELETE FROM bank_inventory_items WHERE player_id = ? AND slot_index = ?").run(
        playerId,
        slotIndex
      );
    });
  },

  transferAllItems(characterId: string, playerId: string, direction: "deposit" | "withdraw") {
    return runTransfer(characterId, playerId, (character, now) => {
      if (direction === "deposit") {
        for (const item of character.inventory.items) {
          if (!addBankQuantity(playerId, item.itemId, item.quantity, now)) {
            throw new Error("Not enough bank space");
          }
        }
        db.prepare("DELETE FROM character_inventory_items WHERE character_id = ?").run(characterId);
        return;
      }

      for (const item of findBank(playerId).items) {
        const currentCharacter = characterCoreRepository.findById(characterId);
        if (
          !currentCharacter ||
          !addInventoryQuantity(characterId, currentCharacter, item.itemId, item.quantity, now, {
            stackIntoEquippedConsumables: false
          })
        ) {
          throw new Error("Not enough character inventory space");
        }
      }
      db.prepare("DELETE FROM bank_inventory_items WHERE player_id = ?").run(playerId);
    });
  },

  transferPenya(
    characterId: string,
    playerId: string,
    direction: "deposit" | "withdraw",
    requestedAmount: number | "all"
  ) {
    return runTransfer(characterId, playerId, (character, now) => {
      const bank = findBank(playerId);
      const available = direction === "deposit" ? character.penya : bank.penya;
      const amount = requestedAmount === "all" ? available : requestedAmount;
      if (amount < 1) throw new Error(`No Penya available to ${direction}`);
      if (amount > available) throw new Error("Not enough Penya");

      const characterDelta = direction === "deposit" ? -amount : amount;
      const bankDelta = -characterDelta;
      db.prepare(
        "UPDATE characters SET penya = penya + ?, updated_at = ? WHERE id = ? AND player_id = ?"
      ).run(characterDelta, now, characterId, playerId);
      db.prepare("UPDATE bank_accounts SET penya = penya + ?, updated_at = ? WHERE player_id = ?").run(
        bankDelta,
        now,
        playerId
      );
    });
  }
};
