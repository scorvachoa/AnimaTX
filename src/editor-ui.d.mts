export type EditorUi = {
  styleTab: string;
  subtitleTab: string;
  styleSection: string;
  selectedLine: string;
  coverSection: string;
};
export const editorUiDefaults: EditorUi;
export function normalizeEditorUi(value: unknown): EditorUi;
