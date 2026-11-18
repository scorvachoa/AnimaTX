import React, { useState } from "react";
import { Project, Word } from "./Video";
import { importSubtitles, exportSubtitles } from "./subtitle-files.mjs";
export function SubtitleFiles({
  project,
  disabled,
  onImport,
}: {
  project: Project;
  disabled: boolean;
  onImport: (words: Word[]) => void;
}) {
  const [pending, setPending] = useState<{
      words: Word[];
      cues: number;
    } | null>(null),
    [error, setError] = useState("");
  function download(format: "srt" | "vtt") {
    const url = URL.createObjectURL(
      new Blob([exportSubtitles(project, format)], {
        type:
          format === "vtt"
            ? "text/vtt;charset=utf-8"
            : "application/x-subrip;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download =
      project.name
        .replace(/\.[^.]+$/, "")
        .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_") +
      "." +
      format;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <details className="subtitle-files">
      <summary>Importar / exportar SRT y VTT</summary>

      <label className="upload">
        Importar subtítulos
        <input
          type="file"
          accept=".srt,.vtt,text/vtt"
          disabled={disabled}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              if (file.size > 2000000)
                throw Error("El archivo supera los 2 MB.");
              setPending(importSubtitles(await file.text(), project.duration));
              setError("");
            } catch (e) {
              setError((e as Error).message);
              setPending(null);
            }
          }}
        />
      </label>
      <div className="inline-form">
        <button
          disabled={disabled || !project.words.length}
          onClick={() => download("srt")}
        >
          Exportar SRT
        </button>
        <button
          disabled={disabled || !project.words.length}
          onClick={() => download("vtt")}
        >
          Exportar VTT
        </button>
      </div>
      {pending && (
        <div className="import-preview">
          <p>
            {pending.cues} subtítulos · {pending.words.length} palabras
          </p>

          <button
            disabled={disabled}
            onClick={() => {
              onImport(pending.words);
              setPending(null);
            }}
          >
            Aplicar importación
          </button>
          <button onClick={() => setPending(null)}>Cancelar</button>
        </div>
      )}
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}
    </details>
  );
}
