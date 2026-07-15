import { render, screen } from "@testing-library/react";
import { Eyebrow } from "./Eyebrow";

it("renders eyebrow copy as a paragraph with forwarded attributes", () => {
  render(<Eyebrow data-testid="eyebrow">Character</Eyebrow>);
  expect(screen.getByTestId("eyebrow").tagName).toBe("P");
  expect(screen.getByTestId("eyebrow")).toHaveTextContent("Character");
});
