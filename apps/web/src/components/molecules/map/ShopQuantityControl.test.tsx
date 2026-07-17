import { fireEvent, render, screen } from "@testing-library/react";
import { ShopQuantityControl } from "./ShopQuantityControl";

describe("ShopQuantityControl", () => {
  it("clamps typed and button quantities to the valid stack range", () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <ShopQuantityControl disabled={false} maximum={5} onChange={onChange} quantity={1} />
    );

    fireEvent.change(screen.getByRole("spinbutton", { name: "Purchase quantity" }), {
      target: { value: "10" }
    });
    expect(onChange).toHaveBeenLastCalledWith(5);

    rerender(<ShopQuantityControl disabled={false} maximum={5} onChange={onChange} quantity={2} />);
    fireEvent.click(screen.getByRole("button", { name: "Decrease quantity" }));
    expect(onChange).toHaveBeenLastCalledWith(1);

    fireEvent.click(screen.getByRole("button", { name: "Max" }));
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it("disables every control while a transaction is pending", () => {
    render(<ShopQuantityControl disabled maximum={5} onChange={jest.fn()} quantity={2} />);

    expect(screen.getByRole("spinbutton", { name: "Purchase quantity" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Decrease quantity" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Increase quantity" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Max" })).toBeDisabled();
  });
});
