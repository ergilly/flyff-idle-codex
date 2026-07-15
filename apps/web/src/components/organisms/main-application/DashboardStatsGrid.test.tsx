import { render, screen } from "@testing-library/react";
import { DashboardStatsGrid } from "./DashboardStatsGrid";
import { buildCharacter } from "@/test/fixtures";

describe("DashboardStatsGrid", () => {
  it("renders the four core character stats", () => {
    render(
      <DashboardStatsGrid character={buildCharacter({ stats: { str: 20, sta: 18, dex: 17, int: 16 } })} />
    );
    expect(screen.getByTestId("dashboard_strong_stat_value_str")).toHaveTextContent("20");
    expect(screen.getByTestId("dashboard_strong_stat_value_int")).toHaveTextContent("16");
  });
});
