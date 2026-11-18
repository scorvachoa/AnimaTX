export const animations: string[][];
export function lineMotion(
  animation: string,
  elapsed: number,
  lineIndex?: number,
): { opacity: number; transform: string };
export function wordMotion(
  animation: string,
  time: number,
  word: { text: string; start: number; end: number },
  size: number,
  index?: number,
  blockStart?: number,
): { opacity: number; transform: string; visibleCharacters: number };
