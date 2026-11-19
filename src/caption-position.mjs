// Internal positions remain percentages for backwards compatibility.
export function positionOffset(axis, value) {
  const offset = axis === "x" ? value - 50 : 50 - value;
  return Math.abs(offset) < 0.05 ? 0 : Math.round(offset * 10) / 10;
}
export function offsetPosition(axis, offset, snap = true) {
  const value = snap && Math.abs(offset) <= 1 ? 0 : offset;
  return axis === "x" ? 50 + value : 50 - value;
}
export function positionBounds(
  safe,
  halfWidth = 0,
  halfHeight = 0,
  y = 50,
  edges = {},
) {
  const textLeft = edges.left ?? halfWidth,
    textRight = edges.right ?? halfWidth;
  const textTop = edges.top ?? halfHeight,
    textBottom = edges.bottom ?? halfHeight;
  const left = (safe ? (46 / 1080) * 100 : 5) + textLeft;
  const right =
    (safe
      ? ((y + textBottom > (958 / 1920) * 100 ? 886 : 1033) / 1080) * 100
      : 95) - textRight;
  const top = (safe ? (216 / 1920) * 100 : 5) + textTop,
    bottom = (safe ? (1545 / 1920) * 100 : 95) - textBottom;
  return {
    left: Math.max(5, left),
    right: Math.min(95, right),
    top: Math.max(5, top),
    bottom: Math.min(95, bottom),
    fits: left <= right && top <= bottom,
  };
}
export function constrainPosition(
  position,
  safe,
  size = { halfWidth: 0, halfHeight: 0 },
) {
  const clamp = (n, min, max) =>
    min > max ? (min + max) / 2 : Math.max(min, Math.min(max, n));
  let bounds = positionBounds(
    safe,
    size.halfWidth,
    size.halfHeight,
    position.y,
    size,
  );
  const y = clamp(position.y, bounds.top, bounds.bottom);
  bounds = positionBounds(safe, size.halfWidth, size.halfHeight, y, size);
  return { x: clamp(position.x, bounds.left, bounds.right), y };
}
export function alignPosition(position, axis, alignment, safe, size) {
  const bounds = positionBounds(
    safe,
    size.halfWidth,
    size.halfHeight,
    position.y,
    size,
  );
  const value =
    alignment === "center"
      ? 50
      : axis === "x"
        ? alignment === "start"
          ? bounds.left
          : bounds.right
        : alignment === "start"
          ? bounds.top
          : bounds.bottom;
  return constrainPosition({ ...position, [axis]: value }, safe, size);
}
