import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  RefObject,
} from "react";
import { PlayerRef } from "@remotion/player";
import { Project, Word } from "./Video";
import { editWordTiming } from "./timeline-edit.mjs";
import { filmstripTiles } from "./filmstrip.mjs";
export function Timeline({
  project,
  player,
  disabled,
  onChange,
  onEditWord,
}: {
  project: Project;
  player: RefObject<PlayerRef | null>;
  disabled: boolean;
  onChange: (words: Word[]) => void;
  onEditWord: (id: string) => void;
}) {
  const [frame, setFrame] = useState(0),
    [playing, setPlaying] = useState(false),
    [zoom, setZoom] = useState(1);
  const [compact, setCompact] = useState(
    () => window.matchMedia("(max-width: 620px)").matches,
  );
  const [assets, setAssets] = useState<{
      peaks: number[];
      hasAudio: boolean;
      thumbnails: string;
      thumbnailCount: number;
      thumbnailWidth?: number;
      thumbnailHeight?: number;
      thumbnailColumns?: number;
      thumbnailRows?: number;
    } | null>(null),
    [assetError, setAssetError] = useState("");
  useEffect(() => {
    let live = true;
    setAssets(null);
    setAssetError("");
    fetch(`/api/projects/${project.id}/assets`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw Error(j.error);
        if (live) setAssets(j);
      })
      .catch(() => {
        if (live) setAssetError("No se pudo cargar la vista del audio.");
      });
    return () => {
      live = false;
    };
  }, [project.id]);
  const scroller = useRef<HTMLDivElement>(null),
    content = useRef<HTMLDivElement>(null),
    section = useRef<HTMLElement>(null),
    zoomRef = useRef(1),
    anchor = useRef<{ ratio: number; x: number } | null>(null);
  const [stripView, setStripView] = useState({
    width: 0,
    viewport: 0,
    scroll: 0,
  });
  const [hoverFrame, setHoverFrame] = useState<{
    index: number;
    left: number;
    top: number;
  } | null>(null);
  function measureStrip() {
    if (scroller.current && content.current)
      setStripView({
        width: content.current.getBoundingClientRect().width,
        viewport: scroller.current.clientWidth,
        scroll: scroller.current.scrollLeft,
      });
  }
  useLayoutEffect(() => {
    measureStrip();
    const observer = new ResizeObserver(measureStrip);
    if (scroller.current) observer.observe(scroller.current);
    return () => observer.disconnect();
  }, [zoom]);
  const thumbAspect =
    (assets?.thumbnailWidth ?? project.width) /
    (assets?.thumbnailHeight ?? project.height);
  const tiles = assets
    ? filmstripTiles(
        stripView.width,
        stripView.viewport,
        Math.max(0, stripView.scroll - stripView.viewport / 2),
        thumbAspect,
        assets.thumbnailCount,
        compact ? 36 : 64,
      )
    : [];
  function spriteStyle(index: number, width: number, height: number) {
    const columns = assets?.thumbnailColumns ?? assets?.thumbnailCount ?? 1,
      rows = assets?.thumbnailRows ?? 1;
    return {
      backgroundImage: `url(${assets?.thumbnails})`,
      backgroundSize: `${columns * width}px ${rows * height}px`,
      backgroundPosition: `${-(index % columns) * width}px ${-Math.floor(index / columns) * height}px`,
    };
  }
  const [draft, setDraft] = useState<Word[] | null>(null),
    [selected, setSelected] = useState(""),
    [undo, setUndo] = useState<{ before: Word[]; after: string } | null>(null);
  const dragging = useRef<{
    id: string;
    mode: "move" | "start" | "end";
    x: number;
    width: number;
    scroll: number;
    words: Word[];
    moved: boolean;
  } | null>(null);
  function changeZoom(next: number, x?: number) {
    const scroll = scroller.current;
    if (!scroll || !content.current) return;
    const z = Math.max(1, Math.min(20, next));
    const position = x ?? scroll.clientWidth / 2;
    anchor.current = {
      ratio:
        (scroll.scrollLeft + position - scroll.clientWidth / 2) /
        content.current.getBoundingClientRect().width,
      x: position,
    };
    zoomRef.current = z;
    setZoom(z);
  }
  useLayoutEffect(() => {
    if (anchor.current && scroller.current && content.current) {
      scroller.current.scrollLeft =
        scroller.current.clientWidth / 2 +
        anchor.current.ratio * content.current.getBoundingClientRect().width -
        anchor.current.x;
      anchor.current = null;
    }
  }, [zoom]);
  useLayoutEffect(() => {
    if (!playing || !scroller.current || !content.current) return;
    // Half a viewport of space on either side keeps even the first and
    // last frames centered without changing the time coordinates of clips.
    scroller.current.scrollLeft =
      Math.min(1, frame / 30 / project.duration) *
      content.current.getBoundingClientRect().width;
  }, [frame, playing, zoom, stripView.viewport, project.duration]);
  useEffect(() => {
    const target = section.current;
    if (!target) return;
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.altKey) return;
      event.preventDefault();
      event.stopPropagation();
      if (dragging.current) return;
      const scroll = scroller.current;
      if (!scroll) return;
      if (event.altKey && !event.ctrlKey) {
        // Pause auto-follow so it cannot undo the user's manual navigation.
        player.current?.pause();
        const delta =
          Math.abs(event.deltaX) > Math.abs(event.deltaY)
            ? event.deltaX
            : event.deltaY;
        const unit =
          event.deltaMode === 1
            ? 20
            : event.deltaMode === 2
              ? scroll.clientWidth
              : 1;
        scroll.scrollLeft += delta * unit;
        return;
      }
      const factor = Math.exp(-Math.sign(event.deltaY) * 0.15);
      changeZoom(
        zoomRef.current * factor,
        event.clientX - scroll.getBoundingClientRect().left,
      );
    };
    target.addEventListener("wheel", wheel, { passive: false });
    return () => target.removeEventListener("wheel", wheel);
  }, []);
  function commit(words: Word[]) {
    if (JSON.stringify(words) === JSON.stringify(project.words)) return;
    setUndo({ before: project.words, after: JSON.stringify(words) });
    onChange(words);
  }
  function begin(
    event: React.PointerEvent<HTMLElement>,
    id: string,
    mode: "move" | "start" | "end",
  ) {
    if (disabled || event.button !== 0 || !content.current || !scroller.current)
      return;
    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    player.current?.pause();
    setSelected(id);
    dragging.current = {
      id,
      mode,
      x: event.clientX,
      width: content.current.getBoundingClientRect().width,
      scroll: scroller.current.scrollLeft,
      words: project.words,
      moved: false,
    };
  }
  function updateDrag(event: React.PointerEvent<HTMLElement>) {
    const drag = dragging.current,
      scroll = scroller.current;
    if (!drag || !scroll) return;
    const box = scroll.getBoundingClientRect();
    if (event.clientX > box.right - 24) scroll.scrollLeft += 15;
    else if (event.clientX < box.left + 24) scroll.scrollLeft -= 15;
    const pixels = event.clientX - drag.x + scroll.scrollLeft - drag.scroll;
    if (Math.abs(pixels) > 2) drag.moved = true;
    const next = editWordTiming(
      drag.words,
      drag.id,
      drag.mode,
      (pixels / drag.width) * project.duration,
      project.duration,
    );
    setDraft(next);
    return next;
  }
  function endDrag(event: React.PointerEvent<HTMLElement>) {
    const drag = dragging.current;
    if (!drag) return;
    const next = updateDrag(event);
    dragging.current = null;
    setDraft(null);
    if (drag.moved && next) commit(next);
    else {
      const word = project.words.find((w) => w.id === drag.id);
      if (word) seek(Math.max(0, word.start - lead));
    }
  }
  function keyboard(
    event: React.KeyboardEvent<HTMLElement>,
    id: string,
    mode: "move" | "start" | "end",
  ) {
    if (disabled || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    setSelected(id);
    commit(
      editWordTiming(
        project.words,
        id,
        mode,
        ((event.key === "ArrowLeft" ? -1 : 1) * (event.shiftKey ? 10 : 1)) / 30,
        project.duration,
      ),
    );
  }
  const visibleWords = draft ?? project.words;
  const selectedWord = visibleWords.find((w) => w.id === selected);
  useEffect(() => {
    const target = player.current;
    if (!target) return;
    setFrame(0);
    setPlaying(false);
    const update = (e: { detail: { frame: number } }) =>
        setFrame(e.detail.frame),
      play = () => setPlaying(true),
      pause = () => setPlaying(false);
    target.addEventListener("frameupdate", update);
    target.addEventListener("play", play);
    target.addEventListener("pause", pause);
    target.addEventListener("ended", pause);
    return () => {
      target.removeEventListener("frameupdate", update);
      target.removeEventListener("play", play);
      target.removeEventListener("pause", pause);
      target.removeEventListener("ended", pause);
    };
  }, [project.id, player]);
  const seek = (seconds: number) =>
    player.current?.seekTo(
      Math.max(
        0,
        Math.min(
          Math.ceil(project.duration * 30) - 1,
          Math.round(seconds * 30),
        ),
      ),
    );
  const ticks = Array.from(
    { length: 11 },
    (_, i) => (project.duration * i) / 10,
  );
  const lead = (project.style.captionLeadMs ?? 150) / 1000;
  const timecode = (seconds: number) => {
    const frames = Math.max(0, Math.round(seconds * 30));
    return `${Math.floor(frames / 1800)
      .toString()
      .padStart(2, "0")}:${Math.floor((frames / 30) % 60)
      .toString()
      .padStart(2, "0")}:${(frames % 30).toString().padStart(2, "0")}`;
  };
  const scrub = (event: React.PointerEvent<HTMLElement>) => {
    const rect = content.current?.getBoundingClientRect();
    if (rect)
      seek(((event.clientX - rect.left) / rect.width) * project.duration);
  };
  return (
    <section
      ref={section}
      className={`timeline ${compact ? "timeline-compact" : ""}`}
      aria-label="Línea de tiempo"
    >
      <div className="timeline-toolbar">
        <span className="track-title">Línea de tiempo </span>
        <div className="transport">
          <button aria-label="Volver al inicio" onClick={() => seek(0)}>
            ⏮
          </button>
          <button
            className="play-toggle"
            title="Reproducir / pausar (Espacio)"
            aria-keyshortcuts="Space"
            aria-label={playing ? "Pausar" : "Reproducir"}
            onClick={() => player.current?.toggle()}
          >
            {playing ? "Ⅱ" : "▶"}
          </button>
          <span>
            <strong>{timecode(frame / 30)}</strong> <i>|</i>{" "}
            {timecode(project.duration)}
          </span>
          <button
            type="button"
            className="timeline-density"
            aria-label={
              compact ? "Expandir línea de tiempo" : "Compactar línea de tiempo"
            }
            title={
              compact ? "Expandir línea de tiempo" : "Compactar línea de tiempo"
            }
            aria-pressed={compact}
            onClick={() => setCompact((value) => !value)}
          >
            {compact ? "▴" : "▾"}
          </button>
        </div>
        <div className="timeline-zoom">
          <button
            aria-label="Reducir zoom de línea de tiempo"
            onClick={() => changeZoom(zoomRef.current / 1.3)}
          >
            −
          </button>
          <input
            type="range"
            min="100"
            max="2000"
            step="10"
            value={Math.round(zoom * 100)}
            aria-label="Zoom de línea de tiempo"
            title={`${Math.round(zoom * 100)}%`}
            onChange={(e) => changeZoom(+e.target.value / 100)}
          />
          <button
            aria-label="Aumentar zoom de línea de tiempo"
            onClick={() => changeZoom(zoomRef.current * 1.3)}
          >
            ＋
          </button>
        </div>
      </div>
      <input
        className="time-scrubber"
        aria-label="Posición del video"
        type="range"
        min="0"
        max={Math.max(1, Math.ceil(project.duration * 30) - 1)}
        value={frame}
        onChange={(e) => player.current?.seekTo(+e.target.value)}
      />
      <div className="timing-selection" role="status">
        {selectedWord ? (
          <>
            <strong>{selectedWord.text}</strong> {selectedWord.start.toFixed(2)}{" "}
            → {selectedWord.end.toFixed(2)} s{" "}
            <span>Flechas: 1 fotograma · Shift: 10</span>
          </>
        ) : (
          <span>Selecciona una palabra para ajustar sus tiempos.</span>
        )}
        {undo && (
          <button
            disabled={disabled || JSON.stringify(project.words) !== undo.after}
            onClick={() => {
              onChange(undo.before);
              setUndo(null);
            }}
          >
            Deshacer ajuste
          </button>
        )}
      </div>
      <div
        ref={scroller}
        className="timeline-scroll"
        onScroll={() => {
          measureStrip();
          setHoverFrame(null);
        }}
      >
        <div
          className="timeline-rail"
          style={{ width: `calc(${zoom * 100}% + ${stripView.viewport}px)` }}
        >
          <div
            ref={content}
            className="timeline-content"
            style={{
              width: `calc(100% - ${stripView.viewport}px)`,
              minWidth: 0,
              marginLeft: stripView.viewport / 2,
            }}
          >
            <div
              className="time-ruler"
              title="Arrastra para recorrer el video"
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                player.current?.pause();
                scrub(e);
              }}
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) scrub(e);
              }}
            >
              {ticks.map((t, i) => (
                <span key={i} style={{ left: `${i * 10}%` }}>
                  {timecode(t).slice(0, 5)}
                </span>
              ))}
            </div>
            <div className="caption-track" aria-label="Palabras de subtítulos">
              {visibleWords.map((w) => {
                const start = Math.max(0, w.start - lead),
                  end = Math.max(0, w.end - lead);
                if (end <= start) return null;
                return (
                  <button
                    className={`timing-clip ${selected === w.id ? "selected" : ""}`}
                    disabled={disabled}
                    title={`${w.text} · ${start.toFixed(2)} s`}
                    aria-label={`Ir a ${w.text}`}
                    key={w.id}
                    style={{
                      left: `${(start / project.duration) * 100}%`,
                      width: `${((end - start) / project.duration) * 100}%`,
                    }}
                    onPointerDown={(event) => begin(event, w.id, "move")}
                    onPointerMove={updateDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={() => {
                      dragging.current = null;
                      setDraft(null);
                    }}
                    onDoubleClick={(event) => {
                      if (disabled) return;
                      event.stopPropagation();
                      player.current?.pause();
                      setSelected(w.id);
                      onEditWord(w.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !disabled) {
                        event.preventDefault();
                        player.current?.pause();
                        setSelected(w.id);
                        onEditWord(w.id);
                      } else keyboard(event, w.id, "move");
                    }}
                    onClick={(event) => {
                      if (event.detail === 0) {
                        setSelected(w.id);
                        seek(start);
                      }
                    }}
                  >
                    <span
                      className="resize-handle start"
                      role="slider"
                      tabIndex={disabled ? -1 : 0}
                      aria-label={`Inicio de ${w.text}`}
                      aria-valuemin={0}
                      aria-valuemax={w.end}
                      aria-valuenow={w.start}
                      onPointerDown={(event) => begin(event, w.id, "start")}
                      onKeyDown={(event) => keyboard(event, w.id, "start")}
                    />
                    <span className="clip-text">{w.text}</span>
                    <span
                      className="resize-handle end"
                      role="slider"
                      tabIndex={disabled ? -1 : 0}
                      aria-label={`Fin de ${w.text}`}
                      aria-valuemin={w.start}
                      aria-valuemax={project.duration}
                      aria-valuenow={w.end}
                      onPointerDown={(event) => begin(event, w.id, "end")}
                      onKeyDown={(event) => keyboard(event, w.id, "end")}
                    />
                  </button>
                );
              })}
              {!project.words.length && (
                <span>Genera subtítulos para ver las palabras aquí</span>
              )}
            </div>
            <button
              className="video-track"
              aria-label={`Pista de video: ${project.name}. Haz clic para buscar.`}
              onPointerMove={(event) => {
                if (!assets) return;
                const rect = event.currentTarget.getBoundingClientRect(),
                  ratio = Math.max(
                    0,
                    Math.min(
                      0.999999,
                      (event.clientX - rect.left) / rect.width,
                    ),
                  ),
                  index = Math.floor(ratio * assets.thumbnailCount),
                  previewWidth = Math.round(120 * thumbAspect);
                setHoverFrame({
                  index,
                  left: Math.max(
                    8,
                    Math.min(
                      window.innerWidth - previewWidth - 8,
                      event.clientX - previewWidth / 2,
                    ),
                  ),
                  top: Math.max(8, rect.top - 154),
                });
              }}
              onPointerLeave={() => setHoverFrame(null)}
              onClick={(e) => {
                const box = e.currentTarget.getBoundingClientRect();
                seek(((e.clientX - box.left) / box.width) * project.duration);
              }}
            >
              {assets && (
                <span className="video-thumbnail-strip" aria-hidden="true">
                  {tiles.map((tile) => (
                    <span
                      key={tile.left}
                      style={{
                        left: tile.left,
                        width: tile.width,
                        height: tile.height,
                        ...spriteStyle(tile.index, tile.width, tile.height),
                      }}
                    />
                  ))}
                </span>
              )}
              <span className="video-track-name">▣ {project.name}</span>
              {!assets && <small>Generando miniaturas…</small>}
            </button>
            <button
              className="waveform-track"
              aria-label="Forma de onda del audio: clic para buscar"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                seek(((e.clientX - r.left) / r.width) * project.duration);
              }}
            >
              {assets?.hasAudio ? (
                <svg
                  viewBox={`0 0 ${assets.peaks.length} 30`}
                  preserveAspectRatio="none"
                  aria-label="Forma de onda real"
                >
                  <path
                    d={assets.peaks
                      .map(
                        (peak, i) =>
                          `M${i},${15 - peak * 14}V${15 + peak * 14}`,
                      )
                      .join(" ")}
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </svg>
              ) : (
                <span>
                  {assetError ||
                    (!assets
                      ? "Preparando miniaturas y audio…"
                      : "Video sin pista de audio")}
                </span>
              )}
            </button>
            <div
              className="playhead"
              title="Arrastra para recorrer el video"
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                player.current?.pause();
                scrub(e);
              }}
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) scrub(e);
              }}
              style={{
                left: `${Math.min(100, (frame / 30 / project.duration) * 100)}%`,
              }}
            >
              <span />
            </div>
          </div>
        </div>
      </div>
      {hoverFrame && assets && (
        <div
          className="timeline-frame-preview"
          style={{ left: hoverFrame.left, top: hoverFrame.top }}
        >
          <div
            style={{
              width: Math.round(120 * thumbAspect),
              height: 120,
              ...spriteStyle(
                hoverFrame.index,
                Math.round(120 * thumbAspect),
                120,
              ),
            }}
          />
          <span>
            {(
              (hoverFrame.index / assets.thumbnailCount) *
              project.duration
            ).toFixed(2)}{" "}
            s · Fotograma de referencia
          </span>
        </div>
      )}
    </section>
  );
}
