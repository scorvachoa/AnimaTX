import { lineAppearance } from "./text-appearance.mjs";
import { LineTextControls } from "./LineTextControls";
import { getCoverLines, CoverLine } from "./cover-lines.mjs";
import React, { useState } from "react";
import { PanelTabs } from "./PanelTabs";
import { Project } from "./Video";
import {
  CaptionBounds,
  positionOffset,
  offsetPosition,
  constrainPosition,
  alignPosition,
} from "./caption-position.mjs";
import {
  CoverSettings,
  coverDefaults,
  coverTemplates,
  applyCoverTemplate,
} from "./cover.mjs";
export function CoverPanel({
  project,
  selectedLine,
  onSelectLine,
  disabled,
  onChange,
  safeGuide = false,
  titleBounds = { halfWidth: 20, halfHeight: 5 },
  section: persistedSection,
  onSectionChange,
}: {
  project: Project;
  selectedLine: number[];
  onSelectLine: (index: number | null, additive?: boolean) => void;
  disabled: boolean;
  onChange: (cover: CoverSettings) => void;
  safeGuide?: boolean;
  titleBounds?: CaptionBounds;
  section?: string;
  onSectionChange?: (value: string) => void;
}) {
  const [localSection, setLocalSection] = useState("template");
  const section = persistedSection ?? localSection,
    setSection = onSectionChange ?? setLocalSection;
  const c = { ...coverDefaults, ...project.cover };
  const lines = getCoverLines(c);
  const activeLine =
    selectedLine.filter((index) => index < lines.length).at(-1) ?? null;
  const updateLine = (index: number, patch: Partial<CoverLine>) => {
    const next = lines.map((line, i) =>
      i === index ? { ...line, ...patch } : line,
    );
    onChange({
      ...c,
      lines: next,
      title: next.map((line) => line.text).join("\n"),
    });
  };
  const updateSelection = (patch: Partial<CoverLine>) => {
    const next = lines.map((line, index) =>
      selectedLine.includes(index) ? { ...line, ...patch } : line,
    );
    onChange({
      ...c,
      lines: next,
      title: next.map((line) => line.text).join("\n"),
    });
  };
  const set = (key: keyof CoverSettings, value: unknown) =>
    onChange({ ...c, [key]: value });
  const position = { x: c.x, y: c.y };
  const setPosition = (next: { x: number; y: number }) =>
    onChange({ ...c, ...constrainPosition(next, safeGuide, titleBounds) });
  const positionControl = (axis: "x" | "y") => {
    const labels =
      axis === "x"
        ? ["Izquierda", "Centro", "Derecha"]
        : ["Arriba", "Centro", "Abajo"];
    const offset = positionOffset(axis, c[axis]);
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
            onChange={(e) =>
              setPosition({
                ...position,
                [axis]: offsetPosition(axis, +e.target.value),
              })
            }
            onKeyDown={(e) => {
              if (
                !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                  e.key,
                )
              )
                return;
              e.preventDefault();
              const delta =
                (e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 1) *
                (e.shiftKey ? 10 : 1);
              setPosition({
                ...position,
                [axis]: offsetPosition(
                  axis,
                  Math.max(-45, Math.min(45, offset + delta)),
                  false,
                ),
              });
            }}
            aria-label={
              axis === "x"
                ? "Posición horizontal del título"
                : "Posición vertical del título"
            }
          />
        </label>
        <div className="caption-align-buttons">
          {(["start", "center", "end"] as const).map((alignment, i) => (
            <button
              type="button"
              key={alignment}
              aria-label={`${labels[i]} ${axis === "x" ? "horizontal" : "vertical"}`}
              onClick={() =>
                setPosition(
                  alignPosition(
                    position,
                    axis,
                    alignment,
                    safeGuide,
                    titleBounds,
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
  const range = (
    key: keyof CoverSettings,
    label: string,
    min: number,
    max: number,
    step = 1,
  ) => (
    <label className="cover-field">
      {label}
      <output>{Number(c[key]).toFixed(step < 1 ? 2 : 0)}</output>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Number(c[key])}
        onChange={(e) => set(key, +e.target.value)}
      />
    </label>
  );
  return (
    <fieldset className="cover-panel" disabled={disabled}>
      <PanelTabs
        label="Opciones de miniatura"
        items={[
          ["template", "Plantilla"],
          ["title", "Título"],
          ["crop", "Encuadre"],
        ]}
        value={section}
        onChange={setSection}
        panelIds={{
          template: "cover-template",
          title: "cover-title",
          crop: "cover-crop",
        }}
      />
      <div
        id="cover-template"
        role="tabpanel"
        aria-label="Plantilla"
        hidden={section !== "template"}
      >
        <div className="cover-template-list">
          {coverTemplates.map((t) => (
            <button
              type="button"
              key={t.id}
              className={`cover-preset-card cover-preset-${t.id}`}
              aria-label={`Aplicar portada ${t.name}`}
              aria-pressed={c.template === t.id}
              onClick={() => {
                onSelectLine(null);
                onChange(applyCoverTemplate(c, t));
              }}
            >
              <span className="cover-preset-sample" aria-hidden="true">
                {t.style.lines?.map((line, i) => (
                  <span
                    key={i}
                    className="cover-preset-line"
                    style={{
                      fontFamily: line.fontFamily,
                      fontSize: line.fontSize / 6.5,
                      color: line.color,
                      fontWeight: line.bold === false ? 400 : 900,
                      fontStyle: line.italic ? "italic" : "normal",
                      letterSpacing: (line.letterSpacing ?? 0) / 6.5,
                      background: t.style.textBackground
                        ? t.style.background
                        : undefined,
                      textShadow: line.shadowEnabled
                        ? "0 1px 4px #0009"
                        : "none",
                    }}
                  >
                    {line.text}
                  </span>
                ))}
                <span className="cover-line-count">
                  {t.style.lines?.length}{" "}
                  {t.style.lines?.length === 1 ? "línea" : "líneas"}
                </span>
              </span>
              <span className="cover-preset-name">{t.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div
        id="cover-title"
        role="tabpanel"
        aria-label="Título"
        hidden={section !== "title"}
      >
        <div
          className="cover-layer-list"
          role="group"
          aria-label="Textos de miniatura"
        >
          {lines.map((line, i) => (
            <button
              type="button"
              key={i}
              aria-pressed={selectedLine.includes(i)}
              onClick={(event) =>
                onSelectLine(i, event.ctrlKey || event.metaKey)
              }
              title={line.text || "Texto vacío"}
            >
              <span className="cover-layer-number">{i + 1}</span>
              <span>{line.text || "Texto vacío"}</span>
            </button>
          ))}
        </div>
        {activeLine === null ? (
          <div className="cover-selection-empty">
            Selecciona un texto en la vista previa
          </div>
        ) : (
          <>
            <div className="cover-selected-heading">
              <strong>
                {selectedLine.length > 1
                  ? selectedLine.length + " textos seleccionados"
                  : "Texto seleccionado"}
              </strong>
              <button
                type="button"
                aria-label="Deseleccionar texto"
                onClick={() => onSelectLine(null)}
              >
                ×
              </button>
            </div>
            {selectedLine.length === 1 && (
              <label className="cover-line-input active">
                <span>Texto</span>
                <input
                  type="text"
                  aria-label={"Texto de línea " + (activeLine + 1)}
                  value={lines[activeLine].text}
                  maxLength={Math.max(
                    0,
                    160 -
                      (lines.length - 1) -
                      lines.reduce(
                        (n, item, index) =>
                          n + (index === activeLine ? 0 : item.text.length),
                        0,
                      ),
                  )}
                  onChange={(event) =>
                    updateLine(activeLine, { text: event.target.value })
                  }
                />
              </label>
            )}
            {selectedLine.length > 1 && (
              <p className="cover-multi-note">
                Los cambios de estilo se aplican a todos. Se muestran los
                valores del último texto seleccionado.
              </p>
            )}
            <div className="settings cover-line-settings">
              <LineTextControls
                staticImage
                second={false}
                lineLabel={"línea " + (activeLine + 1)}
                style={{
                  ...project.style,
                  ...lines[activeLine],
                  ...lineAppearance(lines[activeLine]),
                }}
                onSet={(key, value) => updateSelection({ [key]: value })}
              />
              <button
                type="button"
                onClick={() => updateSelection({ offsetX: 0, offsetY: 0 })}
              >
                Restablecer posición del texto
              </button>
            </div>
          </>
        )}
        <section className="cover-block-settings">
          <h4>Bloque completo</h4>
          <div className="cover-colors">
            <label>
              Fondo
              <input
                type="color"
                value={c.background}
                onChange={(event) => set("background", event.target.value)}
              />
            </label>
          </div>
          <label className="cover-checkbox">
            <input
              type="checkbox"
              checked={c.textBackground}
              onChange={(e) => set("textBackground", e.target.checked)}
            />{" "}
            Fondo del título
          </label>
          {positionControl("y")}
          {positionControl("x")}
          {safeGuide && (
            <span className="caption-safe-badge">Zona segura activa</span>
          )}
        </section>
      </div>
      <div
        id="cover-crop"
        role="tabpanel"
        aria-label="Encuadre"
        hidden={section !== "crop"}
      >
        {range("zoom", "Zoom", 1, 4, 0.05)}
        {range("offsetX", "Desplazamiento horizontal", -100, 100)}
        {range("offsetY", "Desplazamiento vertical", -100, 100)}
        <button
          type="button"
          onClick={() => onChange({ ...c, zoom: 1, offsetX: 0, offsetY: 0 })}
        >
          Restablecer encuadre
        </button>
      </div>
    </fieldset>
  );
}
