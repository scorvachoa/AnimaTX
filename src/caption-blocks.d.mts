import type { Word } from "./Video";
export function activeCaptionBlock(
  blocks: Word[][],
  time: number,
): Word[] | undefined;
export function captionBlocks(words: Word[], limit?: number): Word[][];
export function captionLineSplit(words: Word[], preferred?: number): number;
export function editCaptionBlocks(
  words: Word[],
  limit: number,
  action: "auto" | "join" | "split",
  wordId?: string,
): Word[];
