import type { Project } from "./Video";
import type { CoverSettings } from "./cover.mjs";
export type CoverLine = Partial<Project["style"]> & {
  offsetX?: number;
  offsetY?: number;
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  outline: string;
};
export const coverFonts: string[];
export function getCoverLines(cover: CoverSettings): CoverLine[];
export function distributeCoverTitle(title: string, count: number): string[];
export function validateCoverLines(lines: unknown): void;
export function drawCoverLines(
  ctx: CanvasRenderingContext2D,
  cover: CoverSettings,
  safeGuide: boolean,
  onLayout?: (layout: CoverTextRect[]) => void,
): import("./caption-position.mjs").CaptionBounds;

export type CoverTextRect = {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
};
export function hitCoverLine(
  layout: CoverTextRect[],
  x: number,
  y: number,
): number | null;
export function toggleCoverSelection(
  current: number[],
  index: number | null,
  additive?: boolean,
): number[];
export function moveCoverSelection(
  cover: CoverSettings,
  layout: CoverTextRect[],
  selected: number[],
  dx: number,
  dy: number,
  safeGuide: boolean,
): CoverLine[];
