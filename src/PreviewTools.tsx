import React, { useState } from "react";
export type PreviewGuideSettings = {
  guide: boolean;
  grid: boolean;
  guideOpacity: number;
  gridOpacity: number;
  guideColor: string;
  gridColor: string;
};
function Icon({ kind }: { kind: string }) {
  const paths: Record<string, string> = {
    guide: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 8h8v8H8Z",
    grid: "M3 3h18v18H3ZM9 3v18m6-18v18M3 9h18M3 15h18",
    full: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
    exit: "M3 8h5V3m8 0v5h5M8 21v-5H3m18 0h-5v5",
    reset: "M3 10a9 9 0 1 1 2 8M3 4v6h6",
  };
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[kind]} />
    </svg>
  );
}
export function PreviewTools({
  settings,
  onChange,
  supportsGuide,
  fullscreen,
  onFullscreen,
  onReset,
  zoom,
  error,
}: {
  settings: PreviewGuideSettings;
  onChange: (value: PreviewGuideSettings) => void;
  supportsGuide: boolean;
  fullscreen: boolean;
  onFullscreen: () => void;
  onReset: () => void;
  zoom: number;
  error: string;
}) {
  const [panel, setPanel] = useState<"guide" | "grid" | null>(null);
  const isGuide = panel === "guide";
  return (
    <div className="preview-tools">
      <div
        className="preview-tools-rail"
        aria-label="Herramientas de vista previa"
      >
        {(["guide", "grid"] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            aria-label={
              kind === "guide" ? "Ajustes de guía" : "Ajustes de grilla"
            }
            aria-expanded={panel === kind}
            className={panel === kind ? "active" : ""}
            onClick={() => setPanel(panel === kind ? null : kind)}
          >
            <Icon kind={kind} />
            <span>{kind === "guide" ? "Guía" : "Grilla"}</span>
            <i
              className={
                settings[kind] && (kind !== "guide" || supportsGuide)
                  ? "enabled"
                  : ""
              }
            />
          </button>
        ))}
        <div className="preview-tools-divider" />
        <button
          type="button"
          onClick={onFullscreen}
          title={
            fullscreen ? "Salir de pantalla completa" : "Pantalla completa"
          }
          aria-label={
            fullscreen ? "Salir de pantalla completa" : "Pantalla completa"
          }
        >
          <Icon kind={fullscreen ? "exit" : "full"} />
          <span>{fullscreen ? "Salir" : "Pantalla completa"}</span>
        </button>
        <button
          type="button"
          onClick={onReset}
          title="Restablecer vista previa al 100%"
          aria-label="Restablecer vista previa al 100%"
        >
          <Icon kind="reset" />
          <span>Ajustar</span>
          <small>{Math.round(zoom * 100)}%</small>
        </button>
      </div>
      {panel && (
        <section
          className="preview-tool-panel"
          aria-label={isGuide ? "Ajustes de guía" : "Ajustes de grilla"}
        >
          <header>
            <h3>{isGuide ? "Guía de zona segura" : "Grilla 3×3"}</h3>
            <button
              type="button"
              onClick={() => setPanel(null)}
              aria-label="Cerrar ajustes de preview"
            >
              ×
            </button>
          </header>
          <label className="preview-tool-switch">
            <span>Mostrar {isGuide ? "guía" : "grilla"}</span>
            <input
              type="checkbox"
              checked={settings[panel]}
              disabled={isGuide && !supportsGuide}
              onChange={(e) =>
                onChange({ ...settings, [panel]: e.target.checked })
              }
            />
          </label>
          {isGuide && !supportsGuide && (
            <p role="status">Disponible en videos 9:16.</p>
          )}
          <div className="preview-tool-section">
            <label htmlFor="preview-guide-opacity">Opacidad</label>
            <div className="preview-tool-range">
              <input
                id="preview-guide-opacity"
                type="range"
                min="0"
                max="100"
                value={Math.round(
                  (isGuide ? settings.guideOpacity : settings.gridOpacity) *
                    100,
                )}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    [isGuide ? "guideOpacity" : "gridOpacity"]:
                      +e.target.value / 100,
                  })
                }
              />
              <output>
                {Math.round(
                  (isGuide ? settings.guideOpacity : settings.gridOpacity) *
                    100,
                )}
                %
              </output>
            </div>
          </div>
          <label className="preview-tool-color">
            <span>Color</span>
            <input
              aria-label={isGuide ? "Color de la guía" : "Color de la grilla"}
              type="color"
              value={isGuide ? settings.guideColor : settings.gridColor}
              onChange={(e) =>
                onChange({
                  ...settings,
                  [isGuide ? "guideColor" : "gridColor"]: e.target.value,
                })
              }
            />
            <code>{isGuide ? settings.guideColor : settings.gridColor}</code>
          </label>
        </section>
      )}
      {error && (
        <div className="preview-tools-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
