import { render, screen } from "@testing-library/react";
import { ErrorMessage } from "./ErrorMessage";

describe("ErrorMessage", () => {
  it("renders a plain error message as an alert", () => {
    render(<ErrorMessage message="Please enter your email address" testId="login_error_auth" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByTestId("login_error_auth_text")).toHaveTextContent("Please enter your email address");
  });

  it("renders detail rows from multiline messages", () => {
    render(<ErrorMessage message={"Missing requirements:\nLevel: 75\nJob: Mercenary"} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Missing requirements:")).toBeInTheDocument();
    expect(screen.getByText("Level")).toBeInTheDocument();
    expect(screen.getByText("75")).toBeInTheDocument();
    expect(screen.getByText("Job")).toBeInTheDocument();
    expect(screen.getByText("Mercenary")).toBeInTheDocument();
  });
});
