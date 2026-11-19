import React, { useEffect, useRef, useState } from "react";
export function DeleteProjectModal({
  name,
  onClose,
  onConfirm,
  title = "¿Eliminar proyecto?",
  description = "Se borrarán el video del proyecto, los subtítulos y sus exportaciones. Esta acción no se puede deshacer.",
  confirmLabel = "Eliminar proyecto",
  pendingLabel = "Eliminando…",
  destructive = true,
  onAlternate,
  alternateLabel,
}: {
  name: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
  confirmLabel?: string;
  pendingLabel?: string;
  destructive?: boolean;
  onAlternate?: () => Promise<void>;
  alternateLabel?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const [deleting, setDeleting] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    cancel.current?.focus();
    return () => element?.close();
  }, []);
  async function confirm(action = onConfirm) {
    if (deleting) return;
    setDeleting(true);
    setError("");
    try {
      await action();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className={`delete-project-modal ${destructive ? "" : "neutral-confirmation"}`}
      aria-labelledby="delete-project-title"
      aria-describedby="delete-project-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!deleting) onClose();
      }}
    >
      <div className="delete-project-modal-icon" aria-hidden="true">
        <svg
          width="25"
          height="25"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {confirmLabel === "Eliminar proyecto" ? (
            <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" />
          ) : (
            <>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v6m0 4h.01" />
            </>
          )}
        </svg>
      </div>
      <h2 id="delete-project-title">{title}</h2>
      <div className="delete-project-modal-name">{name}</div>
      <p id="delete-project-description">{description}</p>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <div className="delete-project-modal-actions">
        {onAlternate && (
          <button
            type="button"
            disabled={deleting}
            onClick={() => confirm(onAlternate)}
          >
            {alternateLabel}
          </button>
        )}
        <button
          ref={cancel}
          type="button"
          disabled={deleting}
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="confirm-project-delete"
          disabled={deleting}
          onClick={() => confirm()}
        >
          {deleting ? pendingLabel : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
