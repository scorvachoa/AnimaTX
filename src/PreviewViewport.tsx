import React, { useEffect, useRef, useState } from "react";
import { zoomPreview, PreviewView } from "./preview-zoom.mjs";
import { SafeAreaGuide } from "./SafeAreaGuide";
import { PreviewTools, PreviewGuideSettings } from "./PreviewTools";
export function PreviewViewport({
  children,
  width,
  height,
  onGuideChange,
}: {
  children: (scale: number) => React.ReactNode;
  width: number;
  height: number;
  onGuideChange?: (enabled: boolean) => void;
}) {
  const [settings, setSettings] = useState<PreviewGuideSettings>({
    guide: true,
    grid: false,
    guideOpacity: 0.5,
    gridOpacity: 0.85,
    guideColor: "#707070",
    gridColor: "#ffffff",
  });
  const { guide, grid, guideOpacity, guideColor, gridOpacity, gridColor } =
    settings;
  const workspace = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false),
    [fullscreenError, setFullscreenError] = useState("");
  useEffect(() => {
    const changed = () => {
      setFullscreen(document.fullscreenElement === workspace.current);
      update({ zoom: 1, x: 0, y: 0 });
    };
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  async function toggleFullscreen() {
    setFullscreenError("");
    try {
      if (document.fullscreenElement === workspace.current)
        await document.exitFullscreen();
      else if (workspace.current?.requestFullscreen)
        await workspace.current.requestFullscreen();
      else setFullscreenError("Este navegador no admite pantalla completa.");
    } catch {
      setFullscreenError("No se pudo activar la pantalla completa.");
    }
  }
  const supportsGuide = Math.abs(width / height - 9 / 16) < 0.002;
  useEffect(() => {
    onGuideChange?.(guide && supportsGuide);
  }, [guide, supportsGuide, onGuideChange]);
  const host = useRef<HTMLDivElement>(null),
    viewRef = useRef<PreviewView>({ zoom: 1, x: 0, y: 0 }),
    drag = useRef<{ x: number; y: number; view: PreviewView } | null>(null),
    moved = useRef(false);
  const [view, setView] = useState(viewRef.current),
    [panning, setPanning] = useState(false);
  function update(next: PreviewView) {
    viewRef.current = next;
    setView(next);
  }
  function zoomTo(value: number, pointer?: { x: number; y: number }) {
    const rect = host.current?.getBoundingClientRect();
    if (!rect) return;
    update(
      zoomPreview(
        viewRef.current,
        value,
        pointer ?? { x: rect.width / 2, y: rect.height / 2 },
        rect.width,
        rect.height,
      ),
    );
  }
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      event.stopPropagation();
      if (drag.current) return;
      const rect = element.getBoundingClientRect();
      zoomTo(viewRef.current.zoom * Math.exp(-Math.sign(event.deltaY) * 0.12), {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    };
    element.addEventListener("wheel", wheel, { passive: false });
    const observer = new ResizeObserver(() => {
      const rect = element.getBoundingClientRect();
      update(
        zoomPreview(
          viewRef.current,
          viewRef.current.zoom,
          { x: rect.width / 2, y: rect.height / 2 },
          rect.width,
          rect.height,
        ),
      );
    });
    observer.observe(element);
    return () => {
      element.removeEventListener("wheel", wheel);
      observer.disconnect();
    };
  }, []);
  return (
    <div ref={workspace} className="preview-workspace preview-with-tools">
      <PreviewTools
        settings={settings}
        onChange={setSettings}
        supportsGuide={supportsGuide}
        fullscreen={fullscreen}
        onFullscreen={toggleFullscreen}
        onReset={() => update({ zoom: 1, x: 0, y: 0 })}
        zoom={view.zoom}
        error={fullscreenError}
      />
      <div
        ref={host}
        className={`player-stage preview-viewport ${view.zoom > 1 ? "can-pan" : ""} ${panning ? "is-panning" : ""}`}
        title="Ctrl + rueda: zoom de vista previa. Arrastra el fondo al ampliar para desplazarte."
        onPointerDownCapture={(e) => {
          if (
            viewRef.current.zoom <= 1 ||
            e.button !== 0 ||
            (e.target instanceof Element &&
              e.target.closest(
                ".caption-edit-box, [data-preview-text-edit], .safe-guide-controls",
              ))
          )
            return;
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, view: viewRef.current };
          moved.current = false;
          setPanning(true);
        }}
        onPointerMove={(e) => {
          if (!drag.current || !host.current) return;
          const rect = host.current.getBoundingClientRect(),
            d = drag.current;
          const dx = e.clientX - d.x,
            dy = e.clientY - d.y;
          if (Math.abs(dx) + Math.abs(dy) > 3) moved.current = true;
          update({
            ...d.view,
            x: Math.max(
              rect.width * (1 - d.view.zoom),
              Math.min(0, d.view.x + dx),
            ),
            y: Math.max(
              rect.height * (1 - d.view.zoom),
              Math.min(0, d.view.y + dy),
            ),
          });
        }}
        onPointerUp={() => {
          drag.current = null;
          setPanning(false);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setPanning(false);
        }}
        onClickCapture={(e) => {
          if (moved.current) {
            e.preventDefault();
            e.stopPropagation();
            moved.current = false;
          }
        }}
      >
        <div
          className="preview-zoom-content"
          style={{
            transform: `translate(${view.x}px,${view.y}px) scale(${view.zoom})`,
          }}
        >
          {children(view.zoom)}
          {guide && supportsGuide && (
            <SafeAreaGuide opacity={guideOpacity} color={guideColor} />
          )}
          {grid && (
            <svg
              className="preview-thirds-grid"
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              <defs>
                <path
                  id="preview-thirds-lines"
                  d={`M${width / 3} 0V${height}M${(width * 2) / 3} 0V${height}M0 ${height / 3}H${width}M0 ${(height * 2) / 3}H${width}`}
                />
              </defs>
              <use
                href="#preview-thirds-lines"
                stroke="#000"
                strokeOpacity={gridOpacity * 0.6}
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
              />
              <use
                href="#preview-thirds-lines"
                stroke={gridColor}
                strokeOpacity={gridOpacity}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
