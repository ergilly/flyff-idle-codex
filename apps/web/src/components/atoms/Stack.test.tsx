import { render, screen } from "@testing-library/react";
import { Stack } from "./Stack";

it.each(["div", "form", "section"] as const)("renders the %s variant with its gap", (as) => {
  render(
    <Stack as={as} data-testid="stack" gap="7px">
      Content
    </Stack>
  );
  expect(screen.getByTestId("stack").tagName).toBe(as.toUpperCase());
  expect(screen.getByTestId("stack")).toHaveStyle({ gap: "7px" });
});
