import { fireEvent, render, screen } from "@testing-library/react";
import { useItemDetailsHover } from "./useItemDetailsHover";
import type { ItemMetadata } from "@/lib/api";

const item = { id: "1", name: "Test Sword" } as ItemMetadata;

function Harness() {
  const hover = useItemDetailsHover();
  return (
    <>
      <button
        onBlur={hover.hideItemDetails}
        onFocus={(event) => hover.inspectItem(item, event)}
        onMouseEnter={(event) => hover.inspectItem(item, event)}
        onMouseLeave={hover.hideItemDetails}
      >
        Inspect
      </button>
      <span>{hover.inspectedItem?.item.name ?? "Hidden"}</span>
    </>
  );
}

describe("useItemDetailsHover", () => {
  it("shows details for pointer and keyboard inspection and hides them afterwards", () => {
    render(<Harness />);
    const button = screen.getByRole("button", { name: "Inspect" });

    fireEvent.mouseEnter(button);
    expect(screen.getByText("Test Sword")).toBeInTheDocument();
    fireEvent.mouseLeave(button);
    expect(screen.getByText("Hidden")).toBeInTheDocument();
    fireEvent.focus(button);
    expect(screen.getByText("Test Sword")).toBeInTheDocument();
    fireEvent.blur(button);
    expect(screen.getByText("Hidden")).toBeInTheDocument();
  });
});
