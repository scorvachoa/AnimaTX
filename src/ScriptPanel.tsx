import React, { useEffect, useState } from "react";
import { Project, Word } from "./Video";
import { adaptScript } from "./adapt-script.mjs";
import { compareScript, ComparisonPart } from "./compare-script.mjs";
export function ScriptPanel({
  project,
  disabled,
  onChange,
  onSeek,
  onApply,
  onAlign,
}: {
  project: Project;
  disabled: boolean;
  onChange: (script: string) => void;
  onSeek: (seconds: number) => void;
  onApply: (words: Word[]) => void;
  onAlign: () => void;
}) {
  const [parts, setParts] = useState<ComparisonPart[] | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [undo, setUndo] = useState<{ before: Word[]; after: string } | null>(null);
  useEffect(() => {
    setUndo(null);
    setNotice("");
  }, [project.id]);
  const fingerprint = JSON.stringify(project.words.map((w) => [w.id, w.text]));
  useEffect(() => {
    setParts(null);
    setError("");
  }, [project.id, project.script, fingerprint]);
  const changes = parts?.filter((p) => p.kind === "change") ?? [];
  return (
    <details className="script-panel" open>
      <summary>
        Guion original <span>Texto definitivo</span>
      </summary>

      <label className="script-label">
        Guion
        <textarea
          disabled={disabled}
          maxLength={20000}
          rows={6}
          value={project.script ?? ""}
          placeholder="Pega aquí el guion original…"
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      <div className="script-actions">
        <button
          disabled={disabled || !project.script?.trim()}
          onClick={onAlign}
        >
          Alinear guion con el audio
        </button>
        <button
          className="primary"
          disabled={
            disabled || !project.script?.trim() || !project.words.length
          }
          onClick={() => {
            try {
              const adapted = adaptScript(
                project.script ?? "",
                project.words,
                project.duration,
              );
              setUndo({
                before: project.words,
                after: JSON.stringify(adapted.words),
              });
              onApply(adapted.words);
              setNotice(
                adapted.estimated
                  ? "Subtítulos adaptados al guion original. Los tiempos de los fragmentos modificados son estimados: revisa el video y guarda los cambios."
                  : "Subtítulos adaptados al guion original, conservando los tiempos existentes. Guarda los cambios.",
              );
              setError("");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          Adaptar subtítulos al guion
        </button>
        <button
          disabled={
            disabled || !project.script?.trim() || !project.words.length
          }
          onClick={() => {
            try {
              setParts(compareScript(project.script ?? "", project.words));
              setError("");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          Contrastar con transcripción
        </button>
        <small>{(project.script ?? "").length} / 20 000 caracteres</small>
      </div>

      {notice && (
        <p className="hint" role="status">
          {notice}
        </p>
      )}
      {undo && (
        <button
          disabled={disabled || JSON.stringify(project.words) !== undo.after}
          onClick={() => {
            onApply(undo.before);
            setUndo(null);
            setNotice("Adaptación deshecha.");
          }}
        >
          Deshacer adaptación
        </button>
      )}

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {parts && (
        <>
          <p className="hint" role="status">
            {changes.length
              ? `${changes.length} fragmentos con diferencias. Haz clic en «Ir al video» para revisar lo que se dice.`
              : "El guion y la transcripción coinciden."}
          </p>
          <div className="comparison-heading">
            <b>Guion</b>
            <b>Transcripción</b>
          </div>
          <div className="comparison-list">
            {parts.map((part, index) => (
              <div className={`comparison-row ${part.kind}`} key={index}>
                <div>
                  {part.reference.join(" ") || <em>No aparece en el guion</em>}
                </div>
                <div>
                  {part.transcript.join(" ") || (
                    <em>Falta en la transcripción</em>
                  )}
                  {part.kind === "change" && project.words[part.wordIndex] && (
                    <button
                      disabled={disabled}
                      onClick={() =>
                        onSeek(project.words[part.wordIndex].start)
                      }
                    >
                      Ir al video ·{" "}
                      {project.words[part.wordIndex].start.toFixed(2)} s
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </details>
  );
}
