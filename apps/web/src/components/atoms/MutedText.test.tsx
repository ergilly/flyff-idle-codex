import { render, screen } from "@testing-library/react";
import { MutedText } from "./MutedText";

it("renders a paragraph and forwards paragraph attributes", () => {
  render(
    <MutedText className="extra" data-testid="muted">
      Quiet detail
    </MutedText>
  );
  expect(screen.getByTestId("muted").tagName).toBe("P");
  expect(screen.getByTestId("muted")).toHaveClass("text-text-muted", "extra");
});
