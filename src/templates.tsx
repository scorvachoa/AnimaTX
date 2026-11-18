import React from "react";
import { subtitleTemplates, templateStyle } from "./templates-data.mjs";
import { Project } from "./Video";
import { CustomTemplates } from "./CustomTemplates";
export function Templates({
  project,
  disabled,
  onApply,
}: {
  project: Project;
  disabled: boolean;
  onApply: (style: Project["style"], name: string) => void;
}) {
  return (
    <section className="template-gallery">
      <div className="panel-section-heading">
        <h3>Plantillas de subtítulos</h3>
        <span>9 estilos</span>
      </div>

      <div className="templates-grid">
        {subtitleTemplates.map((t) => {
          const style = templateStyle(t.id, project.width),
            selected = Object.entries(style).every(
              ([key, value]) =>
                project.style[key as keyof Project["style"]] === value,
            );
          return (
            <button
              key={t.id}
              className={`template-card ${selected ? "active" : ""}`}
              disabled={disabled}
              onClick={() => onApply(style, t.name)}
              aria-label={`Aplicar plantilla ${t.name}`}
              aria-pressed={selected}
              title={t.description}
            >
              <div
                className={`template-art preset-${t.id}`}
                style={{ background: t.background }}
              >
                <span className="template-tag">
                  {style.twoLines ? "2 LÍNEAS" : "1 LÍNEA"}
                </span>
                <div
                  className="template-sample"
                  style={{
                    fontFamily: style.fontFamily,
                    color: style.color,
                    textTransform: style.uppercase ? "uppercase" : "none",
                    fontSize: t.id === "cine" || t.id === "terminal" ? 13 : 16,
                    letterSpacing: (style.letterSpacing ?? 0) * 0.2,
                  }}
                >
                  {t.sample[0]}
                  <br />
                  <strong
                    style={{
                      fontFamily: style.twoLines
                        ? style.secondFontFamily
                        : style.fontFamily,
                      color: style.twoLines
                        ? style.secondColor
                        : style.animation === "karaoke"
                          ? style.activeColor
                          : style.color,
                      textTransform: (
                        style.twoLines ? style.secondUppercase : style.uppercase
                      )
                        ? "uppercase"
                        : "none",
                    }}
                  >
                    {t.sample[1]}
                  </strong>
                </div>
                {selected && <span className="template-check">✓</span>}
              </div>
              <div className="template-info">
                <b>{t.name}</b>
              </div>
            </button>
          );
        })}
      </div>

      <CustomTemplates
        project={project}
        disabled={disabled}
        onApply={onApply}
      />
    </section>
  );
}
