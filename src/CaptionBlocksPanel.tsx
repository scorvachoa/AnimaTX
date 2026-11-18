import React, { useState } from "react";
import { Project, Word } from "./Video";
import { captionBlocks, editCaptionBlocks } from "./caption-blocks.mjs";
export function CaptionBlocksPanel({
  project,
  disabled,
  onChange,
  onSeek,
}: {
  project: Project;
  disabled: boolean;
  onChange: (words: Word[]) => void;
  onSeek: (seconds: number) => void;
}) {
  const [cuts, setCuts] = useState<Record<string, string>>({});
  const blocks = captionBlocks(project.words, project.style.wordsPerBlock);
  return (
    <details className="caption-block-panel">
      <summary>Frases y bloques · {blocks.length}</summary>
      <p>
        Al ajustar un bloque se fijan los cortes actuales. Se conservan al
        cambiar la plantilla. Puedes deshacer con Ctrl + Z.
      </p>
      <button
        disabled={disabled || !project.words.some((w) => w.cueId)}
        onClick={() =>
          onChange(
            editCaptionBlocks(
              project.words,
              project.style.wordsPerBlock,
              "auto",
            ),
          )
        }
      >
        Restablecer agrupación automática
      </button>
      <fieldset disabled={disabled}>
        {blocks.map((block, i) => {
          const id = block[0].id;
          const cut = block.slice(0, -1).some((w) => w.id === cuts[id])
            ? cuts[id]
            : id;
          return (
            <div className="caption-block-card" key={id}>
              <button
                className="caption-block-seek"
                onClick={() => onSeek(block[0].start)}
                title="Ver esta frase en el video"
              >
                {i + 1}. {block.map((w) => w.text).join(" ")}
              </button>
              <small>
                {block[0].start.toFixed(2)} – {block.at(-1)!.end.toFixed(2)} s ·{" "}
                {block[0].cueId ? "Cortes fijados" : "Automático"}
              </small>
              <div className="caption-block-actions">
                {block.length > 1 && (
                  <>
                    <select
                      aria-label={`Dividir frase ${i + 1} después de`}
                      value={cut}
                      onChange={(e) =>
                        setCuts({ ...cuts, [id]: e.target.value })
                      }
                    >
                      {block.slice(0, -1).map((w, j) => (
                        <option key={w.id} value={w.id}>
                          Después de {j + 1}: {w.text}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() =>
                        onChange(
                          editCaptionBlocks(
                            project.words,
                            project.style.wordsPerBlock,
                            "split",
                            cut,
                          ),
                        )
                      }
                    >
                      Dividir
                    </button>
                  </>
                )}
                {i < blocks.length - 1 && (
                  <button
                    onClick={() =>
                      onChange(
                        editCaptionBlocks(
                          project.words,
                          project.style.wordsPerBlock,
                          "join",
                          id,
                        ),
                      )
                    }
                  >
                    Unir con siguiente
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {!blocks.length && <p>Sin subtítulos.</p>}
      </fieldset>
    </details>
  );
}
