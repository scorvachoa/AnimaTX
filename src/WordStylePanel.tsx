import React from "react";
import { fonts, Project, Word } from "./Video";
import { animations } from "./text-animations.mjs";
export function WordStylePanel({
  project,
  selected,
  onSelect,
  onChange,
  disabled,
}: {
  project: Project;
  selected: string;
  onSelect: (id: string) => void;
  onChange: (word: Word) => void;
  disabled: boolean;
}) {
  const word = project.words.find((w) => w.id === selected) ?? project.words[0];
  if (!word) return null;
  const set = (key: keyof NonNullable<Word["style"]>, value: unknown) => {
    const style = { ...word.style, [key]: value };
    onChange({ ...word, style });
  };
  return (
    <details className="word-style-panel">
      <summary>
        Resaltar una palabra <span>{word.text}</span>
      </summary>
      <fieldset disabled={disabled}>
        <label>
          Palabra
          <select value={word.id} onChange={(e) => onSelect(e.target.value)}>
            {project.words.map((w) => (
              <option key={w.id} value={w.id}>
                {w.text} · {w.start.toFixed(2)} s
              </option>
            ))}
          </select>
        </label>
        <div className="inline-form">
          <label>
            Color
            <input
              type="color"
              value={word.style?.color ?? project.style.color}
              onChange={(e) => set("color", e.target.value)}
            />
          </label>
          <label>
            Tamaño
            <input
              type="number"
              min="16"
              max="180"
              value={word.style?.fontSize ?? ""}
              placeholder="Heredar"
              onChange={(e) =>
                set("fontSize", e.target.value ? +e.target.value : undefined)
              }
            />
          </label>
        </div>
        <label>
          Tipografía
          <select
            value={word.style?.fontFamily ?? ""}
            onChange={(e) => set("fontFamily", e.target.value || undefined)}
          >
            <option value="">Heredar de la línea</option>
            {fonts.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
        <label>
          Animación de palabra
          <select
            value={word.style?.animation ?? ""}
            onChange={(e) => set("animation", e.target.value || undefined)}
          >
            <option value="">Heredar de la línea</option>
            {animations
              .filter(([id]) =>
                [
                  "none",
                  "karaoke",
                  "reveal",
                  "bounce",
                  "wave",
                  "typewriter",
                ].includes(id),
              )
              .map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
          </select>
        </label>
        <label>
          Mayúsculas
          <select
            value={
              word.style?.uppercase === undefined
                ? "inherit"
                : word.style.uppercase
                  ? "upper"
                  : "original"
            }
            onChange={(e) =>
              set(
                "uppercase",
                e.target.value === "inherit"
                  ? undefined
                  : e.target.value === "upper",
              )
            }
          >
            <option value="inherit">Heredar</option>
            <option value="upper">MAYÚSCULAS</option>
            <option value="original">Original</option>
          </select>
        </label>
        <button onClick={() => onChange({ ...word, style: undefined })}>
          Restablecer esta palabra
        </button>
      </fieldset>
    </details>
  );
}
