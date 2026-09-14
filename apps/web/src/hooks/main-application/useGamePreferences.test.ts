import { act, renderHook, waitFor } from "@testing-library/react";
import { defaultGamePreferences, useGamePreferences } from "./useGamePreferences";

describe("useGamePreferences", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-reduced-motion");
  });

  it("loads valid stored preferences and applies reduced motion", async () => {
    localStorage.setItem(
      "flyffIdlePreferences",
      JSON.stringify({
        autosaveIntervalSeconds: 300,
        compactInventoryGrid: true,
        combatLogDetail: "concise",
        reducedMotion: true
      })
    );

    const { result } = renderHook(() => useGamePreferences());

    await waitFor(() =>
      expect(result.current.preferences).toMatchObject({
        autosaveIntervalSeconds: 300,
        compactInventoryGrid: true,
        combatLogDetail: "concise",
        reducedMotion: true
      })
    );
    expect(document.documentElement.dataset.reducedMotion).toBe("true");
  });

  it("falls back to defaults for invalid stored preferences and persists updates", async () => {
    localStorage.setItem("flyffIdlePreferences", "not-json");

    const { result } = renderHook(() => useGamePreferences());
    await waitFor(() => expect(result.current.preferences).toEqual(defaultGamePreferences));

    act(() => result.current.updatePreferences({ reducedMotion: true }));

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem("flyffIdlePreferences") ?? "{}")).toMatchObject({
        reducedMotion: true
      });
    });
    expect(document.documentElement.dataset.reducedMotion).toBe("true");
  });
});
