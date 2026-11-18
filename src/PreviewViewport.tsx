import React, { useEffect, useRef, useState } from "react";
import { zoomPreview, PreviewView } from "./preview-zoom.mjs";
export function PreviewViewport({
  children,
}: {
  children: (scale: number) => React.ReactNode;
}) {
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
    <>
      <div
        ref={host}
        className={`player-stage preview-viewport ${view.zoom > 1 ? "can-pan" : ""} ${panning ? "is-panning" : ""}`}
        title="Ctrl + rueda: zoom de vista previa. Arrastra el fondo al ampliar para desplazarte."
        onPointerDownCapture={(e) => {
          if (
            viewRef.current.zoom <= 1 ||
            e.button !== 0 ||
            (e.target instanceof Element &&
              e.target.closest(".caption-edit-box"))
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
        </div>
      </div>
    </>
  );
}
