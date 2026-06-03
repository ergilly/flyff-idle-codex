import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CharacterCreationPage } from "./CharacterCreationPage";
import { createCharacter } from "@/lib/api";

const push = jest.fn();
const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace })
}));

jest.mock("@/lib/api", () => ({
  createCharacter: jest.fn()
}));

describe("CharacterCreationPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("defaults invalid slots to slot 1 and validates short names", () => {
    render(<CharacterCreationPage slot="99" />);

    expect(screen.getByRole("heading", { name: "Slot 1" })).toBeInTheDocument();
    expect(screen.getByLabelText("Male")).toBeChecked();
    fireEvent.change(screen.getByLabelText("Character name"), { target: { value: "No" } });
    fireEvent.submit(screen.getByRole("button", { name: "Create character" }).closest("form")!);

    expect(screen.getByText("Character name must be at least 3 characters.")).toBeInTheDocument();
  });

  it("redirects unauthenticated users to login", () => {
    render(<CharacterCreationPage slot="3" />);

    fireEvent.change(screen.getByLabelText("Character name"), { target: { value: "ValidName" } });
    fireEvent.submit(screen.getByRole("button", { name: "Create character" }).closest("form")!);

    expect(replace).toHaveBeenCalledWith("/");
  });

  it("creates a character in the requested slot and returns to the roster", async () => {
    localStorage.setItem("flyffIdleToken", "token");
    (createCharacter as jest.Mock).mockResolvedValue({ id: "char-1" });

    render(<CharacterCreationPage slot="4" />);
    fireEvent.change(screen.getByLabelText("Character name"), { target: { value: "ValidName" } });
    fireEvent.click(screen.getByLabelText("Female"));
    fireEvent.click(screen.getByRole("button", { name: "Create character" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/characters"));
    expect(createCharacter).toHaveBeenCalledWith("token", 3, "ValidName", "female");
  });

  it("shows API errors and can cancel back to the roster", async () => {
    localStorage.setItem("flyffIdleToken", "token");
    (createCharacter as jest.Mock).mockRejectedValue(new Error("That character slot is already occupied"));

    render(<CharacterCreationPage slot="2" />);
    fireEvent.change(screen.getByLabelText("Character name"), { target: { value: "TakenName" } });
    fireEvent.click(screen.getByRole("button", { name: "Create character" }));

    expect(await screen.findByText("That character slot is already occupied")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(push).toHaveBeenCalledWith("/characters");
  });
});
