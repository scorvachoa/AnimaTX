export function filmstripTiles(
  contentWidth,
  viewportWidth,
  scrollLeft,
  aspect,
  frameCount,
) {
  const height = 64,
    width = Math.max(22, Math.round(height * aspect));
  if (!contentWidth || !frameCount) return [];
  const from = Math.max(0, Math.floor(scrollLeft / width) - 1),
    to = Math.min(
      Math.ceil(contentWidth / width),
      Math.ceil((scrollLeft + viewportWidth) / width) + 1,
    ),
    tiles = [];
  for (let i = from; i < to; i++) {
    const ratio = Math.min(0.999999, (i * width + width / 2) / contentWidth);
    tiles.push({
      left: i * width,
      width,
      height,
      index: Math.min(frameCount - 1, Math.floor(ratio * frameCount)),
    });
  }
  return tiles;
}
