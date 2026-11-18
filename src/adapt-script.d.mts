import type { Word } from "./Video";
export function adaptScript(
  script: string,
  words: Word[],
  duration: number,
): { words: Word[]; estimated: boolean };
