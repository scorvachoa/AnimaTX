import React, { useEffect, useRef, useState, RefObject } from "react";
import { PlayerRef } from "@remotion/player";
import { Project } from "./Video";
import {
  CaptionBounds,
  constrainPosition,
  offsetPosition,
  positionOffset,
} from "./caption-position.mjs";
export function PreviewOverlay({
  project,
  player,
  disabled,
  onChange,
  viewScale = 1,
  safeGuide = false,
  captionBounds = { halfWidth: 0, halfHeight: 0 },
  onBounds,
}: {
  project: Project;
  player: RefObject<PlayerRef | null>;
  disabled: boolean;
  onChange: (style: Project["style"]) => void;
  viewScale?: number;
  safeGuide?: boolean;
  captionBounds?: CaptionBounds;
  onBounds?: (bounds: CaptionBounds) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    drag = useRef<{
      x: number;
      y: number;
      width: number;
      height: number;
      style: Project["style"];
      mode: "move" | "size";
    } | null>(null);
  const [box, setBox] = useState<{
      left: number;
      top: number;
      width: number;
      height: number;
    } | null>(null),
    [draft, setDraft] = useState<{
      x: number;
      y: number;
      scale: number;
    } | null>(null);
  useEffect(() => {
    const container = host.current?.parentElement;
    if (!container) return;
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const text = container.querySelector("[data-caption-text]");
        if (!text) {
          setBox(null);
          return;
        }
        const rect = text.getBoundingClientRect(),
          base = container.getBoundingClientRect();
        const words = Array.from(
          text.querySelectorAll(":scope > div > span"),
        ).map((word) => word.getBoundingClientRect());
        const scale = Math.min(
          base.width / project.width,
          base.height / project.height,
        );
        if (words.length && scale > 0) {
          const width =
            Math.max(...words.map((r) => r.right)) -
            Math.min(...words.map((r) => r.left));
          const height =
            Math.max(...words.map((r) => r.bottom)) -
            Math.min(...words.map((r) => r.top));
          onBounds?.({
            halfWidth: (width / (scale * project.width)) * 50 + 0.6,
            halfHeight: (height / (scale * project.height)) * 50 + 0.6,
            left:
              ((base.left +
                (base.width - project.width * scale) / 2 +
                ((project.style.x ?? 50) / 100) * project.width * scale -
                Math.min(...words.map((r) => r.left))) /
                (scale * project.width)) *
                100 +
              0.3,
            right:
              ((Math.max(...words.map((r) => r.right)) -
                (base.left +
                  (base.width - project.width * scale) / 2 +
                  ((project.style.x ?? 50) / 100) * project.width * scale)) /
                (scale * project.width)) *
                100 +
              0.3,
            top:
              ((base.top +
                (base.height - project.height * scale) / 2 +
                (project.style.y / 100) * project.height * scale -
                Math.min(...words.map((r) => r.top))) /
                (scale * project.height)) *
                100 +
              0.3,
            bottom:
              ((Math.max(...words.map((r) => r.bottom)) -
                (base.top +
                  (base.height - project.height * scale) / 2 +
                  (project.style.y / 100) * project.height * scale)) /
                (scale * project.height)) *
                100 +
              0.3,
          });
        }
        setBox({
          left: (rect.left - base.left) / viewScale,
          top: (rect.top - base.top) / viewScale,
          width: rect.width / viewScale,
          height: rect.height / viewScale,
        });
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    player.current?.addEventListener("frameupdate", measure);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      player.current?.removeEventListener("frameupdate", measure);
    };
  }, [project, player, viewScale, onBounds]);
  function begin(e: React.PointerEvent<HTMLDivElement>, mode: "move" | "size") {
    if (disabled || e.button !== 0 || !host.current?.parentElement) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    player.current?.pause();
    const rect = host.current.parentElement.getBoundingClientRect(),
      scale = Math.min(
        rect.width / project.width,
        rect.height / project.height,
      );
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      width: project.width * scale,
      height: project.height * scale,
      style: project.style,
      mode,
    };
  }
  function next(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return null;
    const dx = e.clientX - d.x,
      dy = e.clientY - d.y;
    if (d.mode === "move") {
      const x = Math.max(
          5,
          Math.min(95, (d.style.x ?? 50) + (dx / d.width) * 100),
        ),
        y = Math.max(5, Math.min(95, d.style.y + (dy / d.height) * 100));
      const position = constrainPosition(
        {
          x: offsetPosition("x", positionOffset("x", x)),
          y: offsetPosition("y", positionOffset("y", y)),
        },
        safeGuide,
        captionBounds,
      );
      setDraft({
        x: (((position.x - (d.style.x ?? 50)) / 100) * d.width) / viewScale,
        y: (((position.y - d.style.y) / 100) * d.height) / viewScale,
        scale: 1,
      });
      return { ...d.style, ...position };
    }
    const ratio = Math.max(0.5, Math.min(2, 1 + (dx / d.width) * 3));
    setDraft({ x: 0, y: 0, scale: ratio });
    return {
      ...d.style,
      fontSize: Math.max(
        16,
        Math.min(180, Math.round(d.style.fontSize * ratio)),
      ),
      secondFontSize: Math.max(
        16,
        Math.min(
          180,
          Math.round((d.style.secondFontSize ?? d.style.fontSize) * ratio),
        ),
      ),
    };
  }
  return (
    <div ref={host} className="preview-edit-layer">
      {box && !disabled && (
        <div
          className="caption-edit-box"
          style={{
            ...box,
            transform: draft
              ? `translate(${draft.x}px,${draft.y}px) scale(${draft.scale})`
              : undefined,
          }}
          onPointerDown={(e) => begin(e, "move")}
          onPointerMove={next}
          onPointerUp={(e) => {
            if (!drag.current) return;
            const style = next(e);
            drag.current = null;
            setDraft(null);
            if (style) onChange(style);
          }}
          onPointerCancel={() => {
            drag.current = null;
            setDraft(null);
          }}
        >
          <span className="caption-move-label">✥ Mover subtítulos</span>
          <div
            className="caption-size-handle"
            title="Arrastra para cambiar tamaño"
            onPointerDown={(e) => begin(e, "size")}
          />
        </div>
      )}
    </div>
  );
}
