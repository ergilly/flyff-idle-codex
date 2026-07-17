"use client";

import { type MouseEvent, type WheelEvent, useEffect, useRef, useState } from "react";

export const minMapZoom = 1;
export const maxMapZoom = 2.5;
export const mapZoomStep = 0.25;
const zeroPan = { x: 0, y: 0 };

export function useMapViewport(resetKey: string) {
  const [zoom, setZoom] = useState(minMapZoom);
  const [pan, setPan] = useState(zeroPan);
  const [isPanning, setIsPanning] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const panStartRef = useRef({ panX: 0, panY: 0, x: 0, y: 0 });

  useEffect(() => {
    setZoom(minMapZoom);
    setPan(zeroPan);
  }, [resetKey]);

  function clampPan(nextPan: { x: number; y: number }, nextZoom = zoom) {
    const viewport = viewportRef.current;
    if (!viewport || nextZoom <= minMapZoom) return zeroPan;

    return {
      x: Math.min(0, Math.max(-viewport.clientWidth * (nextZoom - 1), nextPan.x)),
      y: Math.min(0, Math.max(-viewport.clientHeight * (nextZoom - 1), nextPan.y))
    };
  }

  function zoomTo(requestedZoom: number) {
    const viewport = viewportRef.current;
    const nextZoom = Math.min(maxMapZoom, Math.max(minMapZoom, requestedZoom));
    if (nextZoom === zoom) return;

    if (!viewport) {
      setZoom(nextZoom);
      return;
    }

    const centerX = viewport.clientWidth / 2;
    const centerY = viewport.clientHeight / 2;
    const zoomRatio = nextZoom / zoom;
    setPan((currentPan) =>
      clampPan(
        {
          x: centerX - (centerX - currentPan.x) * zoomRatio,
          y: centerY - (centerY - currentPan.y) * zoomRatio
        },
        nextZoom
      )
    );
    setZoom(nextZoom);
  }

  function handlePanStart(event: MouseEvent<HTMLDivElement>) {
    if (event.button !== 0 || zoom <= minMapZoom) return;

    event.preventDefault();
    panStartRef.current = {
      panX: pan.x,
      panY: pan.y,
      x: event.clientX,
      y: event.clientY
    };
    setIsPanning(true);
  }

  function handlePanMove(event: MouseEvent<HTMLDivElement>) {
    if (!isPanning) return;

    setPan(
      clampPan({
        x: panStartRef.current.panX + event.clientX - panStartRef.current.x,
        y: panStartRef.current.panY + event.clientY - panStartRef.current.y
      })
    );
  }

  function handlePanEnd() {
    setIsPanning(false);
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    zoomTo(zoom + (event.deltaY < 0 ? mapZoomStep : -mapZoomStep));
  }

  return {
    canZoomIn: zoom < maxMapZoom,
    canZoomOut: zoom > minMapZoom,
    handlePanEnd,
    handlePanMove,
    handlePanStart,
    handleWheel,
    isPanning,
    layerStyle: {
      height: `${zoom * 100}%`,
      transform: `translate(${pan.x}px, ${pan.y}px)`,
      width: `${zoom * 100}%`
    },
    reset: () => {
      setZoom(minMapZoom);
      setPan(zeroPan);
    },
    viewportRef,
    zoom,
    zoomIn: () => zoomTo(zoom + mapZoomStep),
    zoomOut: () => zoomTo(zoom - mapZoomStep)
  };
}
