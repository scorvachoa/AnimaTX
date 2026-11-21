export const editorUiDefaults = {
  styleTab: "templates",
  subtitleTab: "text",
  styleSection: "text",
  selectedLine: "upper",
  coverSection: "template",
};
const choices = {
  styleTab: ["templates", "customize"],
  subtitleTab: ["text", "phrases"],
  styleSection: ["layout", "text", "position"],
  selectedLine: ["upper", "lower"],
  coverSection: ["template", "title", "crop"],
};
export function normalizeEditorUi(value) {
  return Object.fromEntries(
    Object.entries(editorUiDefaults).map(([key, fallback]) => [
      key,
      choices[key].includes(value?.[key]) ? value[key] : fallback,
    ]),
  );
}
