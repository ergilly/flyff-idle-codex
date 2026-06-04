import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CharacterRoster } from "./CharacterRoster";
import { deleteCharacter, fetchCharacters } from "@/lib/api";

const push = jest.fn();
const replace = jest.fn();
const router = { push, replace };

jest.mock("next/navigation", () => ({
  useRouter: () => router
}));

jest.mock("@/lib/api", () => ({
  deleteCharacter: jest.fn(),
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
        gender: "female",
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

  it("requires name confirmation before deleting a character", async () => {
    localStorage.setItem("flyffIdleToken", "token");
    (fetchCharacters as jest.Mock).mockResolvedValue([
      {
        id: "char-1",
        slotIndex: 0,
        name: "Saint Morning",
        gender: "female",
        job: "Mercenary",
        level: 15,
        exp: 0,
        penya: 0,
        stats: { str: 15, sta: 15, dex: 15, int: 15 },
        equipment: {},
        inventory: { size: 50, items: [] }
      }
    ]);
    (deleteCharacter as jest.Mock).mockResolvedValue(undefined);

    render(<CharacterRoster />);

    expect(await screen.findByText("Saint Morning")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete Saint Morning" }));

    expect(screen.getByRole("dialog", { name: "Delete Saint Morning" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete character" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Character name"), { target: { value: "Saint Morning" } });
    fireEvent.click(screen.getByRole("button", { name: "Delete character" }));

    await waitFor(() => expect(deleteCharacter).toHaveBeenCalledWith("token", "char-1", "Saint Morning"));
    await waitFor(() => expect(screen.queryByText("Saint Morning")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Create character in slot 1" })).toBeInTheDocument();
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
