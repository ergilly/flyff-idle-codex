import { fireEvent, render, screen } from "@testing-library/react";
import { ShopFilterCheckbox } from "@/components/atoms/map/ShopFilterCheckbox";

describe("ShopFilterCheckbox", () => {
  it("reports checked changes", () => {
    const onChange = jest.fn();
    render(<ShopFilterCheckbox checked={false} disabled={false} label="By level" onChange={onChange} />);

    fireEvent.click(screen.getByRole("checkbox", { name: "By level" }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("can be disabled", () => {
    render(<ShopFilterCheckbox checked={false} disabled label="By sex" onChange={jest.fn()} />);
    expect(screen.getByRole("checkbox", { name: "By sex" })).toBeDisabled();
  });
});
