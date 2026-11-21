import type { CoverLine } from "./cover-lines.mjs";
export type CoverSettings = {
  time: number;
  title: string;
  lines?: CoverLine[];
  template: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  outline: string;
  background: string;
  textBackground: boolean;
  x: number;
  y: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
};
export const coverDefaults: CoverSettings;
export function applyCoverTemplate(
  cover: CoverSettings,
  template: { style: Partial<CoverSettings> },
): CoverSettings;
export const coverTemplates: {
  id: string;
  name: string;
  style: Partial<CoverSettings>;
}[];
export function validateCover(cover: unknown, duration: number): void;
export function coverCrop(
  width: number,
  height: number,
  zoom: number,
  offsetX: number,
  offsetY: number,
): { width: number; height: number; x: number; y: number };
export function wrapCoverTitle(
  text: string,
  measure: (text: string) => number,
  maxWidth: number,
): string[];
export function drawCover(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  cover: CoverSettings,
  safeGuide?: boolean,
  onLayout?: (layout: import("./cover-lines.mjs").CoverTextRect[]) => void,
): import("./caption-position.mjs").CaptionBounds | undefined;
