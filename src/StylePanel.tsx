import React, { useState } from "react";
import { PanelTabs } from "./PanelTabs";
import { Project } from "./Video";
type Style = Project["style"];
import { LineTextControls } from "./LineTextControls";
import { secondAppearanceDefaults } from "./text-appearance.mjs";
import {
  CaptionBounds,
  positionOffset,
  offsetPosition,
  constrainPosition,
  alignPosition,
  positionBounds,
} from "./caption-position.mjs";
export function StylePanel({
  style: s,
  onChange,
  disabled,
  safeGuide = false,
  captionBounds = { halfWidth: 0, halfHeight: 0 },
  section: persistedSection,
  onSectionChange,
  selectedLine: persistedLine,
  onLineChange,
}: {
  style: Style;
  onChange: (s: Style) => void;
  disabled: boolean;
  safeGuide?: boolean;
  captionBounds?: CaptionBounds;
  section?: string;
  onSectionChange?: (value: string) => void;
  selectedLine?: string;
  onLineChange?: (value: string) => void;
}) {
  const [localSection, setLocalSection] = useState("text");
  const [localLine, setLocalLine] = useState("upper");
  const section = persistedSection ?? localSection,
    selectedLine = persistedLine ?? localLine;
  const setSection = onSectionChange ?? setLocalSection,
    setSelectedLine = onLineChange ?? setLocalLine;
  const position = { x: s.x ?? 50, y: s.y };
  const setPosition = (next: { x: number; y: number }) =>
    onChange({ ...s, ...constrainPosition(next, safeGuide, captionBounds) });
  const positionControl = (axis: "x" | "y") => {
    const labels =
      axis === "x"
        ? ["Izquierda", "Centro", "Derecha"]
        : ["Arriba", "Centro", "Abajo"];
    const offset = positionOffset(axis, position[axis]);
    return (
      <div className="caption-position-control">
        <label>
          {axis === "x" ? "Posición horizontal" : "Posición vertical"}
          <output>
            {offset > 0 ? "+" : ""}
            {offset.toFixed(1)}
          </output>
          <input
            type="range"
            min="-45"
            max="45"
            step="0.1"
            value={offset}
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                  event.key,
                )
              )
                return;
              event.preventDefault();
              const delta =
                (event.key === "ArrowLeft" || event.key === "ArrowDown"
                  ? -1
                  : 1) * (event.shiftKey ? 10 : 1);
              setPosition({
                ...position,
                [axis]: offsetPosition(
                  axis,
                  Math.max(-45, Math.min(45, offset + delta)),
                  false,
                ),
              });
            }}
            onChange={(e) =>
              setPosition({
                ...position,
                [axis]: offsetPosition(axis, +e.target.value),
              })
            }
            aria-label={
              axis === "x" ? "Posición horizontal" : "Posición vertical"
            }
          />
        </label>
        <div className="caption-align-buttons">
          {(["start", "center", "end"] as const).map((alignment, i) => (
            <button
              key={alignment}
              type="button"
              aria-label={`${labels[i]} ${axis === "x" ? "horizontal" : "vertical"}`}
              onClick={() =>
                setPosition(
                  alignPosition(
                    position,
                    axis,
                    alignment,
                    safeGuide,
                    captionBounds,
                  ),
                )
              }
            >
              {labels[i]}
            </button>
          ))}
        </div>
      </div>
    );
  };
  const set = (key: keyof Style, value: unknown) =>
    onChange({
      ...s,
      ...(s.twoLines
        ? {
            ...secondAppearanceDefaults(s),
            secondFontSize: s.secondFontSize ?? s.fontSize,
            secondColor: s.secondColor ?? s.color,
            secondActiveColor: s.secondActiveColor ?? s.activeColor,
            secondOutline: s.secondOutline ?? s.outline,
            secondAnimation: s.secondAnimation ?? s.animation,
            secondLetterSpacing: s.secondLetterSpacing ?? s.letterSpacing ?? 0,
            secondUppercase: s.secondUppercase ?? s.uppercase ?? false,
          }
        : {}),
      [key]: value,
    });
  const slider = (
    key: keyof Style,
    title: string,
    value: number,
    min: number,
    max: number,
    step = 1,
  ) => (
    <label>
      {title}
      <output>{value}</output>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => set(key, +e.target.value)}
      />
    </label>
  );
  function line(second: boolean) {
    return (
      <section
        id="style-line-content"
        role={s.twoLines ? "tabpanel" : undefined}
        className="style-card line-settings"
        aria-label={second ? "Línea inferior" : "Línea superior"}
      >
        <div className="style-card-title">
          <h3>
            {s.twoLines
              ? second
                ? "Línea inferior"
                : "Línea superior"
              : "Texto"}
          </h3>
        </div>
        <LineTextControls style={s} second={second} onSet={set} />
      </section>
    );
  }
  return (
    <fieldset
      disabled={disabled}
      className={`organized-styles style-mode-${section}`}
    >
      <PanelTabs
        label="Personalización de estilo"
        items={[
          ["layout", "Diseño"],
          ["text", "Texto"],
          ["position", "Posición"],
        ]}
        value={section}
        onChange={setSection}
        panelIds={{
          layout: "style-section-content",
          text: "style-section-content",
          position: "style-section-content",
        }}
      />
      <div
        id="style-section-content"
        role="tabpanel"
        aria-label={
          {
            layout: "Diseño",
            text: "Texto",
            animation: "Animación",
            position: "Posición",
          }[section] ?? section
        }
      >
        <label
          hidden={section !== "text"}
          className="caption-punctuation-toggle"
        >
          <span className="punctuation-option-icon" aria-hidden="true">
            Aa<span>·</span>
          </span>
          <span className="punctuation-option-label">
            <span>Ocultar puntuación</span>
            <span className="punctuation-symbols" aria-hidden="true">
              {[".", ",", ";", ":"].map((symbol) => (
                <span key={symbol}>{symbol}</span>
              ))}
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            aria-label="Ocultar puntuación (. , ; :)"
            checked={s.hidePunctuation ?? false}
            onChange={(event) => set("hidePunctuation", event.target.checked)}
          />
        </label>
        <div hidden={section !== "layout"}>
          <label>
            Diseño
            <select
              value={s.twoLines ? "double" : "single"}
              onChange={(e) => {
                if (e.target.value === "double")
                  onChange({
                    ...s,
                    twoLines: true,
                    wordsPerBlock: Math.max(2, s.wordsPerBlock),
                    secondFontSize: s.secondFontSize ?? s.fontSize,
                    secondColor: s.secondColor ?? s.color,
                    secondActiveColor: s.secondActiveColor ?? s.activeColor,
                    secondOutline: s.secondOutline ?? s.outline,
                    secondAnimation: s.secondAnimation ?? s.animation,
                    secondLetterSpacing:
                      s.secondLetterSpacing ?? s.letterSpacing ?? 0,
                    secondUppercase: s.secondUppercase ?? s.uppercase ?? false,
                  });
                else onChange({ ...s, twoLines: false });
              }}
            >
              <option value="single">Una línea / ajuste automático</option>
              <option value="double">Dos líneas</option>
            </select>
          </label>
        </div>
        <div hidden={section !== "text"}>
          {s.twoLines && (
            <PanelTabs
              label="Línea del subtítulo"
              items={[
                ["upper", "Superior"],
                ["lower", "Inferior"],
              ]}
              value={selectedLine}
              onChange={setSelectedLine}
              panelIds={{
                upper: "style-line-content",
                lower: "style-line-content",
              }}
            />
          )}
          {line(!!s.twoLines && selectedLine === "lower")}
        </div>
        <section
          className="style-card block-settings"
          hidden={section !== "position" && section !== "layout"}
        >
          <div hidden={section !== "position"}>
            <div className="style-card-title">
              <div>
                <h3>Bloque completo</h3>
              </div>
            </div>
            {positionControl("y")}
            {positionControl("x")}
            {safeGuide && (
              <span className="caption-safe-badge">Zona segura activa</span>
            )}
            {safeGuide &&
              !positionBounds(
                true,
                captionBounds.halfWidth,
                captionBounds.halfHeight,
                s.y,
                captionBounds,
              ).fits && (
                <p role="status" className="caption-safe-warning">
                  El bloque supera la zona segura. Reduce el tamaño del texto.
                </p>
              )}
            {s.twoLines && (
              <>
                {" "}
                {slider(
                  "lineGap",
                  "Separación entre líneas",
                  s.lineGap ?? 0,
                  -20,
                  150,
                )}
              </>
            )}
          </div>
          <div hidden={section !== "layout"}>
            {slider(
              "wordsPerBlock",
              "Palabras por bloque",
              s.wordsPerBlock,
              s.twoLines ? 2 : 1,
              8,
            )}
            {s.twoLines && (
              <>
                <label>
                  Palabras en línea superior
                  <select
                    value={s.firstLineWords ?? "auto"}
                    onChange={(e) =>
                      set(
                        "firstLineWords",
                        e.target.value === "auto" ? undefined : +e.target.value,
                      )
                    }
                  >
                    <option value="auto">Separación automática</option>
                    {Array.from(
                      { length: Math.max(1, s.wordsPerBlock - 1) },
                      (_, i) => (
                        <option key={i} value={i + 1}>
                          {i + 1}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </>
            )}
          </div>
        </section>
      </div>
    </fieldset>
  );
}
