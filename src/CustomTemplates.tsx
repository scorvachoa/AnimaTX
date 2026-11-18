import React, { useEffect, useState } from "react";
import { Project } from "./Video";
import { scaleTemplateStyle, CustomTemplate } from "./custom-templates.mjs";
async function request(path = "", method = "GET", body?: unknown) {
  const r = await fetch("/api/templates" + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw Error(j.error);
  return j;
}
export function CustomTemplates({
  project,
  disabled,
  onApply,
}: {
  project: Project;
  disabled: boolean;
  onApply: (style: Project["style"], name: string) => void;
}) {
  const [items, setItems] = useState<CustomTemplate[]>([]),
    [name, setName] = useState(""),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    request()
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);
  async function change(action: () => Promise<unknown>) {
    setPending(true);
    setError("");
    try {
      await action();
      setItems(await request());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="personal-templates">
      <h3>Mis plantillas</h3>

      <div className="inline-form">
        <input
          aria-label="Nombre de plantilla"
          maxLength={60}
          placeholder="Nombre de tu plantilla"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={disabled || pending}
        />
        <button
          disabled={disabled || pending || !name.trim()}
          onClick={() =>
            change(async () => {
              await request("", "POST", {
                name,
                width: project.width,
                style: project.style,
              });
              setName("");
            })
          }
        >
          Guardar estilo
        </button>
      </div>
      {items.map((t) => (
        <div className="personal-template" key={t.id}>
          <button
            className="apply-personal"
            disabled={disabled || pending}
            onClick={() =>
              onApply(scaleTemplateStyle(t, project.width), t.name)
            }
          >
            <span
              style={{
                fontFamily: t.style.fontFamily,
                color: t.style.color,
                WebkitTextStroke: `1px ${t.style.outline}`,
              }}
            >
              Aa
            </span>
            <b>{t.name}</b>
          </button>
          <div className="personal-actions">
            <button
              disabled={disabled || pending}
              onClick={() => {
                const next = prompt("Nombre de la plantilla", t.name);
                if (next?.trim())
                  change(() => request("/" + t.id, "PUT", { name: next }));
              }}
            >
              Renombrar
            </button>
            <button
              disabled={disabled || pending}
              onClick={() =>
                change(() =>
                  request("", "POST", {
                    ...t,
                    name: t.name.slice(0, 50) + " (copia)",
                  }),
                )
              }
            >
              Duplicar
            </button>
            <button
              disabled={disabled || pending}
              onClick={() => {
                if (confirm(`¿Eliminar la plantilla «${t.name}»?`))
                  change(() => request("/" + t.id, "DELETE"));
              }}
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
    </section>
  );
}
