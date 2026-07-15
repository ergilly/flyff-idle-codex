import { render, screen } from "@testing-library/react";
import { ContentHeading, PointsSummary } from "./ContentHeading";

describe("ContentHeading", () => {
  it("renders the active section and points summary", () => {
    render(
      <>
        <ContentHeading activeNavItem="Inventory" />
        <PointsSummary>
          <span>Available</span>
          <strong>3</strong>
        </PointsSummary>
      </>
    );

    expect(screen.getByText("Inventory")).toBeInTheDocument();
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
