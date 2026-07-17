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
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@flyff-idle.local" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
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

  it("shows demo credentials as placeholders while keeping login fields empty", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("Email")).toHaveValue("");
    expect(screen.getByLabelText("Email")).toHaveAttribute("placeholder", "test@flyff-idle.local");
    expect(screen.getByLabelText("Password")).toHaveValue("");
    expect(screen.getByLabelText("Password")).toHaveAttribute("placeholder", "password123");

    fireEvent.click(screen.getByRole("button", { name: "Register" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@flyff-idle.local" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "new-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(screen.getByLabelText("Email")).toHaveValue("");
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  it("shows tailored errors from failed auth requests", async () => {
    (login as jest.Mock).mockRejectedValue(new Error("That password does not match this player account."));
    (register as jest.Mock).mockRejectedValue(new Error("Email already registered"));

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@flyff-idle.local" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("That password does not match this player account.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Register" }));
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "New Pilot" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@flyff-idle.local" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Create profile" }));

    expect(await screen.findByText("Email already registered")).toBeInTheDocument();
  });

  describe("login validation", () => {
    it.each([
      ["", "password123", "Please enter your email address"],
      ["invalid-email", "password123", "Please enter a valid email address"],
      ["test@flyff-idle.local", "", "Please enter your password"],
      ["test@flyff-idle.local", "short", "Password must be at least 8 characters"]
    ])("shows %s/%s validation errors", async (email, password, message) => {
      render(<LoginForm />);

      fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
      fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
      fireEvent.click(screen.getByRole("button", { name: "Log in" }));

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(login).not.toHaveBeenCalled();
    });
  });

  describe("register validation", () => {
    it.each([
      ["", "new@flyff-idle.local", "password123", "Please enter your display name"],
      ["A", "new@flyff-idle.local", "password123", "Display name must be at least 2 characters"],
      [
        "A display name that is definitely too long",
        "new@flyff-idle.local",
        "password123",
        "Display name must be 32 characters or fewer"
      ],
      ["New Pilot", "", "password123", "Please enter your email address"],
      ["New Pilot", "invalid-email", "password123", "Please enter a valid email address"],
      ["New Pilot", "new@flyff-idle.local", "", "Please enter your password"],
      ["New Pilot", "new@flyff-idle.local", "short", "Password must be at least 8 characters"]
    ])("shows register validation error: %s", async (displayName, email, password, message) => {
      render(<LoginForm />);

      fireEvent.click(screen.getByRole("button", { name: "Register" }));
      fireEvent.change(screen.getByLabelText("Display name"), { target: { value: displayName } });
      fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
      fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
      fireEvent.click(screen.getByRole("button", { name: "Create profile" }));

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(register).not.toHaveBeenCalled();
    });
  });
});
