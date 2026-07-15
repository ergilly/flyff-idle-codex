import { render, screen } from "@testing-library/react";
import { Actions } from "./Actions";

it("renders actions with forwarded attributes and an overridable gap", () => {
  render(
    <Actions data-testid="actions" gap="4px" style={{ color: "red" }}>
      Save
    </Actions>
  );
  expect(screen.getByTestId("actions")).toHaveTextContent("Save");
  expect(screen.getByTestId("actions")).toHaveStyle({ gap: "4px", color: "red" });
});
