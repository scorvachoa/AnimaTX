export const editorUiDefaults = {
  styleTab: "templates",
  subtitleTab: "text",
  styleSection: "text",
  selectedLine: "upper",
  coverSection: "frame",
};
const choices = {
  styleTab: ["templates", "customize"],
  subtitleTab: ["text", "phrases", "timing"],
  styleSection: ["layout", "text", "animation", "position"],
  selectedLine: ["upper", "lower"],
  coverSection: ["frame", "template", "title", "crop"],
};
export function normalizeEditorUi(value) {
  return Object.fromEntries(
    Object.entries(editorUiDefaults).map(([key, fallback]) => [
      key,
      choices[key].includes(value?.[key]) ? value[key] : fallback,
    ]),
  );
}
