import React, { useEffect, useRef, useState } from "react";
import { Project } from "./Video";
import { CoverSettings, coverDefaults, drawCover } from "./cover.mjs";
import {
  CaptionBounds,
  constrainPosition,
  offsetPosition,
  positionOffset,
} from "./caption-position.mjs";
import { PreviewViewport } from "./PreviewViewport";
export function CoverPreview({
  project,
  disabled,
  onChange,
  safeGuide = false,
  onBounds,
  onGuideChange,
}: {
  project: Project;
  disabled: boolean;
  onChange: (cover: CoverSettings) => void;
  safeGuide?: boolean;
  onBounds?: (bounds: CaptionBounds) => void;
  onGuideChange?: (enabled: boolean) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    video = useRef<HTMLVideoElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const titleBounds = useRef<CaptionBounds>({ halfWidth: 20, halfHeight: 5 });
  useEffect(() => {
    const element = area.current;
    if (!element) return;
    const resize = () => {
      if (!canvas.current) return;
      const width = Math.max(
        0,
        Math.min(element.clientWidth, (element.clientHeight * 9) / 16),
      );
      canvas.current.style.width = `${width}px`;
      canvas.current.style.height = `${(width * 16) / 9}px`;
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
  } | null>(null);
  function render() {
    if (canvas.current && video.current?.readyState && !video.current.seeking) {
      const bounds = drawCover(
        canvas.current,
        video.current,
        latest.current,
        safeGuide,
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
        onSeeked={render}
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
          <div ref={area} className="cover-canvas-area">
            <canvas
              data-preview-text-edit="true"
              ref={canvas}
              width={1080}
              height={1920}
              aria-label="Vista previa de miniatura. Arrastra para mover el título."
              onPointerDown={(e) => {
                if (disabled || !ready || e.button !== 0) return;
                const r = e.currentTarget.getBoundingClientRect();
                e.currentTarget.setPointerCapture(e.pointerId);
                drag.current = {
                  x: e.clientX,
                  y: e.clientY,
                  width: r.width,
                  height: r.height,
                  cover: latest.current,
                };
              }}
              onPointerMove={(e) => {
                const d = drag.current;
                if (!d || disabled) return;
                onChange({
                  ...d.cover,
                  ...constrainPosition(
                    {
                      x: offsetPosition(
                        "x",
                        positionOffset(
                          "x",
                          d.cover.x + ((e.clientX - d.x) / d.width) * 100,
                        ),
                      ),
                      y: offsetPosition(
                        "y",
                        positionOffset(
                          "y",
                          d.cover.y + ((e.clientY - d.y) / d.height) * 100,
                        ),
                      ),
                    },
                    safeGuide,
                    titleBounds.current,
                  ),
                });
              }}
              onPointerUp={() => {
                drag.current = null;
              }}
              onPointerCancel={() => {
                drag.current = null;
              }}
            />
          </div>
        )}
      </PreviewViewport>
    </div>
  );
}
