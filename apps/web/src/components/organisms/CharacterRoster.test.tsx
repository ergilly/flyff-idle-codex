import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CharacterRoster } from "./CharacterRoster";
import { fetchCharacters } from "@/lib/api";

const push = jest.fn();
const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace })
}));

jest.mock("@/lib/api", () => ({
  fetchCharacters: jest.fn()
}));

describe("CharacterRoster", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("redirects to login when no token exists", () => {
    render(<CharacterRoster />);

    expect(replace).toHaveBeenCalledWith("/");
  });

  it("renders loaded characters and navigates from empty slots", async () => {
    localStorage.setItem("flyffIdleToken", "token");
    (fetchCharacters as jest.Mock).mockResolvedValue([
      {
        id: "char-1",
        slotIndex: 0,
        name: "Saint Morning",
        job: "Mercenary",
        level: 15,
        exp: 0,
        penya: 0,
        stats: { str: 15, sta: 15, dex: 15, int: 15 },
        equipment: {},
        inventory: { size: 50, items: [] }
      }
    ]);

    render(<CharacterRoster />);

    expect(await screen.findByText("Saint Morning")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Create character in slot 2" }));

    expect(push).toHaveBeenCalledWith("/characters/create?slot=2");
  });

  it("shows load errors and clears storage on logout", async () => {
    localStorage.setItem("flyffIdleToken", "token");
    localStorage.setItem("flyffIdleUser", "{}");
    (fetchCharacters as jest.Mock).mockRejectedValue(new Error("nope"));

    render(<CharacterRoster />);

    expect(await screen.findByText("Your session could not load any characters.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(localStorage.getItem("flyffIdleToken")).toBeNull();
    expect(localStorage.getItem("flyffIdleUser")).toBeNull();
  });
});
