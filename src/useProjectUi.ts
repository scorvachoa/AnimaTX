import { useMemo, useState } from "react";
import { editorUiDefaults, normalizeEditorUi, EditorUi } from "./editor-ui.mjs";
export function useProjectUi(projectId?: string) {
  const [cache, setCache] = useState<Record<string, EditorUi>>({});
  const key = projectId ?? "new";
  const saved = useMemo(() => {
    try {
      return normalizeEditorUi(
        JSON.parse(sessionStorage.getItem("animatx-ui:" + key) || "null"),
      );
    } catch {
      return editorUiDefaults;
    }
  }, [key]);
  const ui = cache[key] ?? saved;
  function set<K extends keyof EditorUi>(field: K, value: EditorUi[K]) {
    setCache((current) => {
      const next = normalizeEditorUi({
        ...(current[key] ?? saved),
        [field]: value,
      });
      try {
        sessionStorage.setItem("animatx-ui:" + key, JSON.stringify(next));
      } catch {}
      return { ...current, [key]: next };
    });
  }
  return { ui, set };
}
