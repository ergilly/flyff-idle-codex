import { fetchBank, transferAllBankItems, transferBankItem, transferBankPenya } from "@/lib/api/bank";

const update = {
  bank: { size: 100, penya: 50, items: [] },
  character: { id: "character-1" }
};

describe("bank API", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(update)
    });
  });

  it("loads the authenticated character's shared bank", async () => {
    await expect(fetchBank("token", "character-1")).resolves.toEqual(update);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/characters/character-1/bank"),
      expect.objectContaining({ method: "GET", headers: { Authorization: "Bearer token" } })
    );
  });

  it("sends item, all-item, and Penya transfers", async () => {
    await transferBankItem("token", "character-1", "deposit", 4);
    await transferAllBankItems("token", "character-1", "withdraw");
    await transferBankPenya("token", "character-1", "deposit", "all");

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/bank/items"),
      expect.objectContaining({ body: JSON.stringify({ direction: "deposit", slotIndex: 4 }) })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/bank/items/all"),
      expect.objectContaining({ body: JSON.stringify({ direction: "withdraw" }) })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("/bank/penya"),
      expect.objectContaining({ body: JSON.stringify({ direction: "deposit", amount: "all" }) })
    );
  });

  it("surfaces API errors", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: "Not enough bank space" })
    });
    await expect(transferBankItem("token", "character-1", "deposit", 0)).rejects.toThrow(
      "Not enough bank space"
    );
  });
});
