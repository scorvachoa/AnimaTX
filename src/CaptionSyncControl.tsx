import React from "react";
import { Project } from "./Video";
import { defaultLeadMs } from "./caption-time.mjs";
export function CaptionSyncControl({
  style: s,
  onChange,
  disabled,
}: {
  style: Project["style"];
  onChange: (s: Project["style"]) => void;
  disabled: boolean;
}) {
  const set = (key: "captionLeadMs", value: number) =>
    onChange({ ...s, [key]: value });
  return (
    <fieldset disabled={disabled} className="subtitle-sync">
      {" "}
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
    </fieldset>
  );
}
