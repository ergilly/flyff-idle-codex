import { fireEvent, render, screen } from "@testing-library/react";
import { MapPage } from "./MapPage";

describe("MapPage", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      const requestUrl = new URL(url);
      const monsterName = requestUrl.searchParams.get("name") ?? "Aibatt";

      if (requestUrl.pathname.endsWith("/api/data/items")) {
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            dataSet: "items",
            total: 1,
            limit: 500,
            offset: 0,
            results: [{ id: 100, name: "Twinkle Stone", icon: "twinkle.png", category: "quest" }]
          })
        });
      }

      if (requestUrl.searchParams.has("minLevel")) {
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            dataSet: "monsters",
            total: 4,
            limit: 500,
            offset: 0,
            results: [
              {
                id: 1,
                name: "Small Aibatt",
                event: false,
                level: 1,
                rank: "small",
                element: "wind",
                drops: [{ item: 100 }]
              },
              {
                id: 2,
                name: "Aibatt",
                event: false,
                level: 1,
                rank: "normal",
                element: "wind",
                drops: [{ item: 100 }]
              },
              {
                id: 3,
                name: "Captain Aibatt",
                event: false,
                level: 2,
                rank: "captain",
                element: "wind",
                drops: [{ item: 100 }]
              },
              {
                id: 4,
                name: "Giant Aibatt",
                event: false,
                level: 5,
                rank: "giant",
                element: "fire",
                drops: [{ item: 100 }]
              }
            ]
          })
        });
      }

      return Promise.resolve({
        ok: true,
        json: jest.fn().mockResolvedValue({
          dataSet: "monsters",
          total: 1,
          limit: 1,
          offset: 0,
          results: [
            {
              id: 1,
              name: monsterName,
              event: false,
              level: monsterName === "Aibatt" ? 1 : 2,
              rank: "normal",
              area: "normal",
              element: monsterName === "Aibatt" ? "wind" : "earth",
              drops: [{ item: 100 }]
            }
          ]
        })
      });
    }) as jest.Mock;
  });

  it("highlights a hovered region and opens its region map", () => {
    render(<MapPage />);

    expect(screen.getByRole("img", { name: "Madrigal world map" })).toBeInTheDocument();
    expect(screen.getByText("Select a region")).toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByRole("button", { name: "Select Flaris" }));

    expect(screen.getByRole("heading", { name: "Flaris" })).toBeInTheDocument();
    expect(screen.getByText("A smaller island region southeast of the mainland.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Select Flaris" }));

    expect(screen.getByRole("img", { name: "Flaris map" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aibatt" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to world" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));

    expect(screen.getByRole("button", { name: "Reset zoom" })).toHaveTextContent("125%");

    fireEvent.click(screen.getByRole("button", { name: "Back to world" }));

    expect(screen.getByRole("img", { name: "Madrigal world map" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset zoom" })).toHaveTextContent("100%");
  });

  it("shows monster details from the assigned marker name", async () => {
    render(<MapPage />);

    fireEvent.click(screen.getByRole("button", { name: "Select Flaris" }));

    expect(await screen.findAllByText("Lv. 1")).toHaveLength(2);
    expect(screen.getByText("Small Aibatt")).toBeInTheDocument();
    expect(screen.getByText("Giant Aibatt")).toBeInTheDocument();
    expect(screen.getByText("Twinkle Stone")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "wind element" })).toHaveLength(3);
  });
});
