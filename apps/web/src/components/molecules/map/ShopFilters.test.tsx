import { fireEvent, render, screen } from "@testing-library/react";
import { ShopFilters } from "./ShopFilters";

describe("ShopFilters", () => {
  it("enables available requirements and reports each filter change", () => {
    const onChange = jest.fn();
    render(
      <ShopFilters
        characterJob="Slayer"
        characterLevel={130}
        characterSex="male"
        filterByClass={false}
        filterByLevel={false}
        filterBySex={false}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "By class" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "By sex" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "By level" }));
    expect(onChange.mock.calls).toEqual([
      ["class", true],
      ["sex", true],
      ["level", true]
    ]);
  });

  it("disables filters whose character requirement is unavailable", () => {
    render(
      <ShopFilters filterByClass={false} filterByLevel={false} filterBySex={false} onChange={jest.fn()} />
    );

    expect(screen.getByRole("checkbox", { name: "By class" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "By sex" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "By level" })).toBeDisabled();
  });
});
