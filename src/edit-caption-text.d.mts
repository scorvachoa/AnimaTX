import type { Word } from "./Video";
export function blockTextKey(block: Word[]): string;
export function editCaptionText(
  words: Word[],
  limit: number,
  key: string,
  text: string,
): { words: Word[]; estimated: boolean };
export function splitCaptionText(
  words: Word[],
  limit: number,
  key: string,
  text: string,
  cursor: number,
): { words: Word[]; focusKey: string | null };
