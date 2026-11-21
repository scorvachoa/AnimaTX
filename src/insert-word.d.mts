import type { Word } from "./Video";
export function insertWordAt(
  words: Word[],
  index: number,
  duration: number,
  id: string,
  referenceId?: string,
): { words: Word[]; word: Word; adjustedId?: string };
