import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LoginForm } from "./LoginForm";
import { login, register } from "@/lib/api";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push })
}));

jest.mock("@/lib/api", () => ({
  login: jest.fn(),
  register: jest.fn()
}));

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("logs in, stores the session, and navigates to characters", async () => {
    (login as jest.Mock).mockResolvedValue({
      token: "token",
      user: { id: "user-1", email: "test@flyff-idle.local", displayName: "Pilot" }
    });

    render(<LoginForm />);
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/characters"));
    expect(login).toHaveBeenCalledWith("test@flyff-idle.local", "password123");
    expect(localStorage.getItem("flyffIdleToken")).toBe("token");
  });

  it("registers a new profile from register mode", async () => {
    (register as jest.Mock).mockResolvedValue({
      token: "new-token",
      user: { id: "user-2", email: "new@flyff-idle.local", displayName: "New Pilot" }
    });

    render(<LoginForm />);
    fireEvent.click(screen.getByRole("button", { name: "Register" }));
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "New Pilot" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@flyff-idle.local" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Create profile" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/characters"));
    expect(register).toHaveBeenCalledWith("New Pilot", "new@flyff-idle.local", "password123");
  });

  it("resets demo credentials when switching back to login mode", () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: "Register" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@flyff-idle.local" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "new-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(screen.getByLabelText("Email")).toHaveValue("test@flyff-idle.local");
    expect(screen.getByLabelText("Password")).toHaveValue("password123");
  });

  it("shows mode-specific errors", async () => {
    (login as jest.Mock).mockRejectedValue(new Error("nope"));
    (register as jest.Mock).mockRejectedValue(new Error("nope"));

    render(<LoginForm />);
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByText("Those login details did not match a player account.")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Register" }));
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "New Pilot" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@flyff-idle.local" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Create profile" }));

    expect(
      await screen.findByText("That profile could not be created. Try a different email.")
    ).toBeInTheDocument();
  });
});
