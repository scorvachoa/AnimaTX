export type CaptionBounds = {
  halfWidth: number;
  halfHeight: number;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
};
export function positionOffset(axis: "x" | "y", value: number): number;
export function offsetPosition(
  axis: "x" | "y",
  offset: number,
  snap?: boolean,
): number;
export function positionBounds(
  safe: boolean,
  halfWidth?: number,
  halfHeight?: number,
  y?: number,
  edges?: Partial<CaptionBounds>,
): { left: number; right: number; top: number; bottom: number; fits: boolean };
export function constrainPosition(
  position: { x: number; y: number },
  safe: boolean,
  size?: CaptionBounds,
): { x: number; y: number };
export function alignPosition(
  position: { x: number; y: number },
  axis: "x" | "y",
  alignment: "start" | "center" | "end",
  safe: boolean,
  size: CaptionBounds,
): { x: number; y: number };
