type MapZoomControlsProps = {
  canZoomIn: boolean;
  canZoomOut: boolean;
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoom: number;
};

export function MapZoomControls({
  canZoomIn,
  canZoomOut,
  onReset,
  onZoomIn,
  onZoomOut,
  zoom
}: MapZoomControlsProps) {
  return (
    <div
      className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-control border border-border bg-black/72 p-1 shadow-menu backdrop-blur-sm"
      data-testid="map_div_zoom_controls"
    >
      <button
        type="button"
        data-testid="map_button_zoom_out"
        className="grid h-8 w-8 place-items-center rounded-control border border-border bg-panel-muted text-base font-black text-foreground transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!canZoomOut}
        onClick={onZoomOut}
        aria-label="Zoom out"
        title="Zoom out"
      >
        -
      </button>
      <button
        type="button"
        data-testid="map_button_zoom_reset"
        className="min-w-14 rounded-control px-2 text-xs font-black text-[#fff1ba] transition-colors hover:bg-panel-muted"
        onClick={onReset}
        aria-label="Reset zoom"
        title="Reset zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        data-testid="map_button_zoom_in"
        className="grid h-8 w-8 place-items-center rounded-control border border-border bg-panel-muted text-base font-black text-foreground transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!canZoomIn}
        onClick={onZoomIn}
        aria-label="Zoom in"
        title="Zoom in"
      >
        +
      </button>
    </div>
  );
}
