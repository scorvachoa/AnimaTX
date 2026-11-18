import type { Word } from "./Video";
export function editWordTiming(
  words: Word[],
  id: string,
  mode: "move" | "start" | "end",
  delta: number,
  duration: number,
): Word[];
