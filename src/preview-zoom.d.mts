export type PreviewView = { zoom: number; x: number; y: number };
export function zoomPreview(
  view: PreviewView,
  requested: number,
  pointer: { x: number; y: number },
  width: number,
  height: number,
): PreviewView;
