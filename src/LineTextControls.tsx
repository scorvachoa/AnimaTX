import React from "react";
import { fonts, Project } from "./Video";
import { animations } from "./text-animations.mjs";
import { lineAppearance } from "./text-appearance.mjs";
type Style = Project["style"];
export function LineTextControls({
  style: s,
  second,
  onSet,
  staticImage = false,
  lineLabel,
}: {
  staticImage?: boolean;
  lineLabel?: string;
  style: Style;
  second: boolean;
  onSet: (key: keyof Style, value: unknown) => void;
}) {
  const key = (name: string) =>
    (second
      ? "second" + name[0].toUpperCase() + name.slice(1)
      : name) as keyof Style;
  const appearance = lineAppearance(s, second);
  const get = (name: string, fallback: unknown) =>
    s[key(name)] ?? s[name as keyof Style] ?? fallback;
  const range = (
    name: string,
    label: string,
    value: number,
    min: number,
    max: number,
    step = 1,
  ) => (
    <label>
      {label}
      <output>
        {name.endsWith("Opacity")
          ? Math.round(value * 100) + "%"
          : value.toFixed(step < 1 ? 1 : 0)}
      </output>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onSet(key(name), +event.target.value)}
      />
    </label>
  );
  const color = (name: string, label: string, value: string) => (
    <label className="text-color-control">
      <span>{label}</span>
      <input
        type="color"
        value={value}
        aria-label={`${label} ${lineLabel ?? (second ? "línea inferior" : "línea superior")}`}
        onChange={(event) => onSet(key(name), event.target.value)}
      />
    </label>
  );
  const effectToggle = (name: string, label: string, enabled: boolean) => (
    <div className="text-effect-header">
      <h4>{label}</h4>
      <button
        type="button"
        className="text-effect-switch"
        role="switch"
        aria-checked={enabled}
        aria-label={
          label +
          " " +
          (lineLabel ?? (second ? "línea inferior" : "línea superior"))
        }
        onClick={() => onSet(key(name), !enabled)}
      >
        <span />
      </button>
    </div>
  );
  return (
    <div className="line-text-editor">
      <section className="text-typography-card">
        <label>
          Tipografía
          <select
            value={
              second
                ? (s.secondFontFamily ?? "Impact")
                : (s.fontFamily ?? "Arial")
            }
            onChange={(event) => onSet(key("fontFamily"), event.target.value)}
          >
            {fonts.map((font) => (
              <option key={font}>{font}</option>
            ))}
          </select>
        </label>
        <div
          className="text-format-buttons"
          role="group"
          aria-label="Formato del texto"
        >
          {(["bold", "italic", "underline"] as const).map((name, i) => (
            <button
              type="button"
              key={name}
              aria-label={["Negrita", "Cursiva", "Subrayado"][i]}
              title={["Negrita", "Cursiva", "Subrayado"][i]}
              aria-pressed={appearance[name]}
              onClick={() => onSet(key(name), !appearance[name])}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <text
                  x="12"
                  y="17"
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="19"
                  fontFamily="Arial"
                  fontWeight={name === "bold" ? "900" : "500"}
                  fontStyle={name === "italic" ? "italic" : "normal"}
                  textDecoration={name === "underline" ? "underline" : "none"}
                >
                  {["B", "I", "U"][i]}
                </text>
              </svg>
            </button>
          ))}
        </div>
        {range("fontSize", "Tamaño", Number(get("fontSize", 64)), 16, 180)}
        <div className="text-main-colors">
          {color("color", "Color de texto", String(get("color", "#ffffff")))}
          {!staticImage &&
            color(
              "activeColor",
              "Resaltado",
              String(get("activeColor", "#c8ff59")),
            )}
        </div>
      </section>
      <section className="text-effect-card">
        {effectToggle("outlineEnabled", "Contorno", appearance.outlineEnabled)}
        {appearance.outlineEnabled && (
          <div className="text-effect-properties">
            {color("outline", "Color", String(get("outline", "#111111")))}
            {range(
              "outlineOpacity",
              "Opacidad",
              appearance.outlineOpacity,
              0,
              1,
              0.01,
            )}
            {range("outlineSize", "Tamaño", appearance.outlineSize, 0, 20, 0.5)}
          </div>
        )}
      </section>
      <section className="text-effect-card">
        {effectToggle("shadowEnabled", "Sombra", appearance.shadowEnabled)}
        {appearance.shadowEnabled && (
          <div className="text-effect-properties">
            {color("shadowColor", "Color", appearance.shadowColor)}
            {range(
              "shadowOpacity",
              "Opacidad",
              appearance.shadowOpacity,
              0,
              1,
              0.01,
            )}
            {range("shadowSize", "Tamaño", appearance.shadowSize, 0, 80)}
          </div>
        )}
      </section>
      <section className="text-transform-card">
        <h4>Mayúsculas y minúsculas</h4>
        <div
          className="text-case-buttons"
          role="group"
          aria-label="Mayúsculas y minúsculas"
        >
          {(
            [
              ["upper", "AA", "Mayúsculas"],
              ["lower", "aa", "Minúsculas"],
              ["original", "↶", "Texto original"],
              ["capitalize", "Aa", "Primera letra mayúscula"],
            ] as const
          ).map(([mode, icon, label]) => (
            <button
              type="button"
              key={mode}
              aria-label={label}
              title={label}
              aria-pressed={appearance.textCase === mode}
              onClick={() => onSet(key("textCase"), mode)}
            >
              <span aria-hidden="true">{icon}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="text-motion-card">
        {!staticImage && (
          <label>
            Animación
            <select
              value={String(get("animation", "karaoke"))}
              onChange={(event) => onSet(key("animation"), event.target.value)}
            >
              {animations.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}
        {range(
          "letterSpacing",
          "Espaciado entre letras",
          Number(get("letterSpacing", 0)),
          -3,
          30,
          0.5,
        )}
      </section>
    </div>
  );
}
