import React from "react";
export function EditorSection({
  title,
  open,
  onOpen,
  children,
}: {
  title: string;
  open: boolean;
  onOpen: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="editor-section">
      <h3>
        <button type="button" aria-expanded={open} onClick={onOpen}>
          <span>{title}</span>
          <span aria-hidden="true">{open ? "−" : "+"}</span>
        </button>
      </h3>
      <div className="editor-section-body" hidden={!open}>
        {children}
      </div>
    </section>
  );
}
