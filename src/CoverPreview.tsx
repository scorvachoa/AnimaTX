import {
  CoverTextRect,
  moveCoverSelection,
  hitCoverLine,
} from "./cover-lines.mjs";
import React, { useEffect, useRef, useState } from "react";
import { Project } from "./Video";
import { CoverSettings, coverDefaults, drawCover } from "./cover.mjs";
import { CaptionBounds, constrainPosition } from "./caption-position.mjs";
import { PreviewViewport } from "./PreviewViewport";
export function CoverPreview({
  project,
  selectedLine,
  onSelectLine,
  disabled,
  onChange,
  safeGuide = false,
  onBounds,
  onGuideChange,
}: {
  project: Project;
  selectedLine: number[];
  onSelectLine: (index: number | null, additive?: boolean) => void;
  disabled: boolean;
  onChange: (cover: CoverSettings) => void;
  safeGuide?: boolean;
  onBounds?: (bounds: CaptionBounds) => void;
  onGuideChange?: (enabled: boolean) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    video = useRef<HTMLVideoElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<CoverTextRect[]>([]);
  const titleBounds = useRef<CaptionBounds>({ halfWidth: 20, halfHeight: 5 });
  useEffect(() => {
    const element = area.current;
    if (!element) return;
    const resize = () => {
      if (!canvas.current || !frame.current) return;
      const width = Math.max(
        0,
        Math.min(element.clientWidth, (element.clientHeight * 9) / 16),
      );
      frame.current.style.width = `${width}px`;
      frame.current.style.height = `${(width * 16) / 9}px`;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    return () => observer.disconnect();
  }, []);
  const cover = { ...coverDefaults, ...project.cover },
    latest = useRef(cover);
  latest.current = cover;
  const [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [exporting, setExporting] = useState(false);
  const drag = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
    cover: CoverSettings;
    index: number;
    layout: CoverTextRect[];
    selection: number[];
    moved: boolean;
  } | null>(null);
  function render() {
    if (canvas.current && video.current?.readyState && !video.current.seeking) {
      const bounds = drawCover(
        canvas.current,
        video.current,
        latest.current,
        safeGuide,
        (next) =>
          setLayout((current) =>
            JSON.stringify(current) === JSON.stringify(next) ? current : next,
          ),
      );
      if (bounds) {
        titleBounds.current = bounds;
        onBounds?.(bounds);
      }
      setReady(true);
    }
  }
  function seek() {
    const v = video.current;
    if (!v || v.readyState < 1) return;
    setReady(false);
    setError("");
    const time = Math.max(
      0,
      Math.min(latest.current.time, project.duration - 1 / 30),
    );
    if (Math.abs(v.currentTime - time) < 0.001) render();
    else v.currentTime = time;
  }
  useEffect(() => {
    seek();
  }, [cover.time]);
  useEffect(() => {
    if (ready) render();
  }, [project.cover, safeGuide]);
  async function download() {
    if (!canvas.current || !ready || exporting) return;
    setExporting(true);
    setError("");
    try {
      await document.fonts.ready;
      render();
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.current!.toBlob(
          (b) => (b ? resolve(b) : reject(Error("No se pudo generar el PNG."))),
          "image/png",
        ),
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        project.name
          .replace(/\.[^.]+$/, "")
          .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_") + "-portada.png";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExporting(false);
    }
  }
  return (
    <div className="cover-workspace">
      <div className="cover-preview-toolbar">
        <span>MINIATURA · 1080 × 1920</span>
        <button
          type="button"
          className="primary"
          disabled={disabled || !ready || exporting}
          onClick={download}
        >
          {exporting ? "Generando…" : "↓ Descargar miniatura"}
        </button>
      </div>
      <video
        ref={video}
        src={`/media/${project.id}/video.mp4`}
        preload="auto"
        muted
        playsInline
        hidden
        onLoadedData={seek}
        onSeeked={seek}
        onError={() => {
          setError("No se pudo cargar el video para la portada.");
          setReady(false);
        }}
      />
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}
      {!ready && !error && (
        <div role="status" className="cover-loading">
          Preparando fotograma…
        </div>
      )}
      <PreviewViewport width={1080} height={1920} onGuideChange={onGuideChange}>
        {() => (
          <div
            ref={area}
            className="cover-canvas-area"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) onSelectLine(null);
            }}
          >
            <div ref={frame} className="cover-interactive-frame">
              <canvas
                data-preview-text-edit="true"
                ref={canvas}
                width={1080}
                height={1920}
                aria-label="Vista previa de miniatura. Selecciona un texto y arrastra para moverlo."
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    onSelectLine(null);
                    event.stopPropagation();
                  }
                }}
                onPointerDown={(e) => {
                  if (disabled || !ready || e.button !== 0) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  const index = hitCoverLine(
                    layout,
                    ((e.clientX - r.left) / r.width) * 1080,
                    ((e.clientY - r.top) / r.height) * 1920,
                  );
                  const additive = e.ctrlKey || e.metaKey;
                  const selection =
                    index !== null && selectedLine.includes(index) && !additive
                      ? selectedLine
                      : index === null
                        ? []
                        : [index];
                  if (
                    additive ||
                    index === null ||
                    !selectedLine.includes(index)
                  )
                    onSelectLine(index, additive);
                  e.currentTarget.focus({ preventScroll: true });
                  if (index === null || additive) return;
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  drag.current = {
                    x: e.clientX,
                    y: e.clientY,
                    width: r.width,
                    height: r.height,
                    cover: latest.current,
                    index,
                    layout,
                    selection,
                    moved: false,
                  };
                }}
                onPointerMove={(e) => {
                  const d = drag.current;
                  if (!d || disabled) return;
                  const dx = ((e.clientX - d.x) / d.width) * 100,
                    dy = ((e.clientY - d.y) / d.height) * 100;
                  if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) < 3)
                    return;
                  d.moved = true;
                  const lines = moveCoverSelection(
                    d.cover,
                    d.layout,
                    d.selection,
                    dx,
                    dy,
                    safeGuide,
                  );
                  onChange({
                    ...latest.current,
                    lines,
                    title: lines.map((line) => line.text).join("\n"),
                  });
                }}
                onPointerUp={() => {
                  if (drag.current && !drag.current.moved)
                    onSelectLine(drag.current.index);
                  drag.current = null;
                }}
                onPointerCancel={() => {
                  drag.current = null;
                }}
              />
              {layout
                .filter((rect) => selectedLine.includes(rect.index))
                .map((rect) => (
                  <div
                    key={rect.index}
                    className="cover-text-selection"
                    aria-hidden="true"
                    style={{
                      left: rect.x / 10.8 + "%",
                      top: rect.y / 19.2 + "%",
                      width: rect.width / 10.8 + "%",
                      height: rect.height / 19.2 + "%",
                    }}
                  />
                ))}
            </div>
          </div>
        )}
      </PreviewViewport>
    </div>
  );
}
