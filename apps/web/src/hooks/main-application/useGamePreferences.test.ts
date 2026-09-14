import { act, renderHook, waitFor } from "@testing-library/react";
import { defaultGamePreferences, useGamePreferences } from "./useGamePreferences";

describe("useGamePreferences", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads the stored autosave interval", async () => {
    localStorage.setItem(
      "flyffIdlePreferences",
      JSON.stringify({
        autosaveIntervalSeconds: 300
      })
    );

    const { result } = renderHook(() => useGamePreferences());

    await waitFor(() =>
      expect(result.current.preferences).toMatchObject({
        autosaveIntervalSeconds: 300
      })
    );
  });

  it("falls back to defaults for invalid stored preferences and persists updates", async () => {
    localStorage.setItem("flyffIdlePreferences", "not-json");

    const { result } = renderHook(() => useGamePreferences());
    await waitFor(() => expect(result.current.preferences).toEqual(defaultGamePreferences));

    act(() => result.current.updatePreferences({ autosaveIntervalSeconds: 300 }));

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem("flyffIdlePreferences") ?? "{}")).toMatchObject({
        autosaveIntervalSeconds: 300
      });
    });
  });
});
