import { render, screen } from "@testing-library/react";
import { Panel } from "./Panel";

it.each(["article", "section", "aside"] as const)("renders as a %s", (as) => {
  render(
    <Panel as={as} data-testid="panel">
      Content
    </Panel>
  );
  expect(screen.getByTestId("panel").tagName).toBe(as.toUpperCase());
});
