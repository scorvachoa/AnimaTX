import React, { useEffect, useState } from "react";
import { Project, Word } from "./Video";
type Edit = { id: string; original: string; text: string; reason: string };
async function request(url: string, method = "GET", body?: unknown) {
  const r = await fetch("/api/gemini/" + url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw Error(j.error || "Error de Gemini");
  return j;
}
export function GeminiPanel({
  project,
  configured,
  language,
  busy,
  setBusy,
  onApply,
}: {
  project: Project;
  configured: boolean;
  language: string;
  busy: boolean;
  setBusy: (value: boolean) => void;
  onApply: (words: Word[]) => void;
}) {
  const [edits, setEdits] = useState<Edit[]>([]),
    [reviewing, setReviewing] = useState(false),
    [useScript, setUseScript] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [undo, setUndo] = useState<{ before: Word[]; after: string } | null>(null);
  useEffect(() => {
    setEdits([]);
    setUndo(null);
    setMessage("");
    setError("");
    setUseScript(false);
  }, [project.id]);
  async function review() {
    setReviewing(true);
    setBusy(true);
    setError("");
    setEdits([]);
    setMessage("Gemini está revisando el texto…");
    try {
      const r = await request("review", "POST", {
        project,
        language,
        useScript: useScript && !!project.script?.trim(),
      });
      setEdits(r.edits);
      setMessage(
        r.edits.length
          ? `${r.edits.length} correcciones propuestas. Revisa antes de aplicar.`
          : "Gemini no propuso correcciones.",
      );
    } catch (e) {
      setError((e as Error).message);
      setMessage("");
    } finally {
      setReviewing(false);
      setBusy(false);
    }
  }
  const valid = (e: Edit) =>
    project.words.some((w) => w.id === e.id && w.text === e.original);
  function apply(selected: Edit[]) {
    const changes = new Map(selected.filter(valid).map((e) => [e.id, e.text]));
    const next = project.words.map((w) =>
      changes.has(w.id) ? { ...w, text: changes.get(w.id)! } : w,
    );
    setUndo({ before: project.words, after: JSON.stringify(next) });
    onApply(next);
    setEdits((list) => list.filter((e) => !changes.has(e.id)));
    setMessage("Correcciones aplicadas.");
  }
  return (
    <section className="gemini-panel ai-review-panel" aria-busy={reviewing}>
      <div className="ai-review-heading">
        <h3>Revisar subtítulos</h3>
        <span>{project.words.length} palabras</span>
      </div>

      <button
        className="ai-review-start"
        disabled={busy || !configured || !project.words.length}
        onClick={review}
      >
        {reviewing ? "◌ Revisando…" : "✦ Revisar texto"}
      </button>
      {project.script?.trim() && (
        <label className="reference-checkbox ai-script-toggle">
          <input
            type="checkbox"
            disabled={busy}
            checked={useScript}
            onChange={(e) => {
              setUseScript(e.target.checked);
              setEdits([]);
            }}
          />
          Incluir guion original en Gemini
        </label>
      )}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <p className="hint" role="status">
          {message}
        </p>
      )}
      {edits.length > 0 && (
        <>
          <div className="ai-results-heading">
            <h3>Correcciones</h3>
            <span>{edits.length} pendientes</span>
          </div>
          <div className="review-actions">
            <button
              className="ai-accept-all"
              disabled={busy || !edits.some(valid)}
              onClick={() => apply(edits)}
            >
              Aceptar todas
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setEdits([]);
                setMessage("Propuestas descartadas.");
              }}
            >
              Descartar
            </button>
          </div>
          {edits.map((e, index) => (
            <div
              className={`correction ai-correction ${valid(e) ? "" : "outdated"}`}
              key={e.id}
            >
              <div className="ai-correction-number">
                CAMBIO {String(index + 1).padStart(2, "0")}
              </div>
              <div className="ai-comparison">
                <div>
                  <span>Original</span>
                  <del>{e.original}</del>
                </div>
                <div>
                  <span>Propuesta</span>
                  <strong>{e.text}</strong>
                </div>
              </div>
              <p>{e.reason}</p>
              {!valid(e) && (
                <small>Esta palabra cambió; vuelve a revisar el texto.</small>
              )}
              <div className="ai-correction-actions">
                <button disabled={busy || !valid(e)} onClick={() => apply([e])}>
                  ✓ Aceptar
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    setEdits((list) => list.filter((x) => x.id !== e.id))
                  }
                >
                  × Rechazar
                </button>
              </div>
            </div>
          ))}
        </>
      )}
      {undo && (
        <button
          disabled={busy || JSON.stringify(project.words) !== undo.after}
          onClick={() => {
            onApply(undo.before);
            setUndo(null);
            setEdits([]);
            setMessage("Última aplicación deshecha.");
          }}
        >
          Deshacer última aplicación
        </button>
      )}
    </section>
  );
}
