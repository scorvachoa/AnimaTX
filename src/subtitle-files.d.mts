import type { Project, Word } from "./Video";
export function applyImportedSubtitles(
  project: Project,
  words: Word[],
): Project;
export function importSubtitles(
  text: string,
  duration: number,
): { words: Word[]; cues: number };
export function exportSubtitles(
  project: Project,
  format?: "srt" | "vtt",
): string;
