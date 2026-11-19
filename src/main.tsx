import React, { useEffect, useRef, useState, useCallback } from "react";
import type { CaptionBounds } from "./caption-position.mjs";
import { createRoot } from "react-dom/client";
import { Player, PlayerRef } from "@remotion/player";
import { CaptionVideo, Project, Word } from "./Video";
import "./style.css";
import "./studio.css";
import { CaptionSyncControl } from "./CaptionSyncControl";
import { useProjectUi } from "./useProjectUi";
import { PanelTabs } from "./PanelTabs";
import { StylePanel } from "./StylePanel";
import { GeminiPanel } from "./GeminiPanel";
import { GeminiSettings } from "./GeminiSettings";
import { GeminiControls } from "./GeminiControls";
import { ScriptPanel } from "./ScriptPanel";
import { Templates } from "./templates";
import { Timeline } from "./Timeline";
import { ThemeSelector } from "./ThemeSelector";
import { CoverPanel } from "./CoverPanel";
import { CoverPreview } from "./CoverPreview";
import { coverDefaults } from "./cover.mjs";
import { DeleteProjectModal } from "./DeleteProjectModal";
import { PreviewOverlay } from "./PreviewOverlay";
import { PreviewViewport } from "./PreviewViewport";
import { WordStylePanel } from "./WordStylePanel";
import { SubtitleFiles } from "./SubtitleFiles";
import { applyImportedSubtitles } from "./subtitle-files.mjs";
import { CaptionBlocksPanel } from "./CaptionBlocksPanel";
import "./themes.css";
import { recordHistory, History } from "./project-history.mjs";
import { readApiResponse } from "./api-response.mjs";
async function api(url: string, options?: RequestInit) {
  const r = await fetch("/api" + url, options);
  return readApiResponse(r);
}
const json = (body: unknown) => ({
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
function App() {
  const [confirmation, setConfirmation] = useState<{
    name: string;
    title: string;
    description: string;
    confirmLabel: string;
    pendingLabel: string;
    destructive: boolean;
    onConfirm: () => Promise<void>;
    onAlternate?: () => Promise<void>;
    alternateLabel?: string;
  } | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [showGeminiSettings, setShowGeminiSettings] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  useEffect(() => {
    fetch("/api/gemini/config")
      .then((r) => r.json())
      .then((c) => setGeminiConfigured(!!c.configured))
      .catch(() => {});
  }, []);
  const [projects, setProjects] = useState<Project[]>([]),
    [p, setP] = useState<Project | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [download, setDownload] = useState(""),
    [dirty, setDirty] = useState(false),
    [language, setLanguage] = useState("es");
  const [panel, setPanel] = useState("text");
  const { ui: editorUi, set: setEditorUi } = useProjectUi(p?.id);
  const { styleTab, subtitleTab } = editorUi;
  const setStyleTab = (value: string) => setEditorUi("styleTab", value);
  const setSubtitleTab = (value: string) => setEditorUi("subtitleTab", value);
  const [guideEnabled, setGuideEnabled] = useState(true);
  const [coverGuideEnabled, setCoverGuideEnabled] = useState(true);
  const [coverTitleBounds, setCoverTitleBounds] = useState<CaptionBounds>({
    halfWidth: 20,
    halfHeight: 5,
  });
  const measureCoverTitle = useCallback(
    (next: CaptionBounds) =>
      setCoverTitleBounds((current) =>
        JSON.stringify(current) === JSON.stringify(next) ? current : next,
      ),
    [],
  );
  const [captionBounds, setCaptionBounds] = useState<CaptionBounds>({
    halfWidth: 25,
    halfHeight: 5,
  });
  const measureCaption = useCallback((next: CaptionBounds) => {
    setCaptionBounds((current) =>
      (["left", "right", "top", "bottom"] as const).some(
        (key) => Math.abs((current[key] ?? 0) - (next[key] ?? 0)) > 0.1,
      ) ||
      Math.abs(current.halfWidth - next.halfWidth) > 0.25 ||
      Math.abs(current.halfHeight - next.halfHeight) > 0.25
        ? next
        : current,
    );
  }, []);
  const safeGuide =
    guideEnabled && !!p && Math.abs(p.width / p.height - 9 / 16) < 0.002;
  useEffect(() => {
    setCaptionBounds({ halfWidth: 25, halfHeight: 5 });
  }, [p?.id]);
  const [styledWordId, setStyledWordId] = useState("");
  const history = useRef<History>({ past: [], future: [], group: "", at: 0 });
  const [historyVersion, setHistoryVersion] = useState(0),
    [saveStatus, setSaveStatus] = useState("saved");
  const projectRef = useRef(p);
  projectRef.current = p;
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    history.current = { past: [], future: [], group: "", at: 0 };
    setHistoryVersion((n) => n + 1);
    setSaveStatus("saved");
  }, [p?.id]);
  const [textEditRequest, setTextEditRequest] = useState<{ id: string } | null>(
    null,
  );
  const wordInputs = useRef(new Map<string, HTMLInputElement>());
  useEffect(() => {
    setTextEditRequest(null);
  }, [p?.id]);
  useEffect(() => {
    if (panel !== "text" || !textEditRequest) return;
    const input = wordInputs.current.get(textEditRequest.id);
    if (input) {
      input.focus({ preventScroll: true });
      input.select();
      input
        .closest(".word")
        ?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [panel, subtitleTab, textEditRequest]);
  const player = useRef<PlayerRef>(null);
  useEffect(() => {
    const togglePlayback = (event: KeyboardEvent) => {
      if (
        !p ||
        !player.current ||
        event.code !== "Space" ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.shiftKey ||
        event.isComposing ||
        showGeminiSettings ||
        document.querySelector("dialog[open]")
      )
        return;
      const target = event.target instanceof Element ? event.target : null;
      if (
        target?.closest(
          'input,textarea,select,button,a,summary,[role="tab"],[contenteditable]:not([contenteditable="false"]),[role="textbox"]',
        )
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) player.current.toggle();
    };
    window.addEventListener("keydown", togglePlayback, true);
    return () => window.removeEventListener("keydown", togglePlayback, true);
  }, [p?.id, showGeminiSettings]);
  useEffect(() => {
    api("/projects")
      .then(setProjects)
      .catch((e) => setError(e.message));
  }, []);
  const edit = (next: Project) => {
    history.current = recordHistory(history.current, projectRef.current, next);
    setHistoryVersion((n) => n + 1);
    projectRef.current = next;
    setP(next);
    setDirty(true);
    setDownload("");
  };
  async function save() {
    const snapshot = projectRef.current;
    if (!snapshot) return;
    setSaveStatus("saving");
    const action = saveQueue.current
      .catch(() => {})
      .then(() =>
        api(
          "/projects/" + snapshot.id,
          json({ ...snapshot, cover: snapshot.cover ?? null }),
        ),
      );
    saveQueue.current = action;
    const saved = await action;
    setProjects((list) => [saved, ...list.filter((x) => x.id !== saved.id)]);
    if (JSON.stringify(projectRef.current) === JSON.stringify(snapshot)) {
      setDirty(false);
      setSaveStatus("saved");
    }
    return saved;
  }
  function undoProject() {
    if (busy || !projectRef.current || !history.current.past.length) return;
    const current = projectRef.current,
      next = history.current.past.at(-1)!;
    history.current = {
      past: history.current.past.slice(0, -1),
      future: [current, ...history.current.future],
      group: "",
      at: 0,
    };
    projectRef.current = next;
    setP(next);
    setDirty(true);
    setDownload("");
    setHistoryVersion((n) => n + 1);
  }
  function redoProject() {
    if (busy || !projectRef.current || !history.current.future.length) return;
    const current = projectRef.current,
      next = history.current.future[0];
    history.current = {
      past: [...history.current.past, current],
      future: history.current.future.slice(1),
      group: "",
      at: 0,
    };
    projectRef.current = next;
    setP(next);
    setDirty(true);
    setDownload("");
    setHistoryVersion((n) => n + 1);
  }
  useEffect(() => {
    if (!p || !dirty || busy) return;
    setSaveStatus("pending");
    const timer = setTimeout(() => {
      save().catch(() => setSaveStatus("error"));
    }, 1500);
    return () => clearTimeout(timer);
  }, [p, dirty, busy]);
  useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [dirty]);
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (
        !(event.ctrlKey || event.metaKey) ||
        event.altKey ||
        event.isComposing ||
        showGeminiSettings
      )
        return;
      const key = event.key.toLowerCase();
      if (key !== "z" && key !== "y") return;
      if (
        event.target instanceof Element &&
        event.target.closest(".personal-templates,.gemini-settings")
      )
        return;
      if (document.querySelector("dialog[open]")) return;
      event.preventDefault();
      if (!event.repeat) {
        if (key === "y" || event.shiftKey) redoProject();
        else undoProject();
      }
    };
    window.addEventListener("keydown", keyboard, true);
    return () => window.removeEventListener("keydown", keyboard, true);
  }, [p, busy, showGeminiSettings, historyVersion]);
  function openProject(item: Project) {
    if (projectRef.current?.id === item.id) {
      setPanel("text");
      return;
    }
    const open = () => {
      setP(item);
      projectRef.current = item;
      setDirty(false);
      setDownload("");
      setError("");
      setPanel("text");
    };
    if (dirty) {
      setConfirmation({
        name: item.name,
        title: "¿Abrir otro proyecto?",
        description: "Hay cambios pendientes en el proyecto actual.",
        confirmLabel: "Guardar y abrir",
        pendingLabel: "Guardando…",
        destructive: false,
        onConfirm: async () => {
          await save();
          open();
        },
        alternateLabel: "Descartar y abrir",
        onAlternate: async () => {
          await saveQueue.current.catch(() => {});
          open();
        },
      });
    } else open();
  }
  function requestTranscription() {
    if (!p || busy) return;
    if (!p.words.length) {
      void job("transcribe");
      return;
    }
    setConfirmation({
      name: p.name,
      title: "¿Volver a transcribir?",
      description:
        "Se reemplazarán los subtítulos actuales. Podrás deshacer el resultado durante esta sesión.",
      confirmLabel: "Transcribir",
      pendingLabel: "Iniciando…",
      destructive: true,
      onConfirm: async () => {
        void job("transcribe");
      },
    });
  }
  async function deleteProject(item: Project) {
    if (busy) throw Error("Espera a que termine la operación en curso.");
    setBusy(true);
    setError("");
    try {
      await saveQueue.current.catch(() => {});
      await api(`/projects/${item.id}`, { method: "DELETE" });
      setProjects((list) => list.filter((project) => project.id !== item.id));
      if (projectRef.current?.id === item.id) {
        projectRef.current = null;
        setP(null);
        setDirty(false);
        setDownload("");
        setSaveStatus("saved");
      }
      setMessage("Proyecto eliminado.");
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    setMessage("Preparando video…");
    try {
      // Finish pending edits before replacing the active project. A failed
      // save aborts the upload and leaves the current project available.
      if (projectRef.current && dirty) await save();
      const body = new FormData();
      body.append("video", file);
      const project = await api("/projects", { method: "POST", body });
      setP(project);
      setProjects((l) => [project, ...l]);
      setDirty(false);
      setDownload("");
      setMessage("Video listo. Genera los subtítulos para empezar.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function job(action: string) {
    if (!p) return;
    setBusy(true);
    setError("");
    setDownload("");
    try {
      await save();
      const { id } = await api(`/projects/${p.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      });
      while (true) {
        const j = await api("/jobs/" + id);
        setMessage(j.message);
        if (j.status === "error") throw Error(j.message);
        if (j.status === "done") {
          if (j.project) {
            edit(j.project);
            setProjects((l) => [j.project, ...l.filter((x) => x.id !== p.id)]);
          }
          if (j.url) setDownload(j.url);
          break;
        }
        await new Promise((r) => setTimeout(r, 900));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function updateWord(id: string, patch: Partial<Word>) {
    if (p)
      edit({
        ...p,
        words: p.words.map((w) => (w.id === id ? { ...w, ...patch } : w)),
      });
  }
  return (
    <>
      <header className="studio-header">
        <a className="brand" href="/">
          <span>✦</span> AnimaTX
        </a>
        <div className="header-project">
          <span className="local-dot" /> {p?.name ?? "Nuevo proyecto"}{" "}
          <small role="status">
            {saveStatus === "error"
              ? "No se pudo guardar: revisa los tiempos"
              : saveStatus === "saving"
                ? "Guardando…"
                : dirty
                  ? "Guardado automático pendiente"
                  : "Guardado local ✓"}
          </small>
        </div>
        <div className="header-actions">
          <ThemeSelector />
          {p && (
            <>
              <button
                title="Deshacer (Ctrl + Z)"
                aria-label="Deshacer cambio"
                disabled={busy || !history.current.past.length}
                onClick={undoProject}
              >
                ↶
              </button>
              <button
                title="Rehacer (Ctrl + Y)"
                aria-label="Rehacer cambio"
                disabled={busy || !history.current.future.length}
                onClick={redoProject}
              >
                ↷
              </button>
            </>
          )}
          {p && (
            <>
              <button
                disabled={busy || !dirty}
                onClick={() =>
                  save()
                    .then(() => setMessage("Proyecto guardado"))
                    .catch((e) => setError(e.message))
                }
              >
                {dirty ? "Guardar cambios" : "Guardado ✓"}
              </button>
              <button
                className="primary"
                disabled={busy}
                onClick={() => job("export")}
              >
                Exportar video ↗
              </button>
            </>
          )}
        </div>
      </header>
      {confirmation && (
        <DeleteProjectModal
          {...confirmation}
          onClose={() => setConfirmation(null)}
        />
      )}
      {projectToDelete && (
        <DeleteProjectModal
          name={projectToDelete.name}
          onClose={() => setProjectToDelete(null)}
          onConfirm={() => deleteProject(projectToDelete)}
        />
      )}
      {showGeminiSettings && (
        <GeminiSettings
          onClose={() => setShowGeminiSettings(false)}
          onSaved={setGeminiConfigured}
        />
      )}
      <main className="studio-layout">
        <nav className="tool-rail" aria-label="Herramientas">
          {[
            ["projects", "▣", "Videos"],
            ["text", "▤", "Subtítulos"],
            ["styles", "Aa", "Estilos"],
            ["cover", "", "Miniatura"],
            ["script", "▧", "Guion"],
            ["ai", "✦", "Revisión IA"],
          ].map(([id, icon, label]) => (
            <button
              key={id}
              className={panel === id ? "active" : ""}
              onClick={() => setPanel(id)}
              aria-pressed={panel === id}
            >
              <span>
                {id === "cover" ? (
                  <svg
                    width="23"
                    height="23"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8" cy="8" r="1.5" />
                    <path d="m3 17 5-5 4 4 4-6 5 7" />
                  </svg>
                ) : (
                  icon
                )}
              </span>
              {label}
            </button>
          ))}
          <span className="rail-local">LOCAL</span>
        </nav>
        <aside
          className="inspector"
          aria-label="Panel de herramientas"
          tabIndex={0}
        >
          <div className="inspector-heading">
            <h2>
              {
                (
                  {
                    projects: "Tus videos",
                    styles: "Estilos",
                    cover: "Miniatura",
                    text: "Subtítulos",
                    script: "Guion original",
                    ai: "Revisión con IA",
                  } as Record<string, string>
                )[panel]
              }
            </h2>
            <span className="inspector-badge">AnimaTX</span>
          </div>
          {panel === "ai" && (
            <GeminiControls
              configured={geminiConfigured}
              busy={busy}
              setBusy={setBusy}
              onConfigure={() => setShowGeminiSettings(true)}
            />
          )}
          {p && (
            <div hidden={panel !== "ai"}>
              <GeminiPanel
                configured={geminiConfigured}
                project={p}
                language={language}
                busy={busy}
                setBusy={setBusy}
                onApply={(words) => edit({ ...p, words })}
              />
            </div>
          )}
          {panel === "ai" ? (
            <></>
          ) : panel === "projects" ? (
            <>
              <label className="upload">
                ＋ Subir video
                <input
                  type="file"
                  accept="video/*"
                  disabled={busy}
                  onChange={(e) => {
                    upload(e.target.files?.[0]);
                    e.target.value = "";
                    setPanel("text");
                  }}
                />
              </label>
              <small>Hasta 3 minutos · 500 MB</small>
              <div className="section-title">
                PROYECTOS <span>{projects.length}</span>
              </div>
              <div className="projects">
                {projects.map((item) => (
                  <div className="project-list-row" key={item.id}>
                    <button
                      disabled={busy}
                      className={p?.id === item.id ? "selected" : ""}
                      onClick={() => openProject(item)}
                    >
                      <span>▸</span>
                      <div>
                        {item.name}
                        <small>
                          {item.duration.toFixed(1)} s · {item.words.length}{" "}
                          palabras
                        </small>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="delete-project-button"
                      disabled={busy}
                      aria-label={`Eliminar proyecto ${item.name}`}
                      title="Eliminar proyecto"
                      onClick={() => setProjectToDelete(item)}
                    >
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : p ? (
            <>
              {panel === "cover" && (
                <CoverPanel
                  section={editorUi.coverSection}
                  onSectionChange={(value) =>
                    setEditorUi("coverSection", value)
                  }
                  safeGuide={coverGuideEnabled}
                  titleBounds={coverTitleBounds}
                  project={p}
                  disabled={busy}
                  onChange={(cover) => edit({ ...p, cover })}
                  onCapture={() => {
                    player.current?.pause();
                    edit({
                      ...p,
                      cover: {
                        ...coverDefaults,
                        ...p.cover,
                        time: Math.min(
                          Math.max(0, p.duration - 1 / 30),
                          (player.current?.getCurrentFrame() ?? 0) / 30,
                        ),
                      },
                    });
                  }}
                />
              )}
              {panel === "styles" && (
                <>
                  <PanelTabs
                    label="Opciones de estilo"
                    items={[
                      ["templates", "Plantillas"],
                      ["customize", "Personalizar"],
                    ]}
                    value={styleTab}
                    onChange={setStyleTab}
                    panelIds={{
                      templates: "style-templates",
                      customize: "style-customize",
                    }}
                  />
                  <div
                    id="style-templates"
                    role="tabpanel"
                    aria-label="Plantillas"
                    hidden={styleTab !== "templates"}
                  >
                    <Templates
                      project={p}
                      disabled={busy}
                      onApply={(style, name) => {
                        edit({ ...p, style });
                        setMessage(`Plantilla ${name} aplicada.`);
                      }}
                    />
                    <button
                      className="add"
                      onClick={() => setStyleTab("customize")}
                    >
                      Personalizar estilo ↗
                    </button>
                  </div>
                  <div
                    id="style-customize"
                    role="tabpanel"
                    aria-label="Personalizar"
                    hidden={styleTab !== "customize"}
                    className="settings"
                  >
                    <StylePanel
                      section={editorUi.styleSection}
                      onSectionChange={(value) =>
                        setEditorUi("styleSection", value)
                      }
                      selectedLine={editorUi.selectedLine}
                      onLineChange={(value) =>
                        setEditorUi("selectedLine", value)
                      }
                      safeGuide={safeGuide}
                      captionBounds={captionBounds}
                      style={p.style}
                      disabled={busy}
                      onChange={(style) => edit({ ...p, style })}
                    />
                  </div>
                </>
              )}
              {panel === "script" && (
                <ScriptPanel
                  onAlign={() => job("align")}
                  project={p}
                  disabled={busy}
                  onApply={(words) => edit({ ...p, words })}
                  onChange={(script) => edit({ ...p, script })}
                  onSeek={(seconds) =>
                    player.current?.seekTo(Math.floor(seconds * 30))
                  }
                />
              )}
              {panel === "text" && (
                <div className="transcript">
                  <PanelTabs
                    label="Opciones de subtítulos"
                    items={[
                      ["text", "Texto"],
                      ["phrases", "Frases"],
                      ["timing", "Tiempos"],
                    ]}
                    value={subtitleTab}
                    onChange={setSubtitleTab}
                    panelIds={{
                      text: "subtitle-content",
                      phrases: "subtitle-content",
                      timing: "subtitle-content",
                    }}
                  />
                  <div
                    id="subtitle-content"
                    role="tabpanel"
                    aria-label={
                      subtitleTab === "text"
                        ? "Texto"
                        : subtitleTab === "phrases"
                          ? "Frases"
                          : "Tiempos"
                    }
                  >
                    <div hidden={subtitleTab !== "text"}>
                      {" "}
                      <div className="generation-bar">
                        <select
                          aria-label="Idioma de transcripción"
                          disabled={busy}
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                        >
                          <option value="es">Español</option>
                          <option value="en">Inglés</option>
                          <option value="pt">Portugués</option>
                        </select>
                        <button disabled={busy} onClick={requestTranscription}>
                          ✦ Transcribir
                        </button>
                      </div>
                    </div>
                    <SubtitleFiles
                      key={p.id}
                      project={p}
                      disabled={busy}
                      onImport={(words) =>
                        edit(applyImportedSubtitles(p, words))
                      }
                    />
                    <div hidden={subtitleTab !== "text"}>
                      <WordStylePanel
                        project={p}
                        selected={styledWordId}
                        disabled={busy}
                        onSelect={setStyledWordId}
                        onChange={(word) =>
                          updateWord(word.id, { style: word.style })
                        }
                      />
                    </div>
                    <div hidden={subtitleTab !== "phrases"}>
                      <CaptionBlocksPanel
                        key={`blocks-${p.id}`}
                        project={p}
                        disabled={busy}
                        onChange={(words) => edit({ ...p, words })}
                        onSeek={(seconds) =>
                          player.current?.seekTo(
                            Math.floor(
                              Math.max(
                                0,
                                seconds - (p.style.captionLeadMs ?? 150) / 1000,
                              ) * 30,
                            ),
                          )
                        }
                      />
                    </div>
                    <div hidden={subtitleTab !== "timing"}>
                      <CaptionSyncControl
                        style={p.style}
                        disabled={busy}
                        onChange={(style) => edit({ ...p, style })}
                      />
                    </div>
                    <div
                      hidden={subtitleTab === "phrases"}
                      className={`transcript-editor transcript-${subtitleTab}`}
                    >
                      {" "}
                      <div className="section-title">
                        {subtitleTab === "timing"
                          ? "TIEMPOS POR PALABRA"
                          : "PALABRAS"}{" "}
                        {subtitleTab === "timing" && <span>segundos</span>}
                      </div>
                      <div className="word-head">
                        <span>PALABRA</span>
                        <span>INICIO</span>
                        <span>FIN</span>
                        <span />
                      </div>
                      <fieldset disabled={busy} className="word-list">
                        {p.words.map((w) => (
                          <div
                            className={`word ${textEditRequest?.id === w.id ? "word-highlighted" : ""}`}
                            key={w.id}
                          >
                            <input
                              ref={(node) => {
                                if (node) wordInputs.current.set(w.id, node);
                                else wordInputs.current.delete(w.id);
                              }}
                              aria-label="Palabra"
                              value={w.text}
                              onFocus={() => {
                                setStyledWordId(w.id);
                                player.current?.seekTo(
                                  Math.floor(w.start * 30),
                                );
                              }}
                              onChange={(e) =>
                                updateWord(w.id, { text: e.target.value })
                              }
                            />
                            <input
                              aria-label="Inicio"
                              type="number"
                              min="0"
                              step="0.01"
                              value={w.start}
                              onChange={(e) =>
                                updateWord(w.id, { start: +e.target.value })
                              }
                            />
                            <input
                              aria-label="Fin"
                              type="number"
                              min="0"
                              step="0.01"
                              value={w.end}
                              onChange={(e) =>
                                updateWord(w.id, { end: +e.target.value })
                              }
                            />
                            <button
                              aria-label="Eliminar palabra"
                              onClick={() =>
                                edit({
                                  ...p,
                                  words: p.words.filter((x) => x.id !== w.id),
                                })
                              }
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {!p.words.length && (
                          <p className="empty-text">
                            Genera los subtítulos o agrega tu primera palabra.
                          </p>
                        )}
                      </fieldset>
                      <button
                        disabled={busy}
                        className="add"
                        onClick={() => {
                          const start = p.words.at(-1)?.end || 0;
                          if (start >= p.duration)
                            return setError(
                              "No queda tiempo al final. Ajusta los tiempos existentes.",
                            );
                          edit({
                            ...p,
                            words: [
                              ...p.words,
                              {
                                id: crypto.randomUUID(),
                                text: "Palabra",
                                start,
                                end: Math.min(p.duration, start + 0.5),
                              },
                            ],
                          });
                        }}
                      >
                        ＋ Agregar palabra
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="panel-empty">
              <span>▤</span>
              <h3>Todo empieza con tu video</h3>
              <p>
                Sube un video o abre uno de tus proyectos para editar sus
                subtítulos.
              </p>
              <button onClick={() => setPanel("projects")}>
                Ver mis videos ↗
              </button>
            </div>
          )}
        </aside>
        <section
          className="studio-stage"
          aria-label="Vista previa y línea de tiempo"
        >
          {(message || error || download) && (
            <div className="stage-notices">
              {message && (
                <div className="status" role="status">
                  <span className={busy ? "pulse" : ""}>●</span>
                  {message}
                </div>
              )}
              {error && (
                <div className="error" role="alert">
                  {error}
                </div>
              )}
              {download && (
                <a className="download" href={download} download>
                  ↓ Descargar video exportado
                </a>
              )}
            </div>
          )}
          {p ? (
            <>
              <div className="stage-canvas">
                {panel === "cover" && (
                  <CoverPreview
                    safeGuide={coverGuideEnabled}
                    onGuideChange={setCoverGuideEnabled}
                    onBounds={measureCoverTitle}
                    key={p.id}
                    project={p}
                    disabled={busy}
                    onChange={(cover) => edit({ ...p, cover })}
                  />
                )}
                <div className="video-preview-slot" hidden={panel === "cover"}>
                  <PreviewViewport
                    key={p.id}
                    width={p.width}
                    height={p.height}
                    onGuideChange={setGuideEnabled}
                  >
                    {(scale) => (
                      <>
                        <Player
                          key={p.id}
                          ref={player}
                          component={CaptionVideo}
                          inputProps={{
                            project: p,
                            src: `/media/${p.id}/video.mp4`,
                          }}
                          durationInFrames={Math.max(
                            1,
                            Math.ceil(p.duration * 30),
                          )}
                          compositionWidth={p.width}
                          compositionHeight={p.height}
                          fps={30}
                          controls={false}
                          spaceKeyToPlayOrPause={false}
                          style={{ width: "100%", height: "100%" }}
                        />
                        <PreviewOverlay
                          safeGuide={safeGuide}
                          captionBounds={captionBounds}
                          onBounds={measureCaption}
                          viewScale={scale}
                          project={p}
                          player={player}
                          disabled={busy}
                          onChange={(style) => edit({ ...p, style })}
                        />
                      </>
                    )}
                  </PreviewViewport>
                </div>
              </div>
              <Timeline
                onEditWord={(id) => {
                  setSubtitleTab("text");
                  setTextEditRequest({ id });
                  setPanel("text");
                }}
                onChange={(words) => edit({ ...p, words })}
                key={p.id}
                project={p}
                player={player}
                disabled={busy}
              />
            </>
          ) : (
            <div className="studio-welcome">
              <div className="welcome-mark">
                Aa<span>✦</span>
              </div>
              <span className="eyebrow">TU VOZ, EN MOVIMIENTO</span>
              <h1>
                Haz que cada
                <br />
                palabra cuente.
              </h1>
              <p>
                Subtítulos animados. Tu estilo.
                <br />
                Todo desde tu computadora.
              </p>
              <label className="primary upload">
                ＋ Seleccionar video
                <input
                  type="file"
                  accept="video/*"
                  disabled={busy}
                  onChange={(e) => upload(e.target.files?.[0])}
                />
              </label>
              <button onClick={() => setPanel("projects")}>
                Abrir un proyecto
              </button>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
