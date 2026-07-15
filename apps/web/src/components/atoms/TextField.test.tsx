import { fireEvent, render, screen } from "@testing-library/react";
import { TextField } from "./TextField";

it("associates its label and forwards input behavior", () => {
  const onChange = jest.fn();
  render(<TextField data-testid="name" id="name" label="Name" onChange={onChange} />);
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Hero" } });
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId("name_field")).toContainElement(screen.getByTestId("name"));
});
