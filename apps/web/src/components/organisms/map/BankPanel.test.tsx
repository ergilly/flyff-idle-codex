import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { BankPanel } from "@/components/organisms/map/BankPanel";
import type { Bank, ItemMetadata } from "@/lib/api/types";

const item = (id: string, name: string): ItemMetadata => ({
  abilities: [],
  attackSpeed: null,
  category: "recovery",
  description: null,
  icon: `${id}.png`,
  id,
  level: 1,
  maxAttack: null,
  maxDefense: null,
  minAttack: null,
  minDefense: null,
  name,
  rarity: "common",
  requiredJob: null,
  sellPrice: 1,
  sex: null,
  subcategory: "food",
  twoHanded: null
});

const bank: Bank = {
  size: 100,
  penya: 500,
  items: [{ slotIndex: 0, itemId: "2", quantity: 3 }]
};

describe("BankPanel", () => {
  const onLoad = jest.fn<Promise<Bank>, []>();
  const onTransferAllItems = jest.fn<Promise<Bank>, ["deposit" | "withdraw"]>();
  const onTransferItem = jest.fn<Promise<Bank>, ["deposit" | "withdraw", number]>();
  const onTransferPenya = jest.fn<Promise<Bank>, ["deposit" | "withdraw", number | "all"]>();

  beforeEach(() => {
    jest.clearAllMocks();
    onLoad.mockResolvedValue(bank);
    onTransferAllItems.mockResolvedValue(bank);
    onTransferItem.mockResolvedValue(bank);
    onTransferPenya.mockResolvedValue(bank);
  });

  function renderBank() {
    return render(
      <BankPanel
        characterInventory={{ size: 2, items: [{ slotIndex: 1, itemId: "1", quantity: 2 }] }}
        characterPenya={1000}
        itemsById={{ "1": item("1", "Character Food"), "2": item("2", "Bank Food") }}
        onLoad={onLoad}
        onTransferAllItems={onTransferAllItems}
        onTransferItem={onTransferItem}
        onTransferPenya={onTransferPenya}
      />
    );
  }

  it("renders Penya beside each inventory without a slot count", async () => {
    renderBank();
    expect(await screen.findByTestId("map_section_bank")).toBeInTheDocument();
    expect(screen.queryByText(/slots/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("Penya")).toHaveLength(3);
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("1,000")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bank Food, quantity 3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Character Food, quantity 2" })).toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByRole("button", { name: "Bank Food, quantity 3" }));
    expect(screen.getByTestId("shop_item_details_overlay")).toBeInTheDocument();
    expect(screen.queryByText("Shop price")).not.toBeInTheDocument();
  });

  it("uses icon-only item controls with full-word tooltips", async () => {
    renderBank();
    fireEvent.click(await screen.findByRole("button", { name: "Bank Food, quantity 3" }));
    expect(
      within(screen.getByRole("group", { name: "Item transfer controls" }))
        .getAllByRole("button")
        .map((button) => button.getAttribute("aria-label"))
    ).toEqual(["Withdraw All", "Withdraw", "Deposit", "Deposit All"]);
    expect(screen.getByText("Items")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Withdraw" })).toHaveAttribute("title", "Withdraw");
    expect(screen.getByRole("button", { name: "Withdraw" })).toHaveClass("items-center", "justify-center");
    expect(screen.getByRole("button", { name: "Withdraw" }).querySelectorAll("svg")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
    await waitFor(() => expect(onTransferItem).toHaveBeenCalledWith("withdraw", 0));

    fireEvent.click(screen.getByRole("button", { name: "Character Food, quantity 2" }));
    expect(screen.getByRole("button", { name: "Deposit" }).querySelectorAll("svg")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Deposit" }));
    await waitFor(() => expect(onTransferItem).toHaveBeenCalledWith("deposit", 1));

    expect(screen.getByRole("button", { name: "Withdraw All" }).querySelectorAll("svg")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Deposit All" }).querySelectorAll("svg")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Withdraw All" }).querySelector("svg")).toHaveAttribute(
      "stroke-width",
      "3"
    );
    expect(screen.getByRole("button", { name: "Deposit All" }).querySelector("svg")).toHaveAttribute(
      "stroke-width",
      "3"
    );
    fireEvent.click(screen.getByRole("button", { name: "Withdraw All" }));
    await waitFor(() => expect(onTransferAllItems).toHaveBeenCalledWith("withdraw"));
  });

  it("places Penya amount controls between the inventories", async () => {
    renderBank();
    await screen.findByTestId("map_section_bank");
    fireEvent.change(screen.getByRole("spinbutton", { name: "Penya amount" }), {
      target: { value: "125" }
    });
    expect(screen.getByRole("spinbutton", { name: "Penya amount" })).toHaveClass("h-11");
    expect(screen.getByRole("group", { name: "Penya transfer controls" })).toHaveClass(
      "grid-cols-[128px_40px_40px]"
    );
    expect(screen.getByRole("button", { name: "Deposit Penya" }).querySelector("svg")).toHaveClass(
      "lucide-chevron-up"
    );
    expect(screen.getByRole("button", { name: "Withdraw Penya" }).querySelector("svg")).toHaveClass(
      "lucide-chevron-down"
    );
    fireEvent.click(screen.getByRole("button", { name: "Deposit Penya" }));
    await waitFor(() => expect(onTransferPenya).toHaveBeenCalledWith("deposit", 125));
    fireEvent.click(screen.getByRole("button", { name: "Withdraw Penya" }));
    await waitFor(() => expect(onTransferPenya).toHaveBeenCalledWith("withdraw", 125));
  });
});
