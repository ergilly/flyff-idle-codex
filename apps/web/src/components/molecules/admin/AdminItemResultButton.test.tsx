import { fireEvent, render, screen } from "@testing-library/react";
import { AdminItemResultButton } from "./AdminItemResultButton";
import { buildItem } from "@/test/fixtures";

describe("AdminItemResultButton", () => {
  it("supports pointer and keyboard item inspection", () => {
    const onHideDetails = jest.fn();
    const onInspect = jest.fn();
    render(
      <AdminItemResultButton
        isSelected={false}
        item={buildItem({ id: "40", name: "Dragon Cloak" })}
        onClick={jest.fn()}
        onHideDetails={onHideDetails}
        onInspect={onInspect}
      />
    );
    const button = screen.getByRole("button", { name: /Dragon Cloak/ });
    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);
    fireEvent.focus(button);
    fireEvent.blur(button);
    expect(onInspect).toHaveBeenCalledTimes(2);
    expect(onHideDetails).toHaveBeenCalledTimes(2);
  });
});
