import { act, renderHook } from "@testing-library/react";
import { maxMapZoom, minMapZoom, useMapViewport } from "@/hooks/map/useMapViewport";

describe("useMapViewport", () => {
  it("zooms within bounds and resets", () => {
    const { result } = renderHook(() => useMapViewport("world"));
    expect(result.current.zoom).toBe(minMapZoom);

    act(() => result.current.zoomIn());
    expect(result.current.zoom).toBe(1.25);
    for (let index = 0; index < 10; index += 1) act(() => result.current.zoomIn());
    expect(result.current.zoom).toBe(maxMapZoom);

    act(() => result.current.reset());
    expect(result.current.zoom).toBe(minMapZoom);
  });

  it("resets when the displayed map changes", () => {
    const { result, rerender } = renderHook(({ key }) => useMapViewport(key), {
      initialProps: { key: "world" }
    });
    act(() => result.current.zoomIn());
    rerender({ key: "flaris" });
    expect(result.current.zoom).toBe(minMapZoom);
  });

  it("ignores panning at base zoom", () => {
    const { result } = renderHook(() => useMapViewport("world"));
    const preventDefault = jest.fn();
    act(() => result.current.handlePanStart({ button: 0, preventDefault } as never));
    expect(preventDefault).not.toHaveBeenCalled();
    expect(result.current.isPanning).toBe(false);
  });
});
