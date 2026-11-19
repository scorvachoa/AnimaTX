import React, { useEffect, useRef, useState } from "react";
import { readApiResponse } from "./api-response.mjs";
const fallbackModels = [{ id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" }];
export function GeminiSettings({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (configured: boolean) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const modelsRequest = useRef<AbortController | null>(null);
  const [models, setModels] = useState(fallbackModels),
    [modelsLoading, setModelsLoading] = useState(false),
    [modelsError, setModelsError] = useState("");
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
        if (c.configured) void loadModels("");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    return () => modelsRequest.current?.abort();
  }, []);
  async function loadModels(apiKey = key) {
    modelsRequest.current?.abort();
    const controller = new AbortController();
    modelsRequest.current = controller;
    setModelsLoading(true);
    setModelsError("");
    try {
      const response = await fetch("/api/gemini/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
        signal: controller.signal,
      });
      const result = await readApiResponse(response);
      if (controller.signal.aborted) return;
      setModels(result.models);
      if (!result.models.length)
        setModelsError("No se encontraron modelos de texto para esta clave.");
    } catch (error) {
      if (!controller.signal.aborted) setModelsError((error as Error).message);
    } finally {
      if (!controller.signal.aborted) setModelsLoading(false);
    }
  }
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
              onChange={(e) => {
                modelsRequest.current?.abort();
                setModelsLoading(false);
                setModelsError("");
                setModels(fallbackModels);
                setKey(e.target.value);
              }}
            />
          </label>
          <label>
            Modelo
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setTestMessage("");
              }}
              disabled={modelsLoading}
            >
              {!models.some((entry) => entry.id === model) && model && (
                <option value={model}>{model} (actual)</option>
              )}
              {models.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name} · {entry.id}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="gemini-models-refresh"
            disabled={modelsLoading || (!key.trim() && !configured)}
            onClick={() => loadModels()}
          >
            {modelsLoading
              ? "Cargando modelos…"
              : "↻ Cargar modelos disponibles"}
          </button>
          {modelsError && (
            <p className="gemini-models-notice" role="status">
              {modelsError}
            </p>
          )}

          <button
            className="primary"
            type="submit"
            disabled={modelsLoading || !model}
          >
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
