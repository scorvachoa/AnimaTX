import type { Word } from "./Video";
export type ComparisonPart = {
  kind: "equal" | "change";
  reference: string[];
  transcript: string[];
  wordIndex: number;
};
export function compareScript(script: string, words: Word[]): ComparisonPart[];
