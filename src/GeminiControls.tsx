import React, { useState } from "react";
export function GeminiControls({
  configured,
  busy,
  setBusy,
  onConfigure,
}: {
  configured: boolean;
  busy: boolean;
  setBusy: (busy: boolean) => void;
  onConfigure: () => void;
}) {
  const [message, setMessage] = useState(""),
    [testing, setTesting] = useState(false),
    [error, setError] = useState("");
  async function test() {
    setTesting(true);
    setBusy(true);
    setError("");
    setMessage("Probando conexión con Gemini…");
    try {
      const r = await fetch("/api/gemini/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.error || "No se pudo probar Gemini");
      setMessage(result.message);
    } catch (e) {
      setError((e as Error).message);
      setMessage("");
    } finally {
      setTesting(false);
      setBusy(false);
    }
  }
  return (
    <section className="gemini-controls">
      <div className="ai-card-heading">
        <div className="ai-provider-icon">✦</div>
        <div>
          <h3>Gemini</h3>
          <span className={`ai-connection-badge ${configured ? "ready" : ""}`}>
            {configured ? "● Configurado" : "○ Sin configurar"}
          </span>
        </div>
      </div>

      <div className="gemini-control-actions">
        <button
          disabled={busy}
          onClick={() => {
            setMessage("");
            setError("");
            onConfigure();
          }}
        >
          ⚙ Configurar
        </button>
        <button disabled={busy || !configured} onClick={test}>
          {testing ? "Probando…" : "↗ Probar conexión"}
        </button>
      </div>

      {message && (
        <p className="connection-success" role="status">
          {message}
        </p>
      )}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
    </section>
  );
}
