"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const ZOOM_STEP = 1.15;

type PanPoint = {
  x: number;
  y: number;
};

type DragState =
  | {
      mode: "pan";
      startX: number;
      startY: number;
      origin: PanPoint;
    }
  | {
      mode: "split";
    }
  | null;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

interface SplitPreviewProps {
  originalUrl: string;
  compressedUrl: string;
}

export default function SplitPreview({
  originalUrl,
  compressedUrl,
}: SplitPreviewProps) {
  const [position, setPosition] = useState(50);
  const [zoomLevel, setZoomLevel] = useState(MIN_ZOOM);
  const [pan, setPan] = useState<PanPoint>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(MIN_ZOOM);
  const panRef = useRef<PanPoint>({ x: 0, y: 0 });
  const dragStateRef = useRef<DragState>(null);

  const clampPan = useCallback((pan: PanPoint, zoom: number): PanPoint => {
    const container = containerRef.current;
    if (!container || zoom <= MIN_ZOOM) {
      return { x: 0, y: 0 };
    }

    const rect = container.getBoundingClientRect();
    // With transform-origin: 0 0, the stage is anchored at top-left.
    // At scale S, the stage is S times wider/taller than the container.
    // Pan must keep the stage from leaving the container viewport.
    const maxX = 0;
    const minX = -(zoom - 1) * rect.width;
    const maxY = 0;
    const minY = -(zoom - 1) * rect.height;

    return {
      x: clamp(pan.x, minX, maxX),
      y: clamp(pan.y, minY, maxY),
    };
  }, []);

  const setView = useCallback(
    (nextZoom: number, nextPan: PanPoint) => {
      const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
      const clampedPan = clampPan(nextPan, clampedZoom);

      zoomRef.current = clampedZoom;
      panRef.current = clampedPan;
      setZoomLevel(clampedZoom);
      setPan(clampedPan);
    },
    [clampPan],
  );

  const resetView = useCallback(() => {
    setView(MIN_ZOOM, { x: 0, y: 0 });
    setIsPanning(false);
  }, [setView]);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  useEffect(() => {
    resetView();
  }, [originalUrl, compressedUrl, resetView]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) {
        return;
      }

      if (dragState.mode === "split") {
        updatePosition(e.clientX);
        return;
      }

      const nextPan = {
        x: dragState.origin.x + (e.clientX - dragState.startX),
        y: dragState.origin.y + (e.clientY - dragState.startY),
      };

      setView(zoomRef.current, nextPan);
    };

    const onUp = () => {
      dragStateRef.current = null;
      setIsPanning(false);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [setView, updatePosition]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const rect = container.getBoundingClientRect();
      // Cursor position relative to container top-left
      const pointX = event.clientX - rect.left;
      const pointY = event.clientY - rect.top;
      const direction = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      const prevZoom = zoomRef.current;
      const nextZoom = clamp(prevZoom * direction, MIN_ZOOM, MAX_ZOOM);

      if (nextZoom === prevZoom) {
        return;
      }

      // With transform-origin: 0 0, the point under the cursor in stage-space
      // is (pointX - panX) / prevZoom. To keep that point fixed after zoom:
      //   (pointX - nextPanX) / nextZoom === (pointX - prevPanX) / prevZoom
      // => nextPanX = pointX - (pointX - prevPanX) * (nextZoom / prevZoom)
      const nextPan = {
        x: pointX - (pointX - panRef.current.x) * (nextZoom / prevZoom),
        y: pointY - (pointY - panRef.current.y) * (nextZoom / prevZoom),
      };

      setView(nextZoom, nextPan);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [setView]);

  const zoomAroundCenter = useCallback(
    (direction: 1 | -1) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pointX = rect.width / 2;
      const pointY = rect.height / 2;
      const prevZoom = zoomRef.current;
      const nextZoom = clamp(
        direction > 0 ? prevZoom * ZOOM_STEP : prevZoom / ZOOM_STEP,
        MIN_ZOOM,
        MAX_ZOOM,
      );
      const nextPan = {
        x: pointX - (pointX - panRef.current.x) * (nextZoom / prevZoom),
        y: pointY - (pointY - panRef.current.y) * (nextZoom / prevZoom),
      };
      setView(nextZoom, nextPan);
    },
    [setView],
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-lg select-none bg-[var(--color-bg-secondary)] ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
      style={{ minHeight: 260 }}
      onDoubleClick={resetView}
      onPointerDown={(event) => {
        if (event.button !== 0) {
          return;
        }

        dragStateRef.current = {
          mode: "pan",
          startX: event.clientX,
          startY: event.clientY,
          origin: { ...panRef.current },
        };
        setIsPanning(true);
      }}
    >
      <div
        className="relative will-change-transform"
        style={{
          transformOrigin: "0 0",
          touchAction: "none",
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoomLevel})`,
        }}
      >
        {/* Compressed image — full width base layer */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={compressedUrl}
          alt="After compression"
          className="w-full h-full object-contain block max-h-[1200px]"
          draggable={false}
        />

        {/* Original image — clipped to reveal left portion */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={originalUrl}
            alt="Before compression"
            className="w-full h-full object-contain block max-h-[1200px]"
            draggable={false}
          />
        </div>
      </div>

      {/* Divider */}
      <div
        className="absolute inset-y-0 flex items-center"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      >
        <div className="pointer-events-none w-px h-full bg-white/80 shadow" />
        <button
          type="button"
          className="-ml-3 flex h-10 w-6 items-center justify-center rounded-full border border-white/70 bg-black/45 text-white shadow backdrop-blur-sm transition-colors hover:bg-black/60"
          aria-label="Drag split preview divider"
          onPointerDown={(event) => {
            event.stopPropagation();
            dragStateRef.current = { mode: "split" };
            updatePosition(event.clientX);
          }}
        >
          <span className="text-xs leading-none">||</span>
        </button>
      </div>

      {/* Labels */}
      <span className="absolute top-2 left-2 text-sm font-mono bg-black/50 text-white px-1.5 py-0.5 rounded pointer-events-none">
        Original
      </span>
      <span className="absolute top-2 right-2 text-sm font-mono bg-black/50 text-white px-1.5 py-0.5 rounded pointer-events-none">
        Compressed
      </span>

      <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-bg)_88%,transparent)] px-2 py-1 text-[var(--color-text-primary)] shadow-sm backdrop-blur-sm">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            zoomAroundCenter(-1);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition-colors hover:bg-[var(--color-bg-secondary)]"
          aria-label="Zoom out"
        >
          -
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            resetView();
          }}
          className="rounded-full px-2 py-1 text-xs font-mono transition-colors hover:bg-[var(--color-bg-secondary)]"
          aria-label="Reset zoom and position"
        >
          {Math.round(zoomLevel * 100)}%
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            zoomAroundCenter(1);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition-colors hover:bg-[var(--color-bg-secondary)]"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        className="sr-only"
        aria-label="Split preview position"
      />
    </div>
  );
}
