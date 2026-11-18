import React from "react";
import { fonts, Project } from "./Video";
type Style = Project["style"];
import { animations } from "./text-animations.mjs";
import { defaultLeadMs } from "./caption-time.mjs";
export function StylePanel({
  style: s,
  onChange,
  disabled,
}: {
  style: Style;
  onChange: (s: Style) => void;
  disabled: boolean;
}) {
  const set = (key: keyof Style, value: unknown) =>
    onChange({
      ...s,
      ...(s.twoLines
        ? {
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
    const keys = second
      ? ({
          font: "secondFontFamily",
          size: "secondFontSize",
          color: "secondColor",
          active: "secondActiveColor",
          outline: "secondOutline",
          animation: "secondAnimation",
          spacing: "secondLetterSpacing",
          upper: "secondUppercase",
        } as const)
      : ({
          font: "fontFamily",
          size: "fontSize",
          color: "color",
          active: "activeColor",
          outline: "outline",
          animation: "animation",
          spacing: "letterSpacing",
          upper: "uppercase",
        } as const);
    const font = second
      ? (s.secondFontFamily ?? "Impact")
      : (s.fontFamily ?? "Arial");
    return (
      <details
        open
        className="style-card"
        aria-label={
          s.twoLines
            ? second
              ? "Línea inferior"
              : "Línea superior"
            : "Estilo del texto"
        }
      >
        <summary className="style-card-title">
          <span className="line-badge">{second ? "02" : "01"}</span>
          <div>
            <h3>
              {s.twoLines
                ? second
                  ? "Línea inferior"
                  : "Línea superior"
                : "Estilo del texto"}
            </h3>
          </div>
          <span className="collapse-chevron" aria-hidden="true">
            ⌄
          </span>
        </summary>
        <label>
          Tipografía
          <select value={font} onChange={(e) => set(keys.font, e.target.value)}>
            {fonts.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
        {slider(
          keys.size,
          "Tamaño",
          second ? (s.secondFontSize ?? s.fontSize) : s.fontSize,
          16,
          180,
        )}
        <div className="colors">
          {[
            [
              keys.color,
              "Texto",
              second ? (s.secondColor ?? s.color) : s.color,
            ],
            [
              keys.active,
              "Resaltado",
              second ? (s.secondActiveColor ?? s.activeColor) : s.activeColor,
            ],
            [
              keys.outline,
              "Borde",
              second ? (s.secondOutline ?? s.outline) : s.outline,
            ],
          ].map(([key, label, value]) => (
            <label key={key}>
              <input
                type="color"
                aria-label={`${label} ${second ? "línea inferior" : "línea superior"}`}
                value={value}
                onChange={(e) => set(key as keyof Style, e.target.value)}
              />
              {label}
            </label>
          ))}
        </div>
        <label>
          Animación
          <select
            value={second ? (s.secondAnimation ?? s.animation) : s.animation}
            onChange={(e) => set(keys.animation, e.target.value)}
          >
            {animations.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {slider(
          keys.spacing,
          "Espaciado entre letras",
          second
            ? (s.secondLetterSpacing ?? s.letterSpacing ?? 0)
            : (s.letterSpacing ?? 0),
          -3,
          30,
          0.5,
        )}
        <label>
          Mayúsculas
          <select
            value={
              (second ? (s.secondUppercase ?? s.uppercase) : s.uppercase)
                ? "upper"
                : "original"
            }
            onChange={(e) => set(keys.upper, e.target.value === "upper")}
          >
            <option value="original">Texto original</option>
            <option value="upper">TODO EN MAYÚSCULAS</option>
          </select>
        </label>
      </details>
    );
  }
  return (
    <fieldset disabled={disabled}>
      <div className="section-title">02 / ESTILO</div>
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
      {line(false)}
      {s.twoLines && line(true)}
      <section className="style-card block-settings">
        <div className="style-card-title">
          <div>
            <h3>Bloque completo</h3>
          </div>
        </div>
        {slider("y", "Posición vertical", s.y, 5, 95)}
        {slider("x", "Posición horizontal", s.x ?? 50, 5, 95)}
        <label>
          Sincronización{" "}
          <output>
            {(s.captionLeadMs ?? defaultLeadMs) > 0
              ? `${s.captionLeadMs ?? defaultLeadMs} ms antes`
              : (s.captionLeadMs ?? defaultLeadMs) < 0
                ? `${Math.abs(s.captionLeadMs!)} ms después`
                : "Sin ajuste"}
          </output>
          <input
            type="range"
            min="-1000"
            max="1000"
            step="10"
            value={s.captionLeadMs ?? defaultLeadMs}
            onChange={(e) => set("captionLeadMs", +e.target.value)}
          />
        </label>

        <div className="sync-presets">
          <button type="button" onClick={() => set("captionLeadMs", 0)}>
            Sin ajuste
          </button>
          <button type="button" onClick={() => set("captionLeadMs", 150)}>
            Adelantar 150 ms
          </button>
        </div>
        {slider(
          "wordsPerBlock",
          "Palabras por bloque",
          s.wordsPerBlock,
          s.twoLines ? 2 : 1,
          8,
        )}
        {s.twoLines && (
          <>
            {slider(
              "lineGap",
              "Separación entre líneas",
              s.lineGap ?? 0,
              -20,
              150,
            )}
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
                <option value="auto">Mitad del bloque</option>
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
      </section>
    </fieldset>
  );
}
