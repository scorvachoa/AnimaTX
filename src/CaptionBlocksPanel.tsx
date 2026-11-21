import {
  blockTextKey,
  editCaptionText,
  splitCaptionText,
} from "./edit-caption-text.mjs";
import React, { useEffect, useRef, useState } from "react";
import { Project, Word } from "./Video";
import { captionBlocks, editCaptionBlocks } from "./caption-blocks.mjs";
function PhraseText({
  text,
  index,
  onEdit,
  onSplit,
  inputRef,
  onSeek,
}: {
  text: string;
  index: number;
  onEdit: (value: string) => string;
  onSplit: (value: string, cursor: number) => string;
  inputRef: (node: HTMLInputElement | null) => void;
  onSeek: () => void;
}) {
  const expectedText = useRef(text);
  const [draft, setDraft] = useState(text);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!focused || text !== expectedText.current) {
      setDraft(text);
      setError("");
    }
    expectedText.current = text;
  }, [text, focused]);
  return (
    <>
      <input
        type="text"
        ref={inputRef}
        className="caption-phrase-input"
        value={draft}
        aria-label={"Texto de frase " + (index + 1)}
        onFocus={() => setFocused(true)}
        onClick={onSeek}
        onChange={(event) => {
          const value = event.target.value;
          expectedText.current = value
            .trim()
            .split(/\s+/u)
            .filter(Boolean)
            .join(" ");
          setDraft(value);
          setError(value.trim() ? onEdit(value) : "");
        }}
        onBlur={() => {
          if (!draft.trim()) {
            const message = onEdit("");
            if (message) {
              setError(message);
              return;
            }
          }
          setFocused(false);
          setDraft(text);
          setError("");
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            if (!draft.trim()) {
              event.currentTarget.blur();
              return;
            }
            setError(
              onSplit(
                draft,
                event.currentTarget.selectionStart ?? draft.length,
              ),
            );
          }
          if (event.key === "Escape") {
            event.currentTarget.blur();
            event.stopPropagation();
          }
        }}
      />
      {error && (
        <small role="alert" className="error">
          {error}
        </small>
      )}
    </>
  );
}
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
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const [focusKey, setFocusKey] = useState<string | null>(null);
  useEffect(() => {
    if (!focusKey) return;
    const input = inputs.current.get(focusKey);
    if (input) {
      input.focus();
      input.setSelectionRange(0, 0);
      setFocusKey(null);
    }
  }, [project.words, focusKey]);
  const blocks = captionBlocks(project.words, project.style.wordsPerBlock);
  return (
    <details className="caption-block-panel" open>
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
          const textKey = blockTextKey(block);
          return (
            <div className="caption-block-card" key={textKey}>
              <PhraseText
                onSeek={() => onSeek(block[0].start)}
                text={block.map((word) => word.text).join(" ")}
                index={i}
                inputRef={(node) => {
                  if (node) inputs.current.set(textKey, node);
                  else inputs.current.delete(textKey);
                }}
                onSplit={(text, cursor) => {
                  try {
                    const result = splitCaptionText(
                      project.words,
                      project.style.wordsPerBlock,
                      textKey,
                      text,
                      cursor,
                    );
                    if (result.focusKey) {
                      setFocusKey(result.focusKey);
                      onChange(result.words);
                    }
                    return "";
                  } catch (error) {
                    return (error as Error).message;
                  }
                }}
                onEdit={(text) => {
                  try {
                    const result = editCaptionText(
                      project.words,
                      project.style.wordsPerBlock,
                      textKey,
                      text,
                    );
                    if (result.words !== project.words) onChange(result.words);
                    return "";
                  } catch (error) {
                    return (error as Error).message;
                  }
                }}
              />
              <small>
                {block[0].start.toFixed(2)} – {block.at(-1)!.end.toFixed(2)} s ·{" "}
                {block[0].cueId ? "Cortes fijados" : "Automático"}
              </small>
              <div className="caption-block-actions">
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
