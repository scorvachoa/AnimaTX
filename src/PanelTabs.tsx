import React, { useId, useRef } from "react";
export function PanelTabs({
  label,
  items,
  value,
  onChange,
  panelIds,
}: {
  label: string;
  items: readonly (readonly [string, string])[];
  value: string;
  onChange: (value: string) => void;
  panelIds?: Record<string, string>;
}) {
  const id = useId();
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  return (
    <div className="panel-tabs" role="tablist" aria-label={label}>
      {items.map(([key, title], index) => (
        <button
          type="button"
          role="tab"
          id={`${id}-${key}`}
          aria-selected={value === key}
          aria-controls={panelIds?.[key]}
          tabIndex={value === key ? 0 : -1}
          ref={(button) => {
            if (button) buttons.current.set(key, button);
            else buttons.current.delete(key);
          }}
          key={key}
          onClick={() => onChange(key)}
          onKeyDown={(event) => {
            if (event.ctrlKey || event.altKey || event.metaKey) return;
            let next: number;
            if (event.key === "ArrowRight" || event.key === "ArrowDown")
              next = (index + 1) % items.length;
            else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
              next = (index - 1 + items.length) % items.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = items.length - 1;
            else return;
            event.preventDefault();
            const nextId = items[next][0];
            onChange(nextId);
            buttons.current.get(nextId)?.focus();
          }}
        >
          {title}
        </button>
      ))}
    </div>
  );
}
