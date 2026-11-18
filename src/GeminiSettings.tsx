import React, { useEffect, useRef, useState } from "react";
export function GeminiSettings({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (configured: boolean) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [configured, setConfigured] = useState(false),
    [key, setKey] = useState(""),
    [model, setModel] = useState(""),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [testing, setTesting] = useState(false),
    [testMessage, setTestMessage] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
    fetch("/api/gemini/config")
      .then(async (r) => {
        const c = await r.json();
        if (!r.ok) throw Error(c.error);
        setConfigured(c.configured);
        setModel(c.model);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const r = await fetch("/api/gemini/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(key ? { apiKey: key } : {}), model }),
      });
      const c = await r.json();
      if (!r.ok) throw Error(c.error);
      setKey("");
      onSaved(c.configured);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  async function testConnection() {
    setTesting(true);
    setError("");
    setTestMessage("Probando conexión…");
    try {
      const r = await fetch("/api/gemini/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(key ? { apiKey: key } : {}), model }),
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.error || "No se pudo probar Gemini");
      setTestMessage(result.message);
    } catch (e) {
      setError((e as Error).message);
      setTestMessage("");
    } finally {
      setTesting(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="gemini-settings"
      onCancel={(e) => {
        if (saving || testing) e.preventDefault();
        else onClose();
      }}
      aria-labelledby="gemini-settings-title"
    >
      <div className="settings-modal-title">
        <div>
          <h2 id="gemini-settings-title">Configurar Gemini</h2>
        </div>
        <button
          type="button"
          disabled={saving || testing}
          aria-label="Cerrar configuración"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <form onSubmit={save}>
        <fieldset disabled={loading || saving || testing}>
          <label>
            API key
            <input
              autoFocus
              type="password"
              autoComplete="new-password"
              value={key}
              placeholder={
                configured
                  ? "Clave guardada · deja vacío para conservar"
                  : "Pega tu clave de Gemini"
              }
              onChange={(e) => setKey(e.target.value)}
            />
          </label>
          <label>
            Modelo
            <input value={model} onChange={(e) => setModel(e.target.value)} />
          </label>

          <button className="primary" type="submit">
            {saving ? "Guardando…" : "Guardar configuración"}
          </button>
          <button
            type="button"
            className="test-gemini-button"
            disabled={!key && !configured}
            onClick={testConnection}
          >
            Probar Gemini
          </button>
        </fieldset>
      </form>
      {loading && <p role="status">Cargando configuración…</p>}
      {testMessage && (
        <p className="connection-success" role="status">
          {testMessage}
        </p>
      )}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
    </dialog>
  );
}
