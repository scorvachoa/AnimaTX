export function zoomPreview(view, requested, pointer, width, height) {
  const zoom = Math.max(0.25, Math.min(4, requested));
  let x = pointer.x - ((pointer.x - view.x) * zoom) / view.zoom,
    y = pointer.y - ((pointer.y - view.y) * zoom) / view.zoom;
  if (zoom <= 1) {
    x = (width * (1 - zoom)) / 2;
    y = (height * (1 - zoom)) / 2;
  } else {
    x = Math.max(width * (1 - zoom), Math.min(0, x));
    y = Math.max(height * (1 - zoom), Math.min(0, y));
  }
  return { zoom, x, y };
}
