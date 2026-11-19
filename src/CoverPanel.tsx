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
  disabled,
  onChange,
  onCapture,
  safeGuide = false,
  titleBounds = { halfWidth: 20, halfHeight: 5 },
  section: persistedSection,
  onSectionChange,
}: {
  project: Project;
  disabled: boolean;
  onChange: (cover: CoverSettings) => void;
  onCapture: () => void;
  safeGuide?: boolean;
  titleBounds?: CaptionBounds;
  section?: string;
  onSectionChange?: (value: string) => void;
}) {
  const [localSection, setLocalSection] = useState("frame");
  const section = persistedSection ?? localSection,
    setSection = onSectionChange ?? setLocalSection;
  const c = { ...coverDefaults, ...project.cover };
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
          ["frame", "Fotograma"],
          ["template", "Plantilla"],
          ["title", "Título"],
          ["crop", "Encuadre"],
        ]}
        value={section}
        onChange={setSection}
        panelIds={{
          frame: "cover-frame",
          template: "cover-template",
          title: "cover-title",
          crop: "cover-crop",
        }}
      />
      <div
        id="cover-frame"
        role="tabpanel"
        aria-label="Fotograma"
        hidden={section !== "frame"}
      >
        <button type="button" className="cover-capture" onClick={onCapture}>
          ▣ Usar fotograma actual del video
        </button>
        {range(
          "time",
          "Instante (s)",
          0,
          Math.max(0, project.duration - 1 / 30),
          1 / 30,
        )}
      </div>
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
              onClick={() => onChange(applyCoverTemplate(c, t))}
            >
              <span
                className="cover-preset-sample"
                aria-hidden="true"
                style={{ fontFamily: t.style.fontFamily, color: t.style.color }}
              >
                <span
                  style={{
                    background: t.style.textBackground
                      ? t.style.background
                      : undefined,
                  }}
                >
                  Tu próxima
                  <br />
                  historia
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
        <textarea
          aria-label="Título de portada"
          maxLength={160}
          rows={4}
          value={c.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Escribe tu título"
        />
        <label className="cover-field">
          Tipografía
          <select
            value={c.fontFamily}
            onChange={(e) => set("fontFamily", e.target.value)}
          >
            {["Impact", "Arial", "Georgia", "Segoe Print"].map((font) => (
              <option key={font}>{font}</option>
            ))}
          </select>
        </label>
        {range("fontSize", "Tamaño", 24, 180)}
        <div className="cover-colors">
          {(["color", "outline", "background"] as const).map((key, i) => (
            <label key={key}>
              {["Texto", "Borde", "Fondo"][i]}
              <input
                type="color"
                value={c[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </label>
          ))}
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
